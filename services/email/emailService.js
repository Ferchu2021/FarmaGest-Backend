/**
 * Servicio de Email para notificaciones de vencimientos críticos
 */
const nodemailer = require("nodemailer");
require("dotenv").config();

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Configurar transporter de nodemailer
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      console.log("✅ Servicio de email configurado");
    } else {
      console.warn("⚠️  SMTP no configurado. Las notificaciones por email no estarán disponibles.");
    }
  }

  /**
   * Envía notificación de alertas críticas por email
   */
  async enviarNotificacionVencimientos(resumen, notificacionesCriticas) {
    if (!this.transporter) {
      console.warn("Email no configurado, omitiendo envío");
      return { enviado: false, motivo: "Email no configurado" };
    }

    try {
      const destinatarios = (process.env.EMAIL_ALERTAS_DESTINATARIOS || process.env.ADMIN_EMAIL || "")
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email.length > 0);

      if (destinatarios.length === 0) {
        console.warn("No hay destinatarios configurados para alertas");
        return { enviado: false, motivo: "No hay destinatarios configurados" };
      }

      const htmlBody = this.generarHTMLNotificacion(resumen, notificacionesCriticas);
      const textBody = this.generarTextoNotificacion(resumen, notificacionesCriticas);

      const mailOptions = {
        from: `"FarmaGest - Alertas IA" <${process.env.SMTP_USER}>`,
        to: destinatarios.join(", "),
        subject: `🚨 ALERTA CRÍTICA: ${resumen.lotes_vencidos} lotes vencidos detectados`,
        text: textBody,
        html: htmlBody,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("✅ Email de alerta enviado:", info.messageId);

      return { enviado: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Error al enviar email:", error);
      return { enviado: false, error: error.message };
    }
  }

  /**
   * Genera el cuerpo HTML del email
   */
  generarHTMLNotificacion(resumen, notificacionesCriticas) {
    const lotesCriticos = notificacionesCriticas.criticas || [];
    const lotesAlta = notificacionesCriticas.alta || [];

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc2626; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .summary { background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .critical { background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 10px 0; border-radius: 4px; }
          .high { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 10px 0; border-radius: 4px; }
          .metric { display: inline-block; margin: 10px 20px 10px 0; }
          .metric-value { font-size: 24px; font-weight: bold; color: #dc2626; }
          .metric-label { font-size: 12px; color: #6b7280; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f9fafb; font-weight: bold; }
          .recommendation { background-color: #eef2ff; padding: 10px; margin: 5px 0; border-radius: 4px; font-size: 13px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 ALERTAS CRÍTICAS DE VENCIMIENTOS</h1>
            <p>Sistema de Notificaciones Inteligentes - FarmaGest</p>
          </div>

          <div class="summary">
            <h2>Resumen Ejecutivo</h2>
            <div class="metric">
              <div class="metric-value">${resumen.total_lotes_en_riesgo || 0}</div>
              <div class="metric-label">Lotes en riesgo</div>
            </div>
            <div class="metric">
              <div class="metric-value">$${(resumen.valor_total_inventario_riesgo || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</div>
              <div class="metric-label">Valor en riesgo</div>
            </div>
            <div class="metric">
              <div class="metric-value">${resumen.lotes_vencidos || 0}</div>
              <div class="metric-label">Lotes vencidos</div>
            </div>
            <div class="metric">
              <div class="metric-value">${resumen.lotes_alta_prioridad || 0}</div>
              <div class="metric-label">Alta prioridad</div>
            </div>
            <p><strong>Tendencia:</strong> ${resumen.tendencia || "No disponible"}</p>
          </div>
    `;

    if (lotesCriticos.length > 0) {
      html += `
        <h2>🔴 Alertas Críticas (${lotesCriticos.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Lote</th>
              <th>Días</th>
              <th>Valor</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
      `;

      lotesCriticos.slice(0, 10).forEach((lote) => {
        html += `
          <tr>
            <td><strong>${lote.producto_nombre}</strong></td>
            <td>${lote.numero_lote}</td>
            <td style="color: #dc2626;"><strong>${lote.dias_restantes}</strong></td>
            <td>$${(lote.valor_inventario || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
            <td>${lote.score_urgencia}/100</td>
          </tr>
        `;

        if (lote.recomendaciones && lote.recomendaciones.length > 0) {
          html += `<tr><td colspan="5">`;
          lote.recomendaciones.forEach((rec) => {
            html += `<div class="recommendation">💡 ${rec.mensaje}</div>`;
          });
          html += `</td></tr>`;
        }
      });

      html += `
          </tbody>
        </table>
      `;
    }

    if (lotesAlta.length > 0) {
      html += `
        <h2>🟠 Alta Prioridad (${lotesAlta.length})</h2>
        <ul>
      `;

      lotesAlta.slice(0, 5).forEach((lote) => {
        html += `
          <li><strong>${lote.producto_nombre}</strong> - ${lote.dias_restantes} días restantes 
          (Score: ${lote.score_urgencia}/100)</li>
        `;
      });

      html += `</ul>`;
    }

    html += `
          <div class="footer">
            <p>Este es un email automático generado por el sistema de notificaciones inteligentes de FarmaGest.</p>
            <p>Generado el: ${new Date().toLocaleString("es-AR")}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return html;
  }

  /**
   * Genera el cuerpo de texto plano del email
   */
  generarTextoNotificacion(resumen, notificacionesCriticas) {
    let texto = `
🚨 ALERTAS CRÍTICAS DE VENCIMIENTOS
====================================

RESUMEN EJECUTIVO:
- Total lotes en riesgo: ${resumen.total_lotes_en_riesgo || 0}
- Valor total en riesgo: $${(resumen.valor_total_inventario_riesgo || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
- Lotes vencidos: ${resumen.lotes_vencidos || 0}
- Lotes alta prioridad: ${resumen.lotes_alta_prioridad || 0}
- Tendencia: ${resumen.tendencia || "No disponible"}

`;

    const lotesCriticos = notificacionesCriticas.criticas || [];
    if (lotesCriticos.length > 0) {
      texto += `\n🔴 ALERTAS CRÍTICAS (${lotesCriticos.length}):\n`;
      lotesCriticos.slice(0, 10).forEach((lote) => {
        texto += `\n- ${lote.producto_nombre} (${lote.numero_lote})\n`;
        texto += `  Días restantes: ${lote.dias_restantes}\n`;
        texto += `  Valor: $${(lote.valor_inventario || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}\n`;
        texto += `  Score urgencia: ${lote.score_urgencia}/100\n`;
        if (lote.recomendaciones && lote.recomendaciones.length > 0) {
          lote.recomendaciones.forEach((rec) => {
            texto += `  💡 ${rec.mensaje}\n`;
          });
        }
      });
    }

    texto += `\n\nEste es un email automático generado por FarmaGest.\n`;
    texto += `Generado el: ${new Date().toLocaleString("es-AR")}`;

    return texto;
  }
}

module.exports = new EmailService();

