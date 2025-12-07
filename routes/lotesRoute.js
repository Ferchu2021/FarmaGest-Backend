// routes/lotesRoute.js
const express = require("express");
const router = express.Router();
const lotesController = require("../controllers/lotesController");

module.exports = () => {
  // Obtener todos los lotes
  router.get("/", lotesController.obtenerLotes);

  // Obtener productos próximos a vencer
  router.get("/por-vencer", lotesController.obtenerProductosPorVencer);

  // Obtener pérdidas por vencimientos
  router.get("/perdidas", lotesController.obtenerPerdidasVencimientos);

  // Obtener movimientos de un lote específico
  router.get("/:id/movimientos", lotesController.obtenerMovimientosLote);

  // Agregar un nuevo lote
  router.post("/", lotesController.agregarLote);

  // Actualizar cantidad de un lote
  router.put("/:id/cantidad", lotesController.actualizarCantidadLote);

  return router;
};

