const express = require("express");
const router = express.Router();
const db = require("../db");
// Middleware para actualizar ultima_actividad de la sesión, si está presente
router.use((req, res, next) => {
  const sesion = req.headers["x-sesion-id"] || req.query.sesion || (req.body && req.body.sesion);
  if (!sesion) return next();

  db.query(
    "UPDATE sesiones SET ultima_actividad = CURRENT_TIMESTAMP WHERE sesion_id = $1",
    [sesion],
    (err) => {
      if (err) {
        console.error("Error al actualizar ultima_actividad de la sesión:", err);
      }
      next();
    }
  );
});
const proveedoresRoutes = require("./proveedoresRoute.js");
const productosRoutes = require("./productosRoute.js");
const usuariosRoutes = require("./usuariosRoute.js");
const clientesRoutes = require("./clientesRoute.js");
const auditoriaProductosRoutes = require("./auditorias/auditoriaProductosRoute.js");
const auditoriaClientesRoutes = require("./auditorias/auditoriaClientesRoute.js");
const auditoriaObrasSocialesRoutes = require("./auditorias/auditoriaObrasSocialesRoute.js");
const obrasSocialesRoutes = require("./obrasSocialesRoute.js");
const ventasRoutes = require("./ventasRoute.js");
const reportesRoutes = require("./reportesRoute.js");
const sesionesRoutes = require("./sesionesRoute.js");
const authRoutes = require("./authRoute.js");
const indexesRoute = require("./indexesRoute.js");

router.use("/reportes/", reportesRoutes());
router.use("/ventas/", ventasRoutes());
router.use("/proveedores/", proveedoresRoutes());
router.use("/productos/", productosRoutes());
router.use("/usuarios/", usuariosRoutes());
router.use("/clientes/", clientesRoutes());
router.use("/auditoria-productos/", auditoriaProductosRoutes());
router.use("/auditoria-clientes/", auditoriaClientesRoutes());
router.use("/auditoria-obras-sociales/", auditoriaObrasSocialesRoutes());
router.use("/obras-sociales/", obrasSocialesRoutes());
router.use("/sesiones/", sesionesRoutes());

router.use("/auth/", authRoutes);

// RUTA TEMPORAL para crear índices - ELIMINAR después de usar
router.use("/indexes/", indexesRoute);

module.exports = router;
