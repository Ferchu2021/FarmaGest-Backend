const db = require("../db");

class Lote {
  constructor(
    producto_id,
    numero_lote,
    fecha_vencimiento,
    fecha_fabricacion,
    cantidad_inicial,
    cantidad_actual,
    precio_compra,
    precio_venta,
    proveedor_id,
    ubicacion,
    observaciones
  ) {
    this.producto_id = producto_id;
    this.numero_lote = numero_lote;
    this.fecha_vencimiento = fecha_vencimiento;
    this.fecha_fabricacion = fecha_fabricacion;
    this.cantidad_inicial = cantidad_inicial;
    this.cantidad_actual = cantidad_actual;
    this.precio_compra = precio_compra;
    this.precio_venta = precio_venta;
    this.proveedor_id = proveedor_id;
    this.ubicacion = ubicacion;
    this.observaciones = observaciones;
  }

  static obtenerLotes(
    page = 1,
    pageSize = 10,
    search = "",
    productoId = null,
    estado = null,
    diasVencimiento = null,
    callback
  ) {
    const offset = (page - 1) * pageSize;
    const searchQuery = search ? `%${search}%` : "%";
    
    let query = `
      SELECT 
        l.lote_id,
        l.numero_lote,
        l.fecha_vencimiento,
        l.fecha_fabricacion,
        l.cantidad_inicial,
        l.cantidad_actual,
        l.precio_compra,
        l.precio_venta,
        l.estado,
        l.fecha_entrada,
        l.ubicacion,
        l.producto_id,
        p.nombre AS producto_nombre,
        p.codigo AS producto_codigo,
        pr.proveedor_id,
        pr.razon_social AS proveedor_nombre,
        (l.fecha_vencimiento - CURRENT_DATE) AS dias_hasta_vencimiento
      FROM lotes l
      JOIN productos p ON l.producto_id = p.producto_id
      LEFT JOIN proveedores pr ON l.proveedor_id = pr.proveedor_id
      WHERE l.deleted_at IS NULL
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (search && search.trim() !== "") {
      query += ` AND (l.numero_lote ILIKE $${paramIndex} OR p.nombre ILIKE $${paramIndex + 1} OR p.codigo ILIKE $${paramIndex + 2})`;
      params.push(searchQuery, searchQuery, searchQuery);
      paramIndex += 3;
    }
    
    if (productoId) {
      query += ` AND l.producto_id = $${paramIndex}`;
      params.push(productoId);
      paramIndex++;
    }
    
    if (estado) {
      query += ` AND l.estado = $${paramIndex}`;
      params.push(estado);
      paramIndex++;
    }
    
    if (diasVencimiento !== null) {
      query += ` AND l.fecha_vencimiento <= CURRENT_DATE + INTERVAL '${diasVencimiento} days'`;
    }
    
    query += ` ORDER BY l.fecha_vencimiento ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(pageSize, offset);
    
    db.query(query, params, (err, results) => {
      if (err) {
        return callback(err, null);
      }
      const rows = results.rows || results || [];
      callback(null, rows);
    });
  }

  static agregarLote(nuevoLote, usuario_id, callback) {
    const query = `
      INSERT INTO lotes (
        producto_id, numero_lote, fecha_vencimiento, fecha_fabricacion,
        cantidad_inicial, cantidad_actual, precio_compra, precio_venta,
        proveedor_id, ubicacion, observaciones
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING lote_id
    `;
    
    const params = [
      nuevoLote.producto_id,
      nuevoLote.numero_lote,
      nuevoLote.fecha_vencimiento,
      nuevoLote.fecha_fabricacion || null,
      nuevoLote.cantidad_inicial,
      nuevoLote.cantidad_actual || nuevoLote.cantidad_inicial,
      nuevoLote.precio_compra || null,
      nuevoLote.precio_venta || null,
      nuevoLote.proveedor_id || null,
      nuevoLote.ubicacion || null,
      nuevoLote.observaciones || null,
    ];
    
    db.query(query, params, (err, result) => {
      if (err) {
        return callback(err, null);
      }
      
      const loteId = result.rows?.[0]?.lote_id || result.insertId;
      
      // Registrar movimiento inicial
      if (loteId && usuario_id) {
        db.query(
          `INSERT INTO movimientos_lotes (lote_id, tipo_movimiento, cantidad, cantidad_anterior, cantidad_nueva, motivo, usuario_id)
           VALUES ($1, 'ENTRADA', $2, 0, $3, 'Creación de lote', $4)`,
          [loteId, nuevoLote.cantidad_inicial, nuevoLote.cantidad_actual || nuevoLote.cantidad_inicial, usuario_id],
          () => {}
        );
      }
      
      callback(null, { lote_id: loteId, ...nuevoLote });
    });
  }

