const db = require("../db");

class ItemVenta {
  constructor(venta_id, producto_id, cantidad, precio_unitario, total_item) {
    this.venta_id = venta_id;
    this.producto_id = producto_id;
    this.cantidad = cantidad;
    this.precio_unitario = precio_unitario;
    this.total_item = total_item;
  }

  static agregarItems(items, callback) {
    const query = `
      INSERT INTO items_venta (venta_id, producto_id, cantidad, precio_unitario, total_item)
      VALUES ?
    `;

    const values = items.map((item) => [
      item.venta_id,
      item.producto_id,
      item.cantidad,
      item.precio_unitario,
      item.total_item,
    ]);

    db.query(query, [values], callback);
  }

  static obtenerItemsPorVenta(venta_id, callback) {
    const query = `
      SELECT iv.item_id, iv.producto_id, p.nombre AS producto_nombre, iv.cantidad, iv.precio_unitario, iv.total_item
      FROM items_venta iv
      JOIN productos p ON iv.producto_id = p.producto_id
      WHERE iv.venta_id = ?
    `;

    db.query(query, [venta_id], (err, results) => {
      if (err) {
        return callback(err, null);
      }
      // PostgreSQL devuelve results.rows, MySQL devuelve results directamente
      const rows = results.rows || results;
      callback(null, rows);
    });
  }

  static eliminarItemsPorVenta(venta_id, callback) {
    const query = `
      DELETE FROM items_venta WHERE venta_id = ?
    `;

    db.query(query, [venta_id], callback);
  }
}

module.exports = ItemVenta;
