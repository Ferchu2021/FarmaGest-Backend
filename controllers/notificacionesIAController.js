/**
 * Controller para notificaciones inteligentes de vencimientos
 */
const NotificacionesVencimientosIA = require("../services/notificacionesIA/notificacionesVencimientosIA");
const emailService = require("../services/email/emailService");

const notificacionesIAController = {
  /**
   * Obtener notificaciones inteligentes de vencimientos
   */
  async obtenerNotificaciones(req, res) {
    try {
      const diasAnticipacion = parseInt(req.query.dias) || 30;
      const enviarEmail = req.query.enviarEmail === "true";
      
      const notificaciones = await NotificacionesVencimientosIA.generarNotificacionesInteligentes(diasAnticipacion);
      
      // Enviar email si hay alertas críticas y se solicita
      if (enviarEmail && (notificaciones.resumen.lotes_vencidos > 0 || notificaciones.resumen.lotes_alta_prioridad > 5)) {
        try {
          await emailService.enviarNotificacionVencimientos(
            notificaciones.resumen,
            notificaciones.notificaciones
          );
        } catch (emailError) {
          console.error("Error al enviar email (no crítico):", emailError);
          // No fallar la respuesta si el email falla
        }
      }
      
      res.status(200).json(notificaciones);
    } catch (error) {
      console.error("Error al obtener notificaciones:", error);
      res.status(500).json({ 
        mensaje: "Error al generar notificaciones inteligentes",
        error: error.message 
      });
    }
  },

  /**
   * Obtener predicciones de vencimientos futuros
   */
  async obtenerPredicciones(req, res) {
    try {
      const diasFuturo = parseInt(req.query.dias) || 60;
      
      const predicciones = await NotificacionesVencimientosIA.predecirVencimientosFuturos(diasFuturo);
      
      res.status(200).json(predicciones);
    } catch (error) {
      console.error("Error al obtener predicciones:", error);
      res.status(500).json({ 
        mensaje: "Error al generar predicciones",
        error: error.message 
      });
    }
  }
};

module.exports = notificacionesIAController;

