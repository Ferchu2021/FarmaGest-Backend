const db = require("../../db");

class AuditoriaProductos {
  constructor(
    nombre,
    producto_id,
    accion,
    detalle_cambio,
    fecha_movimiento,
    usuario_id
  ) {
    this.nombre = nombre;
    this.producto_id = producto_id;
    this.accion = accion;
    this.detalle_cambio = detalle_cambio;
    this.fecha_movimiento = fecha_movimiento;
    this.usuario_id = usuario_id;
  }

  static obtenerAuditoriaProductos(
    page = 0,
    pageSize = 6,
    search = "",
    callback
  ) {
    const offset = (page - 1) * pageSize;
    const searchQuery = search ? `%${search}%` : "%";
    let query = `
    SELECT p.nombre as "Producto" , a.fecha_movimiento as "Fecha", a.accion as "Accion", a.detalle_cambio as "Detalle",
    u.correo as "Usuario" FROM auditoria_productos as a 
    LEFT JOIN usuarios as u ON a.usuario_id = u.usuario_id
    LEFT JOIN productos as p ON a.producto_id = p.producto_id
    WHERE (a.detalle_cambio LIKE $1 OR u.correo LIKE $2  or a.fecha_movimiento::text LIKE $3)
    ORDER BY a.fecha_movimiento DESC`;
    const params = [searchQuery, searchQuery, searchQuery];
    query += ` LIMIT $4 OFFSET $5`;
    params.push(pageSize, offset);
    return db.query(query, params, (err, results) => {
      if (err) {
        return callback(err, null);
      }
      // PostgreSQL devuelve results.rows, MySQL devuelve results directamente
      const rows = results.rows || results;
      callback(null, rows);
    });
  }
}

module.exports = AuditoriaProductos;
