const Venta = require("../models/ventasModel");

const ventasController = {
  obtenerTodasLasVentas: (req, res) => {
    // Extraemos los parámetros de paginación, búsqueda y filtros del objeto req.query
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const search = req.query.search || "";
    const sesion = req.query.sesion;
    const fechaDesde = req.query.fechaDesde || "";
    const fechaHasta = req.query.fechaHasta || "";
    const numeroFactura = req.query.numeroFactura || "";
    const clienteId = req.query.clienteId || "";

    // Llamamos a obtenerTodasLasVentas pasando un objeto con los parámetros y un callback
    Venta.obtenerTodasLasVentas(
      { page, pageSize, search, sesion, fechaDesde, fechaHasta, numeroFactura, clienteId },
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
      total,
      totalSinDescuento,
      descuento,
      itemsAgregados,
      items,
      numero_factura,
      fecha_hora,
    } = req.body;
    
    // El frontend puede enviar 'items' o 'itemsAgregados'
    const itemsFinal = itemsAgregados || items || [];
    
    // Normalizar los items para que tengan la estructura correcta
    const itemsNormalizados = itemsFinal.map(item => ({
      producto_id: item.producto_id || item.productoId,
      cantidad: parseInt(item.cantidad) || 0,
      precio_unitario: parseFloat(item.precio_unitario || item.precio || 0),
      total_item: parseFloat(item.total_item || item.total || item.subtotal || 0),
    }));
    
    const nuevaVenta = {
      cliente_id,
      usuario_id,
      totalConDescuento: totalConDescuento || total,
      totalSinDescuento: totalSinDescuento || (totalConDescuento || total),
      descuento: descuento || 0,
      numero_factura,
      fecha_hora: fecha_hora || new Date().toISOString(),
    };

    Venta.agregarVenta(nuevaVenta, itemsNormalizados, (err, ventaId) => {
      if (err) {
        console.error("Error al crear la venta:", err);
        const mensaje = err.message || "Error al crear la venta";
        res.status(500).json({ mensaje });
      } else {
        res
          .status(201)
          .json({ mensaje: "Venta creada exitosamente", venta_id: ventaId });
      }
    });
  },

  obtenerVentasPorCliente: (req, res) => {
    const clienteId = req.params.id;
    
    Venta.obtenerVentasPorCliente(clienteId, (err, ventas) => {
      if (err) {
        console.error("Error al obtener ventas del cliente:", err);
        res.status(500).json({ mensaje: "Error al obtener ventas del cliente" });
      } else {
        res.json(ventas);
      }
    });
  },
};

module.exports = ventasController;