  static obtenerProductosPorVencer(dias = 30, callback) {
    const query = `
      SELECT * FROM v_productos_vencer
      WHERE dias_restantes <= $1
      ORDER BY fecha_vencimiento ASC
    `;
    
    db.query(query, [dias], (err, results) => {
      if (err) {
        return callback(err, null);
      }
      const rows = results.rows || results || [];
      callback(null, rows);
    });
  }

  static obtenerPerdidasVencimientos(fechaDesde = null, fechaHasta = null, callback) {
    let query = `
      SELECT * FROM v_resumen_perdidas_vencimientos
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (fechaDesde) {
      query += ` AND mes_vencimiento >= $${paramIndex}`;
      params.push(fechaDesde);
      paramIndex++;
    }
    
    if (fechaHasta) {
      query += ` AND mes_vencimiento <= $${paramIndex}`;
      params.push(fechaHasta);
      paramIndex++;
    }
    
    query += ` ORDER BY mes_vencimiento DESC`;
    
    db.query(query, params, (err, results) => {
      if (err) {
        return callback(err, null);
      }
      const rows = results.rows || results || [];
      callback(null, rows);
    });
  }

  static obtenerMovimientosLote(lote_id, callback) {
    const query = `
      SELECT 
        ml.*,
        u.nombre || ' ' || u.apellido AS usuario_nombre
      FROM movimientos_lotes ml
      LEFT JOIN usuarios u ON ml.usuario_id = u.usuario_id
      WHERE ml.lote_id = $1
      ORDER BY ml.fecha_movimiento DESC
    `;
    
    db.query(query, [lote_id], (err, results) => {
      if (err) {
        return callback(err, null);
      }
      const rows = results.rows || results || [];
      callback(null, rows);
    });
  }

  static actualizarCantidadLote(lote_id, nueva_cantidad, motivo, usuario_id, referencia_tipo = null, referencia_id = null, callback) {
    // Obtener cantidad actual
    db.query(
      "SELECT cantidad_actual FROM lotes WHERE lote_id = $1",
      [lote_id],
      (err, result) => {
        if (err) {
          return callback(err, null);
        }
        
        if (!result.rows || result.rows.length === 0) {
          return callback(new Error("Lote no encontrado"), null);
        }
        
        const cantidad_anterior = result.rows[0].cantidad_actual;
        const diferencia = nueva_cantidad - cantidad_anterior;
        
        // Actualizar cantidad
        db.query(
          "UPDATE lotes SET cantidad_actual = $1, updated_at = CURRENT_TIMESTAMP WHERE lote_id = $2",
          [nueva_cantidad, lote_id],
          (err, updateResult) => {
            if (err) {
              return callback(err, null);
            }
            
            // Registrar movimiento
            const tipoMovimiento = diferencia > 0 ? 'ENTRADA' : diferencia < 0 ? 'SALIDA' : 'AJUSTE';
            
            db.query(
              `INSERT INTO movimientos_lotes (
                lote_id, tipo_movimiento, cantidad, cantidad_anterior, cantidad_nueva,
                motivo, referencia_tipo, referencia_id, usuario_id
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              [
                lote_id,
                tipoMovimiento,
                Math.abs(diferencia),
                cantidad_anterior,
                nueva_cantidad,
                motivo || 'Ajuste de cantidad',
                referencia_tipo,
                referencia_id,
                usuario_id,
              ],
              () => {}
            );
            
            callback(null, { success: true, cantidad_anterior, cantidad_nueva: nueva_cantidad });
          }
        );
      }
    );
  }
}

module.exports = Lote;

