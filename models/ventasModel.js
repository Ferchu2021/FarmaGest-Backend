const db = require("../db");
const ItemVenta = require("./itemsVentaModel");

class Venta {
  constructor(
    cliente_id,
    usuario_id,
    fecha_hora,
    totalConDescuento,
    totalSinDescuento,
    itemsAgregados
  ) {
    this.cliente_id = cliente_id;
    this.usuario_id = usuario_id;
    this.fecha_hora = fecha_hora;
    this.totalConDescuento = totalConDescuento;
    this.totalSinDescuento = totalSinDescuento;
    this.itemsAgregados = itemsAgregados; // Array de items asociados a la venta
  }

  static obtenerTodasLasVentas(
    { page = 1, pageSize = 10, search = "", sesion },
    callback
  ) {
    const offset = (page - 1) * pageSize;
    const searchQuery = search ? `%${search}%` : "%";

    let queryVentas = `
      SELECT v.venta_id, v.fecha_hora, v.numero_factura, c.nombre AS cliente_nombre, 
      c.apellido AS cliente_apellido, u.nombre AS usuario_nombre, u.apellido AS usuario_apellido,
      v.total, v.total_sin_descuento, v.descuento
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.cliente_id
      LEFT JOIN usuarios u ON v.usuario_id = u.usuario_id
      WHERE 1=1
    `;
    
    // Solo agregar filtro de búsqueda si hay un término de búsqueda
    if (search && search.trim() !== "") {
      queryVentas += ` AND (c.nombre LIKE ? OR c.apellido LIKE ? OR u.nombre LIKE ? OR u.apellido LIKE ? OR v.numero_factura::text LIKE ?)`;
    }
    
    queryVentas += ` ORDER BY v.fecha_hora DESC LIMIT ? OFFSET ?`;

    // Construir parámetros según si hay búsqueda o no
    const params = [];
    if (search && search.trim() !== "") {
      params.push(searchQuery, searchQuery, searchQuery, searchQuery, searchQuery);
    }
    params.push(pageSize, offset);
    
    db.query(
      queryVentas,
      params,
      (err, ventasResult) => {
        if (err) return callback(err);

        // PostgreSQL devuelve results.rows, MySQL devuelve results directamente
        const ventas = ventasResult.rows || ventasResult;
        
        if (!ventas || ventas.length === 0) {
          return callback(null, []);
        }

        const ventaIds = ventas.map((venta) => venta.venta_id);

        // Crear placeholders dinámicos para la query IN()
        // Si no hay IDs, retornar vacío directamente
        if (ventaIds.length === 0) {
          return callback(null, ventas.map((venta) => ({ ...venta, itemsAgregados: [] })));
        }

        const placeholders = ventaIds.map(() => "?").join(",");
        const queryItems = `
        SELECT iv.venta_id, iv.producto_id, p.nombre AS producto_nombre, iv.cantidad, iv.precio_unitario, iv.total_item
        FROM items_venta iv
        JOIN productos p ON iv.producto_id = p.producto_id
        WHERE iv.venta_id IN (${placeholders})
      `;

        db.query(queryItems, ventaIds, (err, itemsResult) => {
          if (err) return callback(err);

          // PostgreSQL devuelve results.rows, MySQL devuelve results directamente
          const itemsAgregados = itemsResult.rows || itemsResult;

          const ventasConItems = ventas.map((venta) => {
            const itemsDeVenta = itemsAgregados.filter(
              (item) => item.venta_id === venta.venta_id
            );
            return { ...venta, itemsAgregados: itemsDeVenta };
          });

          // La actualización de sesión ahora se maneja en el middleware de routes.js
          callback(null, ventasConItems);
        });
      }
    );
  }

  static obtenerVentaConItemsPorId(venta_id, callback) {
    const queryVenta = `
      SELECT v.venta_id, v.fecha_hora, v.total, v.total_sin_descuento, v.descuento,
      c.nombre AS cliente_nombre,
      c.apellido AS cliente_apellido, 
      u.nombre AS usuario_nombre,
      u.apellido AS usuario_apellido
      FROM ventas v
      JOIN clientes c ON v.cliente_id = c.cliente_id
      JOIN usuarios u ON v.usuario_id = u.usuario_id
      WHERE v.venta_id = ?
    `;

    db.query(queryVenta, [venta_id], (err, resultados) => {
      if (err) return callback(err);
      
      // PostgreSQL devuelve results.rows, MySQL devuelve results directamente
      const rows = resultados.rows || resultados;
      
      if (!rows || rows.length === 0) return callback(null, null);

      const venta = rows[0];

      ItemVenta.obtenerItemsPorVenta(venta_id, (err, items) => {
        if (err) return callback(err);
        
        // Asegurarse de que items sea un array
        const itemsArray = items.rows || items || [];
        venta.items = itemsArray;
        callback(null, venta);
      });
    });
  }
  static obtenerUltimaVenta(callback) {
    const queryVenta = `SELECT venta_id FROM ventas ORDER BY venta_id DESC LIMIT 1`;

    db.query(queryVenta, [], (err, resultados) => {
      if (err) return callback(err);
      
      // PostgreSQL devuelve results.rows, MySQL devuelve results directamente
      const rows = resultados.rows || resultados;
      
      if (!rows || rows.length === 0) return callback(null, null); // No hay ventas registradas.

      // Asegurarte de que estás accediendo correctamente a venta_id de resultados
      const ventaId = rows[0].venta_id;
      callback(null, ventaId); // Devuelve el ID directamente.
    });
  }

