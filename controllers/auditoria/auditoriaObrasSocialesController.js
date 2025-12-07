const AuditoriaObrasSociales = require("../../models/auditorias/auditoriaObrasSocialesModel");
const LiquidacionObrasSociales = require("../../models/liquidacionObrasSocialesModel");

const auditoriaObrasSocialesController = {
  obtenerAuditoriaObrasSociales: (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 99;
    const search = req.query.search || "";
    AuditoriaObrasSociales.obtenerAuditoriaObrasSociales(
      page,
      pageSize,
      search,
      (err, auditoriaObrasSociales) => {
        if (err) {
          console.error("Error al obtener auditoria clientes:", err);
          res
            .status(500)
            .json({ mensaje: "Error al obtener auditoria clientes" });
        } else {
          // Asegurarse de que siempre devuelva un array
          const rows = Array.isArray(auditoriaObrasSociales) ? auditoriaObrasSociales : [];
          res.json(rows);
        }
      }
    );
  },

  obtenerLiquidacion: (req, res) => {
    const filtros = {
      obraSocialId: req.query.obraSocialId
        ? parseInt(req.query.obraSocialId)
        : null,
      fechaDesde: req.query.fechaDesde || null,
      fechaHasta: req.query.fechaHasta || null,
      incluirSinObraSocial:
        req.query.incluirSinObraSocial === "true" ||
        req.query.incluirSinObraSocial === true,
    };

    LiquidacionObrasSociales.obtenerLiquidacion(filtros, (err, liquidacion) => {
      if (err) {
        console.error("Error al obtener liquidación:", err);
        res.status(500).json({
          mensaje: "Error al obtener la liquidación de obras sociales",
        });
      } else {
        res.json(liquidacion);
      }
    });
  },
};

module.exports = auditoriaObrasSocialesController;
