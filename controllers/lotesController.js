const Lote = require("../models/lotesModel");

const lotesController = {
  obtenerLotes: (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;
      const search = req.query.search || "";
      const productoId = req.query.productoId || null;
      const estado = req.query.estado || null;
      const diasVencimiento = req.query.diasVencimiento ? parseInt(req.query.diasVencimiento) : null;

      Lote.obtenerLotes(
        page,
        pageSize,
        search,
        productoId,
        estado,
        diasVencimiento,
        (err, lotes) => {
          if (err) {
            console.error("Error al obtener lotes:", err);
            return res.status(500).json({ mensaje: "Error al obtener lotes" });
          }
          const rows = lotes.rows || lotes || [];
          res.json(rows);
        }
      );
    } catch (error) {
      console.error("Error inesperado:", error);
      res.status(500).json({ mensaje: "Error inesperado al obtener lotes" });
    }
  },

  agregarLote: (req, res) => {
    try {
      const {
        producto_id,
        numero_lote,
        fecha_vencimiento,
        fecha_fabricacion,
        cantidad_inicial,
        cantidad_actual,
        precio_compra,
        precio_venta,
        proveedor_id,
        ubicacion,
        observaciones,
        usuario_id,
      } = req.body;

      if (!producto_id || !numero_lote || !fecha_vencimiento || !cantidad_inicial) {
        return res.status(400).json({
          mensaje: "Faltan campos obligatorios: producto_id, numero_lote, fecha_vencimiento, cantidad_inicial",
        });
      }

      const nuevoLote = {
        producto_id,
        numero_lote,
        fecha_vencimiento,
        fecha_fabricacion: fecha_fabricacion || null,
        cantidad_inicial,
        cantidad_actual: cantidad_actual || cantidad_inicial,
        precio_compra: precio_compra || null,
        precio_venta: precio_venta || null,
        proveedor_id: proveedor_id || null,
        ubicacion: ubicacion || null,
        observaciones: observaciones || null,
      };

      Lote.agregarLote(nuevoLote, usuario_id, (err, resultado) => {
        if (err) {
          console.error("Error al agregar lote:", err);
          return res.status(500).json({ mensaje: "Error al agregar lote", error: err.message });
        }
        res.status(201).json({
          mensaje: "Lote agregado correctamente",
          lote_id: resultado.lote_id,
        });
      });
    } catch (error) {
      console.error("Error inesperado:", error);
      res.status(500).json({ mensaje: "Error inesperado al agregar lote" });
    }
  },

  obtenerProductosPorVencer: (req, res) => {
    try {
      const dias = parseInt(req.query.dias) || 30;

      Lote.obtenerProductosPorVencer(dias, (err, productos) => {
        if (err) {
          console.error("Error al obtener productos por vencer:", err);
          return res.status(500).json({ mensaje: "Error al obtener productos por vencer" });
        }
        const rows = productos.rows || productos || [];
        res.json(rows);
      });
    } catch (error) {
      console.error("Error inesperado:", error);
      res.status(500).json({ mensaje: "Error inesperado" });
    }
  },

  obtenerPerdidasVencimientos: async (req, res) => {
    try {
      const fechaDesde = req.query.fechaDesde || null;
      const fechaHasta = req.query.fechaHasta || null;
      const incluirDetalle = req.query.incluirDetalle === 'true';

      Lote.obtenerPerdidasVencimientos(fechaDesde, fechaHasta, async (err, perdidas) => {
        if (err) {
          console.error("Error al obtener pérdidas:", err);
          return res.status(500).json({ mensaje: "Error al obtener pérdidas por vencimientos" });
        }
        const rows = perdidas.rows || perdidas || [];
        
        // Si se solicita detalle, obtener también los lotes vencidos
        if (incluirDetalle) {
          const db = require("../db");
          let detalleQuery = `SELECT * FROM v_detalle_lotes_vencidos WHERE 1=1`;
          const params = [];
          let paramIndex = 1;
          
          if (fechaDesde) {
            detalleQuery += ` AND fecha_vencimiento >= $${paramIndex}`;
            params.push(fechaDesde);
            paramIndex++;
          }
          if (fechaHasta) {
            detalleQuery += ` AND fecha_vencimiento <= $${paramIndex}`;
            params.push(fechaHasta);
            paramIndex++;
          }
          detalleQuery += ` ORDER BY fecha_vencimiento ASC`;
          
          try {
            const detalleResult = await db.query(detalleQuery, params);
            return res.json({
              resumen: rows,
              detalle: detalleResult.rows || []
            });
          } catch (detalleErr) {
            console.error("Error al obtener detalle:", detalleErr);
            return res.json({ resumen: rows, detalle: [] });
          }
        }
        
        res.json(rows);
      });
    } catch (error) {
      console.error("Error inesperado:", error);
      res.status(500).json({ mensaje: "Error inesperado" });
    }
  },

  obtenerMovimientosLote: (req, res) => {
    try {
      const lote_id = req.params.id;

      Lote.obtenerMovimientosLote(lote_id, (err, movimientos) => {
        if (err) {
          console.error("Error al obtener movimientos:", err);
          return res.status(500).json({ mensaje: "Error al obtener movimientos del lote" });
        }
        const rows = movimientos.rows || movimientos || [];
        res.json(rows);
      });
    } catch (error) {
      console.error("Error inesperado:", error);
      res.status(500).json({ mensaje: "Error inesperado" });
    }
  },

  actualizarCantidadLote: (req, res) => {
    try {
      const lote_id = req.params.id;
      const { nueva_cantidad, motivo, usuario_id, referencia_tipo, referencia_id } = req.body;

      if (!nueva_cantidad || nueva_cantidad < 0) {
        return res.status(400).json({ mensaje: "Cantidad inválida" });
      }

      Lote.actualizarCantidadLote(
        lote_id,
        nueva_cantidad,
        motivo,
        usuario_id,
        referencia_tipo,
        referencia_id,
        (err, resultado) => {
          if (err) {
            console.error("Error al actualizar cantidad:", err);
            return res.status(500).json({ mensaje: "Error al actualizar cantidad del lote" });
          }
          res.json({
            mensaje: "Cantidad actualizada correctamente",
            ...resultado,
          });
        }
      );
    } catch (error) {
      console.error("Error inesperado:", error);
      res.status(500).json({ mensaje: "Error inesperado" });
    }
  },
};

module.exports = lotesController;