  static agregarVenta(nuevaVenta, itemsAgregados, callback) {
    // Validar que haya items antes de iniciar la transacción
    if (!itemsAgregados || itemsAgregados.length === 0) {
      return callback(new Error("No se pueden agregar ventas sin items"));
    }

    // Iniciar transacción
    db.getConnection((err, connection) => {
      if (err) {
        console.error("Error al obtener conexión:", err);
        return callback(err);
      }

      connection.beginTransaction((err) => {
        if (err) {
          connection.release();
          console.error("Error al iniciar transacción:", err);
          return callback(err);
        }

        // 1. Insertar la venta
        const numeroFactura = nuevaVenta.numero_factura.toString().padStart(9, "0");
        connection.query(
          "INSERT INTO ventas (cliente_id, usuario_id, fecha_hora, total, total_sin_descuento, descuento, numero_factura) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            nuevaVenta.cliente_id,
            nuevaVenta.usuario_id,
            nuevaVenta.fecha_hora,
            nuevaVenta.totalConDescuento,
            nuevaVenta.totalSinDescuento,
            nuevaVenta.descuento,
            numeroFactura,
          ],
          (error, resultadoVenta) => {
            if (error) {
              connection.rollback(() => {
                connection.release();
                console.error("Error al insertar venta:", error);
                callback(error);
              });
              return;
            }

            const ventaId = resultadoVenta.insertId;

            // 2. Insertar items en batch
            const valuesItems = itemsAgregados.map((item) => [
              ventaId,
              item.productoId,
              item.cantidad,
              item.precio,
              item.total,
            ]);

            connection.query(
              "INSERT INTO items_venta (venta_id, producto_id, cantidad, precio_unitario, total_item) VALUES ?",
              [valuesItems],
              (err) => {
                if (err) {
                  connection.rollback(() => {
                    connection.release();
                    console.error("Error al insertar items de venta:", err);
                    callback(err);
                  });
                  return;
                }

                // 3. Verificar stock antes de actualizar
                const productoIds = itemsAgregados.map((item) => item.productoId);
                const placeholders = productoIds.map(() => "?").join(",");
                
                // Primero verificar que todos los productos tengan stock suficiente
                const checkStockQuery = `
                  SELECT producto_id, stock 
                  FROM productos 
                  WHERE producto_id IN (${placeholders})
                `;

                connection.query(checkStockQuery, productoIds, (err, productos) => {
                  if (err) {
                    connection.rollback(() => {
                      connection.release();
                      console.error("Error al verificar stock:", err);
                      callback(err);
                    });
                    return;
                  }

                  // Verificar que todos los productos existan y tengan stock suficiente
                  const productoMap = {};
                  productos.forEach((p) => {
                    productoMap[p.producto_id] = p.stock;
                  });

                  const stockInsuficiente = itemsAgregados.find((item) => {
                    const stockDisponible = productoMap[item.productoId];
                    return !stockDisponible || stockDisponible < item.cantidad;
                  });

                  if (stockInsuficiente) {
                    connection.rollback(() => {
                      connection.release();
                      console.error(
                        `Stock insuficiente para el producto ID ${stockInsuficiente.productoId}`
                      );
                      callback(
                        new Error(
                          `Stock insuficiente para el producto ID ${stockInsuficiente.productoId}`
                        )
                      );
                    });
                    return;
                  }

                  // 4. Actualizar stock en batch usando CASE WHEN
                  const whenCases = itemsAgregados
                    .map(() => `WHEN ? THEN stock - ?`)
                    .join(" ");

                  const stockParams = [];
                  itemsAgregados.forEach((item) => {
                    stockParams.push(item.productoId, item.cantidad);
                  });
                  stockParams.push(...productoIds);

                  const updateStockQuery = `
                    UPDATE productos 
                    SET stock = CASE producto_id 
                      ${whenCases}
                    END
                    WHERE producto_id IN (${placeholders})
                  `;

                  connection.query(updateStockQuery, stockParams, (err, result) => {
                    if (err) {
                      connection.rollback(() => {
                        connection.release();
                        console.error("Error al actualizar stock:", err);
                        callback(err);
                      });
                      return;
                    }

                    // 5. Si todo está bien, hacer commit
                    connection.commit((err) => {
                      if (err) {
                        connection.rollback(() => {
                          connection.release();
                          console.error("Error al hacer commit:", err);
                          callback(err);
                        });
                        return;
                      }

                      connection.release();
                      callback(null, ventaId);
                    });
                  });
                });
              }
            );
          }
        );
      });
    });
  }
}

module.exports = Venta;
