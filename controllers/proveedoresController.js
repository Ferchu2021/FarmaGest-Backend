const Proveedor = require("../models/proveedoresModel");

const proveedoresController = {
  obtenerProveedores: (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 7;
    const search = req.query.search || "";

    Proveedor.obtenerProveedores(page, pageSize, search, (err, proveedores) => {
      if (err) {
        console.error("Error al obtener proveedores:", err);
        res.status(500).json({ mensaje: "Error al obtener proveedores" });
      } else {
        // PostgreSQL devuelve { rows: [...], ... }, MySQL devuelve array directamente
        const rows = proveedores.rows || proveedores;
        // Asegurarse de que rows es un array
        if (Array.isArray(rows)) {
          res.json(rows);
        } else {
          console.error("Error: proveedores no es un array:", typeof proveedores, proveedores);
          res.status(500).json({ mensaje: "Error: formato de respuesta inválido" });
        }
      }
    });
  },

  agregarProveedor: (req, res) => {
    const { razon_social, direccion, telefono, email } = req.body;
    const nuevoProveedor = new Proveedor(
      razon_social,
      direccion,
      telefono,
      email
    );

    Proveedor.agregarProveedor(nuevoProveedor, (err, resultado) => {
      if (err) {
        console.error("Error al agregar proveedor:", err);
        res.status(500).json({ mensaje: "Error al agregar proveedor" });
      } else {
        res.status(201).json({
          mensaje: "Proveedor agregado correctamente",
          proveedor_id: resultado.insertId || resultado.rows?.[0]?.proveedor_id || resultado.rows?.[0]?.id,
        });
      }
    });
  },

  actualizarProveedor: (req, res) => {
    const proveedorActualizado = req.body;
    Proveedor.actualizarProveedor(
      req.params.id,
      proveedorActualizado,
      (err, proveedor) => {
        if (err) throw err;
        res.json(proveedor);
      }
    );
  },

  eliminarProveedor: (req, res) => {
    const proveedorID = req.params.id; // Obtener el ID del proveedor desde los parámetros de la URL

    Proveedor.eliminarProveedor(proveedorID, (err, resultado) => {
      if (err) {
        console.error("Error al eliminar proveedor:", err);
        res.status(500).json({ mensaje: "Error al eliminar proveedor" });
      } else {
        // PostgreSQL devuelve rowCount, MySQL devuelve affectedRows
        const affectedRows = resultado.rowCount || resultado.affectedRows || 0;
        if (affectedRows > 0) {
          res.json({ mensaje: "Proveedor eliminado correctamente" });
        } else {
          res.status(404).json({ mensaje: "Proveedor no encontrado" });
        }
      }
    });
  },
};

module.exports = proveedoresController;
