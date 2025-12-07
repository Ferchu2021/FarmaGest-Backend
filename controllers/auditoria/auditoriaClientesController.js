const AuditoriaClientes = require("../../models/auditorias/auditoriaClientesModel");

const auditoriaClientesController = {
  obtenerAuditoriaClientes: (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 99;
    const search = req.query.search || "";
    AuditoriaClientes.obtenerAuditoriaClientes(
      page,
      pageSize,
      search,
      (err, auditoriaClientes) => {
        if (err) {
          console.error("Error al obtener auditoria clientes:", err);
          res
            .status(500)
            .json({ mensaje: "Error al obtener auditoria clientes" });
        } else {
          // Asegurarse de que siempre devuelva un array
          const rows = Array.isArray(auditoriaClientes) ? auditoriaClientes : [];
          res.json(rows);
        }
      }
    );
  },
};

module.exports = auditoriaClientesController;
