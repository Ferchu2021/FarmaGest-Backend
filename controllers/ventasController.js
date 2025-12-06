const Venta = require("../models/ventasModel");

const ventasController = {
  obtenerTodasLasVentas: (req, res) => {
    // Extraemos los parámetros de paginación y búsqueda del objeto req.query
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const search = req.query.search || "";
    const sesion = req.query.sesion;

    // Llamamos a obtenerTodasLasVentas pasando un objeto con los parámetros y un callback
    Venta.obtenerTodasLasVentas(
      { page, pageSize, search, sesion },
      (err, ventas) => {
        if (err) {
          console.error("Error al obtener las ventas:", err);
          res.status(500).json({ mensaje: "Error al obtener las ventas" });
        } else {
          // PostgreSQL devuelve { rows: [...], ... }, MySQL devuelve array directamente
          const rows = ventas.rows || ventas;
          // Asegurarse de que rows es un array
          if (Array.isArray(rows)) {
            res.json(rows);
          } else {
            console.error("Error: ventas no es un array:", typeof ventas, ventas);
            res.status(500).json({ mensaje: "Error: formato de respuesta inválido" });
          }
        }
      }
    );
  },

  obtenerVentaPorId: (req, res) => {
    const venta_id = req.params.id;
    Venta.obtenerVentaConItemsPorId(venta_id, (err, venta) => {
      if (err) {
        console.error("Error al obtener la venta:", err);
        res.status(500).json({ mensaje: "Error al obtener la venta" });
      } else {
        if (venta) {
          res.json(venta);
        } else {
          res.status(404).json({ mensaje: "Venta no encontrada" });
        }
      }
    });
  },

  obtenerUltimaVenta: (req, res) => {
    Venta.obtenerUltimaVenta((err, ventaId) => {
      if (err) {
        console.error("Error al obtener la última venta:", err);
        return res
          .status(500)
          .json({ mensaje: "Error al obtener la última venta" });
      }
      if (ventaId === null) {
        return res.status(404).json({ mensaje: "Venta no encontrada" });
      }
      res.json({ venta_id: ventaId }); // Devolver un objeto para consistencia
    });
  },

  crearVenta: (req, res) => {
    const {
      cliente_id,
      usuario_id,
      totalConDescuento,
      totalSinDescuento,
      descuento,
      itemsAgregados,
      numero_factura,
      fecha_hora,
    } = req.body;
    const nuevaVenta = {
      cliente_id,
      usuario_id,
      totalConDescuento,
      totalSinDescuento,
      descuento,
      numero_factura,
      fecha_hora,
    };

    Venta.agregarVenta(nuevaVenta, itemsAgregados, (err, ventaId) => {
      if (err) {
        console.error("Error al crear la venta:", err);
        res.status(500).json({ mensaje: "Error al crear la venta" });
      } else {
        res
          .status(201)
          .json({ mensaje: "Venta creada exitosamente", venta_id: ventaId });
      }
    });
  },
};

module.exports = ventasController;
