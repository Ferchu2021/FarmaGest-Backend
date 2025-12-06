const db = require("../db");

class Proveedor {
  constructor(razon_social, direccion, telefono, email) {
    this.razon_social = razon_social;
    this.direccion = direccion;
    this.telefono = telefono;
    this.email = email;
  }

  static obtenerProveedores(page = 0, pageSize = 6, search = "", callback) {
    const offset = (page - 1) * pageSize;

    const searchQuery = search ? `%${search}%` : "%";

    let query = `
      SELECT proveedor_id, razon_social, direccion as Direccion, telefono as Telefono, email as Email
      FROM proveedores
      WHERE razon_social LIKE ? OR direccion LIKE ? OR telefono LIKE ? OR email LIKE ?
    `;

    const params = [searchQuery, searchQuery, searchQuery, searchQuery];
    query += ` LIMIT ? OFFSET ?`;
    params.push(pageSize, offset);

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

  static agregarProveedor(nuevoProveedor, callback) {
    return db.query(
      "INSERT INTO proveedores (razon_social, direccion, telefono, email) VALUES (?, ?, ?, ?)",
      [
        nuevoProveedor.razon_social,
        nuevoProveedor.direccion,
        nuevoProveedor.telefono,
        nuevoProveedor.email,
      ],
      callback
    );
  }

  static actualizarProveedor(proveedorID, proveedorActualizado, callback) {
    return db.query(
      "UPDATE proveedores SET razon_social = ?, direccion = ?, telefono = ?, email = ? WHERE proveedor_id = ?",
      [
        proveedorActualizado.razon_social,
        proveedorActualizado.direccion,
        proveedorActualizado.telefono,
        proveedorActualizado.email,
        proveedorID,
      ],
      callback
    );
  }

  static eliminarProveedor(proveedorID, callback) {
    return db.query(
      "DELETE FROM proveedores WHERE proveedor_id = ?",
      [proveedorID],
      callback
    );
  }
}

module.exports = Proveedor;
