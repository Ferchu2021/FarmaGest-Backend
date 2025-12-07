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
    marca = null,
    proveedorId = null,
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
        c.nombre as "Categoria",
        pr.proveedor_id,
        pr.razon_social as "Proveedor"
      FROM productos as p
      LEFT JOIN categorias as c on c.categoria_id = p.categoria_id
      LEFT JOIN proveedores as pr on pr.proveedor_id = p.proveedor_id
      WHERE p.deleted_at IS NULL AND (p.nombre LIKE ? OR p.codigo LIKE ? OR p.marca LIKE ?)
    `;
    const params = [searchQuery, searchQuery, searchQuery];
    
    // Agregar filtro por marca
    if (marca && marca.trim() !== "") {
      query += ` AND p.marca = ?`;
      params.push(marca.trim());
    }
    
    // Agregar filtro por proveedor
    if (proveedorId && proveedorId > 0) {
      query += ` AND p.proveedor_id = ?`;
      params.push(parseInt(proveedorId));
    }
    
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
    // Si viene precio_compra_base, el trigger calculará automáticamente el precio
    // Si viene precio, necesitamos calcular precio_compra_base
    let precioFinal = nuevoProducto.precio;
    let precioCompraBase = nuevoProducto.precio_compra_base;
    
    // Si no viene precio_compra_base pero viene precio, calcularlo en reversa
    if (!precioCompraBase && precioFinal) {
      const esMedicamento = nuevoProducto.es_medicamento || false;
      const porcentajeIVA = nuevoProducto.porcentaje_iva || 21;
      const porcentajeGanancia = esMedicamento ? 25 : 30;
      const precioConGananciaEIVA = (1 + porcentajeGanancia / 100) * (1 + porcentajeIVA / 100);
      precioCompraBase = precioFinal / precioConGananciaEIVA;
    }
    
    db.query(
      `INSERT INTO productos (nombre, codigo, marca, categoria_id, stock, precio, proveedor_id, 
       precio_compra_base, es_medicamento, porcentaje_iva) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        nuevoProducto.nombre,
        nuevoProducto.codigo,
        nuevoProducto.marca,
        nuevoProducto.categoria_id || null,
        nuevoProducto.stock,
        precioFinal,
        nuevoProducto.proveedor_id || null,
        precioCompraBase || null,
        nuevoProducto.es_medicamento || false,
        nuevoProducto.porcentaje_iva || 21,
      ],
      (err, result) => {
        if (err) {
          return callback(err, null);
        }
        const productoId = result.rows ? result.rows[0].producto_id : result.insertId;
        db.query(
          `INSERT INTO auditoria_productos (producto_id, accion, detalle_cambio, fecha_movimiento, usuario_id) VALUES ($1, 'CREAR', $2, NOW(), $3)`,
          [productoId, `Se ha creado un nuevo producto ${nuevoProducto.nombre} → Código ${nuevoProducto.codigo}`, usuario_id],
          (err) => {
            if (err) {
              console.error("Error al registrar en auditoría:", err);
            }
          }
        );
        const id = result.rows ? result.rows[0].producto_id : result.insertId;
        callback(null, { id, ...nuevoProducto });
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

        // Calcular precio si se actualiza precio_compra_base
        let precioFinal = producto.precio;
        if (producto.precio_compra_base !== undefined) {
          const esMedicamento = producto.es_medicamento !== undefined ? producto.es_medicamento : productoActual.es_medicamento;
          const porcentajeIVA = producto.porcentaje_iva !== undefined ? producto.porcentaje_iva : (productoActual.porcentaje_iva || 21);
          // El trigger calculará automáticamente el precio, pero podemos pre-calcularlo
          const porcentajeGanancia = esMedicamento ? 25 : 30;
          const precioConGanancia = producto.precio_compra_base * (1 + porcentajeGanancia / 100);
          precioFinal = precioConGanancia * (1 + porcentajeIVA / 100);
        }

        // 4️⃣ Ejecutar la actualización en la base de datos
        db.query(
          `UPDATE productos SET 
            nombre = $1, 
            codigo = $2, 
            marca = $3, 
            categoria_id = $4, 
            stock = $5, 
            precio = $6,
            precio_compra_base = COALESCE($7, precio_compra_base),
            es_medicamento = COALESCE($8, es_medicamento),
            porcentaje_iva = COALESCE($9, porcentaje_iva)
            WHERE producto_id = $10`,
          [
            producto.nombre,
            producto.codigo,
            producto.marca,
            producto.categoria_id || null,
            producto.stock,
            precioFinal,
            producto.precio_compra_base !== undefined ? producto.precio_compra_base : null,
            producto.es_medicamento !== undefined ? producto.es_medicamento : null,
            producto.porcentaje_iva !== undefined ? producto.porcentaje_iva : null,
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

            // Obtener proveedores únicos de productos
            db.query(
              `SELECT DISTINCT pr.proveedor_id, pr.razon_social 
               FROM productos p
               INNER JOIN proveedores pr ON pr.proveedor_id = p.proveedor_id
               WHERE p.deleted_at IS NULL AND p.proveedor_id IS NOT NULL
               ORDER BY pr.razon_social`,
              (err, proveedores) => {
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

                const proveedoresRows = proveedores.rows || proveedores;
                const proveedoresFormatted = proveedoresRows.map((prov) => ({
                  proveedor_id: prov.proveedor_id,
                  razon_social: prov.razon_social || "",
                }));

                callback(null, {
                  categorias: categoriasFormatted,
                  marcas: marcasFormatted,
                  proveedores: proveedoresFormatted,
                });
              }
            );
          }
        );
      }
    );
  }
}

module.exports = Producto;
