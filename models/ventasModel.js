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
    { page = 1, pageSize = 10, search = "", sesion, fechaDesde = "", fechaHasta = "", numeroFactura = "", clienteId = "" },
    callback
  ) {
    const offset = (page - 1) * pageSize;
    const searchQuery = search ? `%${search}%` : "%";
    
    // Función para normalizar formato de fecha a YYYY-MM-DD
    const normalizeDate = (dateString) => {
      if (!dateString || dateString.trim() === "") return "";
      // Si ya está en formato YYYY-MM-DD, devolverlo tal cual
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }
      // Si está en formato DD/MM/YYYY, convertir a YYYY-MM-DD
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
        const [day, month, year] = dateString.split('/');
        return `${year}-${month}-${day}`;
      }
      // Si está en formato DD-MM-YYYY, convertir a YYYY-MM-DD
      if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
        const [day, month, year] = dateString.split('-');
        return `${year}-${month}-${day}`;
      }
      return dateString;
    };
    
    const fechaDesdeNormalizada = normalizeDate(fechaDesde);
    const fechaHastaNormalizada = normalizeDate(fechaHasta);

    let queryVentas = `
      SELECT v.venta_id, v.fecha_hora, v.numero_factura, c.nombre AS cliente_nombre, 
      c.apellido AS cliente_apellido, u.nombre AS usuario_nombre, u.apellido AS usuario_apellido,
      v.total, v.total_sin_descuento, v.descuento
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.cliente_id
      LEFT JOIN usuarios u ON v.usuario_id = u.usuario_id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Filtro de búsqueda general
    if (search && search.trim() !== "") {
      queryVentas += ` AND (c.nombre LIKE ? OR c.apellido LIKE ? OR u.nombre LIKE ? OR u.apellido LIKE ? OR v.numero_factura::text LIKE ?)`;
      params.push(searchQuery, searchQuery, searchQuery, searchQuery, searchQuery);
    }
    
    // Filtro por fecha desde
    if (fechaDesdeNormalizada && fechaDesdeNormalizada.trim() !== "") {
      queryVentas += ` AND DATE(v.fecha_hora) >= DATE(?)`;
      params.push(fechaDesdeNormalizada);
    }
    
    // Filtro por fecha hasta
    if (fechaHastaNormalizada && fechaHastaNormalizada.trim() !== "") {
      queryVentas += ` AND DATE(v.fecha_hora) <= DATE(?)`;
      params.push(fechaHastaNormalizada);
    }
    
    // Filtro por número de factura
    if (numeroFactura && numeroFactura.trim() !== "") {
      queryVentas += ` AND v.numero_factura::text LIKE ?`;
      params.push(`%${numeroFactura.trim()}%`);
    }
    
    // Filtro por cliente
    if (clienteId && clienteId.trim() !== "") {
      queryVentas += ` AND v.cliente_id = ?`;
      params.push(parseInt(clienteId));
    }
    
    queryVentas += ` ORDER BY v.fecha_hora DESC LIMIT ? OFFSET ?`;
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

    // Usar transacciones de PostgreSQL
    db.transaction(async (client) => {
      try {
        // 1. Insertar la venta
        const numeroFactura = (nuevaVenta.numero_factura || "").toString().padStart(9, "0");
        const ventaResult = await client.query(
          `INSERT INTO ventas (cliente_id, usuario_id, fecha_hora, total, total_sin_descuento, descuento, numero_factura) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING venta_id`,
          [
            nuevaVenta.cliente_id,
            nuevaVenta.usuario_id,
            nuevaVenta.fecha_hora || new Date().toISOString(),
            nuevaVenta.totalConDescuento || nuevaVenta.total,
            nuevaVenta.totalSinDescuento,
            nuevaVenta.descuento || 0,
            numeroFactura,
          ]
        );

        const ventaId = ventaResult.rows[0].venta_id;

        // 2. Verificar stock antes de insertar items
        const productoIds = itemsAgregados.map((item) => item.producto_id || item.productoId);
        const placeholders = productoIds.map((_, i) => `$${i + 1}`).join(",");
        
        const checkStockQuery = `
          SELECT producto_id, stock 
          FROM productos 
          WHERE producto_id IN (${placeholders})
        `;

        const productosResult = await client.query(checkStockQuery, productoIds);
        const productos = productosResult.rows || productosResult || [];
        
        // Crear mapa de productos
        const productoMap = {};
        productos.forEach((p) => {
          productoMap[p.producto_id] = p.stock;
        });

        // Verificar stock suficiente
        for (const item of itemsAgregados) {
          const productoId = item.producto_id || item.productoId;
          const cantidad = item.cantidad;
          const stockDisponible = productoMap[productoId];
          
          if (!stockDisponible) {
            throw new Error(`Producto ID ${productoId} no encontrado`);
          }
          
          if (stockDisponible < cantidad) {
            throw new Error(`Stock insuficiente para el producto ID ${productoId}. Disponible: ${stockDisponible}, Solicitado: ${cantidad}`);
          }
        }

        // 3. Insertar items uno por uno (PostgreSQL no soporta VALUES ? como MySQL)
        for (const item of itemsAgregados) {
          await client.query(
            `INSERT INTO items_venta (venta_id, producto_id, cantidad, precio_unitario, total_item)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              ventaId,
              item.producto_id,
              item.cantidad,
              item.precio_unitario,
              item.total_item,
            ]
          );
        }

        // 4. Actualizar stock
        for (const item of itemsAgregados) {
          await client.query(
            `UPDATE productos 
             SET stock = stock - $1 
             WHERE producto_id = $2`,
            [item.cantidad, item.producto_id]
          );
        }

        callback(null, ventaId);
      } catch (err) {
        console.error("Error en transacción de venta:", err);
        callback(err);
        throw err; // Re-throw para que el transaction maneje el rollback
      }
    });
  }

  static obtenerVentasPorCliente(clienteId, callback) {
    const queryVentas = `
      SELECT v.venta_id, v.fecha_hora, v.numero_factura, v.total, v.total_sin_descuento, v.descuento,
      c.nombre AS cliente_nombre, c.apellido AS cliente_apellido,
      u.nombre AS usuario_nombre, u.apellido AS usuario_apellido
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.cliente_id
      LEFT JOIN usuarios u ON v.usuario_id = u.usuario_id
      WHERE v.cliente_id = $1
      ORDER BY v.fecha_hora DESC
      LIMIT 10
    `;

    db.query(queryVentas, [clienteId], (err, ventasResult) => {
      if (err) return callback(err);

      const ventas = (ventasResult.rows || ventasResult || []);
      
      if (ventas.length === 0) {
        return callback(null, []);
      }

      // Obtener items para cada venta
      const ventaIds = ventas.map((v) => v.venta_id);
      const placeholders = ventaIds.map((_, i) => `$${i + 1}`).join(",");
      
      const queryItems = `
        SELECT iv.venta_id, iv.producto_id, p.nombre AS producto_nombre, iv.cantidad, iv.precio_unitario, iv.total_item
        FROM items_venta iv
        JOIN productos p ON iv.producto_id = p.producto_id
        WHERE iv.venta_id IN (${placeholders})
      `;

      db.query(queryItems, ventaIds, (err, itemsResult) => {
        if (err) return callback(err);

        const itemsAgregados = itemsResult.rows || itemsResult || [];

        const ventasConItems = ventas.map((venta) => {
          const itemsDeVenta = itemsAgregados.filter(
            (item) => item.venta_id === venta.venta_id
          );
          return { ...venta, items: itemsDeVenta };
        });

        callback(null, ventasConItems);
      });
    });
  }
}

module.exports = Venta;
