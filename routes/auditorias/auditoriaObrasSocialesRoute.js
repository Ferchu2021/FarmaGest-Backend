const express = require("express");
const router = express.Router();
const auditoriaObrasSocialesController = require("../../controllers/auditoria/auditoriaObrasSocialesController");

module.exports = () => {
  // Obtener todas las auditorias de obras sociales
  router.get(
    "/",
    auditoriaObrasSocialesController.obtenerAuditoriaObrasSociales
  );

  // Obtener liquidación de obras sociales
  router.get(
    "/liquidacion",
    auditoriaObrasSocialesController.obtenerLiquidacion
  );

  return router;
};
