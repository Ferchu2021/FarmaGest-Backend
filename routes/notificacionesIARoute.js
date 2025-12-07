/**
 * Rutas para notificaciones inteligentes de vencimientos
 */
const express = require("express");
const router = express.Router();
const notificacionesIAController = require("../controllers/notificacionesIAController");

module.exports = () => {
  // Obtener notificaciones inteligentes de vencimientos
  router.get("/vencimientos", notificacionesIAController.obtenerNotificaciones);

  // Obtener predicciones de vencimientos futuros
  router.get("/predicciones", notificacionesIAController.obtenerPredicciones);

  return router;
};

