const Sesiones = require("../models/sesionesModel");

const sesionesController = {
  obtenerSesiones: (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;
      const search = req.query.search || "";
      
      if (page < 1) {
        return res.status(400).json({ mensaje: "El número de página debe ser mayor a 0" });
      }
      
      if (pageSize < 1 || pageSize > 100) {
        return res.status(400).json({ mensaje: "El tamaño de página debe estar entre 1 y 100" });
      }
      
      Sesiones.obtenerSesiones(page, pageSize, search, (err, sesiones) => {
        if (err) {
          console.error("Error al obtener sesiones:", err);
          console.error("Stack:", err.stack);
          return res.status(500).json({ 
            mensaje: "Error al obtener sesiones",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
          });
        }
        
        // Asegurarse de que siempre devolvemos un array
        const sesionesArray = Array.isArray(sesiones) ? sesiones : [];
        res.json(sesionesArray);
      });
    } catch (error) {
      console.error("Error inesperado en obtenerSesiones:", error);
      res.status(500).json({ 
        mensaje: "Error inesperado al obtener sesiones",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },
};

module.exports = sesionesController;
