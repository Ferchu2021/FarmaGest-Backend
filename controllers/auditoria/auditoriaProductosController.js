const AuditoriaProductos = require("../../models/auditorias/auditoriaProductosModel");

const auditoriaProductosController = {
  obtenerAuditoriaProductos: (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 99;
    const search = req.query.search || "";
    AuditoriaProductos.obtenerAuditoriaProductos(
      page,
      pageSize,
      search,
      (err, auditoriaProductos) => {
        if (err) {
          console.error("Error al obtener auditoria clientes:", err);
          res
            .status(500)
            .json({ mensaje: "Error al obtener auditoria clientes" });
        } else {
          // Asegurarse de que siempre devuelva un array
          const rows = Array.isArray(auditoriaProductos) ? auditoriaProductos : [];
          res.json(rows);
        }
      }
    );
  },
};

module.exports = auditoriaProductosController;
