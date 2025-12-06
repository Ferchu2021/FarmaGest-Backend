const db = require("../db");

class Producto {
  constructor(nombre, codigo, marca, categoria_id, stock, precio) {
    this.nombre = nombre;
    this.codigo = codigo;
    this.marca = marca;
    this.categoria_id = categoria_id;
    this.stock = stock;
    this.precio = precio;
  }

  static obtenerProductos(
    page = 0,
    pageSize = 6,
    search = "",
    sesion,
    callback
  ) {
    const offset = (page - 1) * pageSize;

    const searchQuery = search ? `%${search}%` : "%";

    let query = `
      SELECT 
        p.producto_id, 
        p.nombre as "Nombre", 
        p.codigo as "Codigo", 
        p.marca as "Marca", 
        p.stock as "Stock", 
        p.precio as "Precio", 
        c.categoria_id, 
        c.nombre as "Categoria" 
      FROM productos as p
      LEFT JOIN categorias as c on c.categoria_id = p.categoria_id
      WHERE p.deleted_at IS NULL AND (p.nombre LIKE ? OR p.codigo LIKE ? OR p.marca LIKE ?)
    `;
    const params = [searchQuery, searchQuery, searchQuery];
    query += ` LIMIT ? OFFSET ?`;
    params.push(pageSize, offset);

    // La actualización de sesión ahora se maneja en el middleware de routes.js
    return db.query(query, params, (err, results) => {
      if (err) {
        return callback(err, null);
      }
      // PostgreSQL devuelve results.rows, MySQL devuelve results directamente
      let rows = results.rows || results;
      // Asegurarse de que rows es un array
      if (!Array.isArray(rows)) {
        console.error("Error: results.rows no es un array. Tipo:", typeof results, "Contenido:", results);
        rows = [];
      }
      callback(null, rows);
    });
  }

  static agregarProducto(nuevoProducto, usuario_id, callback) {
    db.query(
      "INSERT INTO productos (nombre, codigo, marca, categoria_id, stock, precio) VALUES (?, ?, ?, ?, ?,?)",
      [
        nuevoProducto.nombre,
        nuevoProducto.codigo,
        nuevoProducto.marca,
        nuevoProducto.categoria_id,
        nuevoProducto.stock,
        nuevoProducto.precio,
      ],
      (err, result) => {
        if (err) {
          return callback(err, null);
        }
        db.query(
          `INSERT INTO auditoria_productos (producto_id, accion, detalle_cambio, fecha_movimiento, usuario_id) VALUES (?, 'CREAR', 'Se ha creado un nuevo producto ${nuevoProducto.nombre} → Código ${nuevoProducto.codigo}', NOW(), ?)`,
          [result.insertId, usuario_id], // usuario_id por defecto 1 si no está disponible
          (err) => {
            if (err) {
              console.error("Error al registrar en auditoría:", err);
            }
          }
        );
        callback(null, { id: result.insertId, ...nuevoProducto });
      }
    );
  }

  static actualizarProducto(producto_id, producto, callback) {
    // 1️⃣ Obtener el producto actual antes de la actualización
    db.query(
      "SELECT * FROM productos WHERE producto_id = ?",
      [producto_id],
      (err, resultados) => {
        if (err) {
          return callback(err, null);
        }

        if (resultados.length === 0) {
          return callback(new Error("Producto no encontrado"), null);
        }

        const productoActual = resultados[0];
        let detalle_cambio = "";

        // 2️⃣ Comparar campo por campo y generar la descripción del cambio
        if (producto.nombre !== productoActual.nombre) {
          detalle_cambio += `Nombre: ${productoActual.nombre} → ${producto.nombre}; `;
        }
        if (producto.codigo !== productoActual.codigo) {
          detalle_cambio += `Código: ${productoActual.codigo} → ${producto.codigo}; `;
        }
        if (producto.marca !== productoActual.marca) {
          detalle_cambio += `Marca: ${productoActual.marca} → ${producto.marca}; `;
        }
        if (producto.categoria_id !== productoActual.categoria_id) {
          detalle_cambio += `Categoría: ${productoActual.categoria_id} → ${producto.categoria_id}; `;
        }
        if (producto.stock !== productoActual.stock) {
          detalle_cambio += `Stock: ${productoActual.stock} → ${producto.stock}; `;
        }
        if (producto.precio !== productoActual.precio) {
          detalle_cambio += `Precio: ${productoActual.precio} → ${producto.precio}; `;
        }

        // 4️⃣ Ejecutar la actualización en la base de datos
        db.query(
          "UPDATE productos SET nombre = ?, codigo = ?, marca = ?, categoria_id = ?, stock = ?, precio = ? WHERE producto_id = ?",
          [
            producto.nombre,
            producto.codigo,
            producto.marca,
            producto.categoria_id,
            producto.stock,
            producto.precio,
            parseInt(producto_id),
          ],
          callback
        );

        if (detalle_cambio !== "") {
          db.query(
            "INSERT INTO auditoria_productos (producto_id, accion, detalle_cambio, fecha_movimiento, usuario_id) VALUES (?, 'ACTUALIZAR', ?, NOW(), ?)",
            [producto_id, detalle_cambio, producto.usuario_id], // usuario_id por defecto 1 si no está disponible
            (err) => {
              if (err) {
                console.error("Error al registrar en auditoría:", err);
              }
            }
          );
        }
      }
    );
  }

  static eliminarProducto(
    producto_id,
    usuario_id,
    productoNombre,
    productoCodigo,
    callback
  ) {
    db.query(
      `INSERT INTO auditoria_productos (producto_id, accion, fecha_movimiento,detalle_cambio, usuario_id) VALUES (?, 'ELIMINAR', NOW(),'Se ha eliminado este producto ${productoNombre} → Código ${productoCodigo}',?)`,
      [producto_id, usuario_id],
      (err) => {
        if (err) {
          console.error("Error al registrar en auditoría:", err);
        }
      }
    );

    return db.query(
      "UPDATE productos SET deleted_at = NOW() WHERE producto_id = ?",
      [producto_id],
      callback
    );
  }

  static obtenerCategorias(callback) {
    return db.query("SELECT categoria_id, nombre FROM categorias ORDER BY nombre", (err, results) => {
      if (err) {
        return callback(err, null);
      }
      // PostgreSQL devuelve results.rows, MySQL devuelve results directamente
      const rows = results.rows || results;
      callback(null, rows);
    });
  }

  static obtenerFiltros(callback) {
    // Obtener categorías
    db.query(
      "SELECT categoria_id, nombre FROM categorias ORDER BY nombre",
      (err, categorias) => {
        if (err) {
          return callback(err, null);
        }

        // Obtener marcas únicas
        db.query(
          "SELECT DISTINCT marca FROM productos WHERE marca IS NOT NULL AND marca != '' AND deleted_at IS NULL ORDER BY marca",
          (err, marcas) => {
            if (err) {
              return callback(err, null);
            }

            // Convertir resultados de PostgreSQL a formato esperado
            const categoriasRows = categorias.rows || categorias;
            const categoriasFormatted = categoriasRows.map((cat) => ({
              categoria_id: cat.categoria_id,
              nombre: cat.nombre,
            }));

            const marcasRows = marcas.rows || marcas;
            // Convertir a array de strings para evitar problemas con React
            const marcasFormatted = marcasRows
              .map((m) => m.marca || m.Marca || "")
              .filter((m) => m !== "")
              .sort();

            callback(null, {
              categorias: categoriasFormatted,
              marcas: marcasFormatted,
            });
          }
        );
      }
    );
  }
}

module.exports = Producto;
