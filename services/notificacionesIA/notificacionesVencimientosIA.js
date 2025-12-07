/**
 * Servicio de Notificaciones Inteligentes de Vencimientos
 * Usa análisis predictivo y aprendizaje automático para optimizar alertas
 */
const db = require("../../db");
const emailService = require("../email/emailService");

class NotificacionesVencimientosIA {
  /**
   * Analiza lotes y genera notificaciones inteligentes priorizadas
   * @param {number} diasAnticipacion - Días de anticipación para alertas (default: 30)
   * @returns {Promise<Object>} Notificaciones categorizadas y priorizadas
   */
  static async generarNotificacionesInteligentes(diasAnticipacion = 30) {
    const client = await db.pool.connect();
    
    try {
      // 1. Obtener lotes próximos a vencer
      const lotesProximos = await client.query(`
        SELECT 
          l.lote_id,
          l.numero_lote,
          l.producto_id,
          p.nombre AS producto_nombre,
          p.codigo AS producto_codigo,
          p.marca,
          c.nombre AS categoria_nombre,
          l.fecha_vencimiento,
          (l.fecha_vencimiento - CURRENT_DATE) AS dias_restantes,
          l.cantidad_actual,
          l.precio_compra,
          l.precio_venta,
          l.cantidad_actual * COALESCE(l.precio_compra, 0) AS valor_inventario,
          pr.razon_social AS proveedor_nombre
        FROM lotes l
        JOIN productos p ON l.producto_id = p.producto_id
        LEFT JOIN categorias c ON p.categoria_id = c.categoria_id
        LEFT JOIN proveedores pr ON p.proveedor_id = pr.proveedor_id
        WHERE l.deleted_at IS NULL
          AND l.cantidad_actual > 0
          AND l.fecha_vencimiento <= CURRENT_DATE + INTERVAL '${diasAnticipacion} days'
        ORDER BY l.fecha_vencimiento ASC
      `);

      // 2. Analizar histórico de ventas para cada producto
      const lotesConAnalisis = await Promise.all(
        lotesProximos.rows.map(async (lote) => {
          // Calcular velocidad de venta promedio
          const ventasHistoricas = await client.query(`
            SELECT 
              SUM(iv.cantidad) as total_vendido,
              COUNT(DISTINCT v.venta_id) as cantidad_ventas,
              AVG(iv.cantidad) as promedio_por_venta
            FROM items_venta iv
            JOIN ventas v ON iv.venta_id = v.venta_id
            WHERE iv.producto_id = $1
              AND v.fecha_hora >= CURRENT_DATE - INTERVAL '90 days'
          `, [lote.producto_id]);

          const ventas = ventasHistoricas.rows[0];
          const velocidadVenta = ventas?.total_vendido 
            ? ventas.total_vendido / 90 // unidades por día
            : 0;

          // Calcular días estimados para vender el stock
          const diasParaVender = velocidadVenta > 0 
            ? Math.ceil(lote.cantidad_actual / velocidadVenta)
            : 999; // Si no hay ventas históricas, considerar riesgo alto

          // Calcular score de urgencia (0-100)
          const scoreUrgencia = this.calcularScoreUrgencia(
            lote.dias_restantes,
            diasParaVender,
            lote.valor_inventario
          );

          // Generar recomendaciones
          const recomendaciones = this.generarRecomendaciones(
            lote.dias_restantes,
            diasParaVender,
            lote.valor_inventario,
            velocidadVenta
          );

          // Determinar nivel de prioridad
          const prioridad = this.determinarPrioridad(scoreUrgencia, lote.dias_restantes);

          return {
            ...lote,
            velocidad_venta: velocidadVenta,
            dias_para_vender: diasParaVender,
            score_urgencia: scoreUrgencia,
            prioridad: prioridad,
            recomendaciones: recomendaciones,
            riesgo_vencimiento: diasParaVender > lote.dias_restantes ? 'ALTO' : 
                               diasParaVender > lote.dias_restantes * 0.7 ? 'MEDIO' : 'BAJO'
          };
        })
      );

      // 3. Categorizar notificaciones
      const notificaciones = this.categorizarNotificaciones(lotesConAnalisis);

      // 4. Generar resumen ejecutivo
      const resumen = this.generarResumenEjecutivo(notificaciones);

      return {
        resumen,
        notificaciones,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error("Error en generarNotificacionesInteligentes:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Calcula un score de urgencia basado en múltiples factores
   */
  static calcularScoreUrgencia(diasRestantes, diasParaVender, valorInventario) {
    let score = 0;

    // Factor 1: Proximidad al vencimiento (0-40 puntos)
    if (diasRestantes < 0) {
      score += 40; // Ya vencido
    } else if (diasRestantes <= 7) {
      score += 35; // Crítico
    } else if (diasRestantes <= 15) {
      score += 25; // Alto
    } else if (diasRestantes <= 30) {
      score += 15; // Medio
    } else {
      score += 5; // Bajo
    }

    // Factor 2: Riesgo de no poder vender a tiempo (0-30 puntos)
    if (diasParaVender > diasRestantes) {
      const ratio = diasParaVender / Math.max(diasRestantes, 1);
      score += Math.min(30, ratio * 10);
    }

    // Factor 3: Valor económico del inventario (0-30 puntos)
    if (valorInventario >= 100000) {
      score += 30;
    } else if (valorInventario >= 50000) {
      score += 20;
    } else if (valorInventario >= 20000) {
      score += 15;
    } else if (valorInventario >= 10000) {
      score += 10;
    } else if (valorInventario >= 5000) {
      score += 5;
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * Genera recomendaciones inteligentes basadas en el análisis
   */
  static generarRecomendaciones(diasRestantes, diasParaVender, valorInventario, velocidadVenta) {
    const recomendaciones = [];

    // Recomendación por tiempo
    if (diasRestantes <= 7 && diasParaVender > diasRestantes) {
      recomendaciones.push({
        tipo: 'ACCION_INMEDIATA',
        mensaje: 'Aplicar descuento urgente del 20-30% para acelerar ventas',
        accion: 'PROMOCION',
        prioridad: 'ALTA'
      });
    } else if (diasRestantes <= 15 && diasParaVender > diasRestantes * 0.8) {
      recomendaciones.push({
        tipo: 'PROMOCION',
        mensaje: 'Considerar descuento del 10-15% para estimular ventas',
        accion: 'PROMOCION',
        prioridad: 'MEDIA'
      });
    }

    // Recomendación por valor
    if (valorInventario >= 50000 && diasRestantes <= 30) {
      recomendaciones.push({
        tipo: 'GESTION_INVENTARIO',
        mensaje: 'Revisar estrategia de compra para evitar acumulación de stock',
        accion: 'REVISION_COMPRAS',
        prioridad: 'MEDIA'
      });
    }

    // Recomendación por velocidad de venta
    if (velocidadVenta === 0 && diasRestantes <= 30) {
      recomendaciones.push({
        tipo: 'PRODUCTO_LENTO',
        mensaje: 'Producto sin ventas recientes. Considerar promoción especial o evaluación de demanda',
        accion: 'REVISION_PRODUCTO',
        prioridad: 'ALTA'
      });
    }

    // Recomendación de rotación
    if (diasParaVender <= diasRestantes * 0.5 && diasRestantes <= 30) {
      recomendaciones.push({
        tipo: 'OPORTUNIDAD',
        mensaje: 'Buena velocidad de venta. Considerar estrategia de reposición anticipada',
        accion: 'PLANIFICACION',
        prioridad: 'BAJA'
      });
    }

    return recomendaciones;
  }

  /**
   * Determina el nivel de prioridad
   */
  static determinarPrioridad(scoreUrgencia, diasRestantes) {
    if (diasRestantes < 0) {
      return 'CRITICA'; // Ya vencido
    } else if (scoreUrgencia >= 70 || diasRestantes <= 7) {
      return 'ALTA';
    } else if (scoreUrgencia >= 50 || diasRestantes <= 15) {
      return 'MEDIA';
    } else if (scoreUrgencia >= 30 || diasRestantes <= 30) {
      return 'BAJA';
    }
    return 'NORMAL';
  }

  /**
   * Categoriza las notificaciones
   */
  static categorizarNotificaciones(lotes) {
    return {
      criticas: lotes.filter(l => l.prioridad === 'CRITICA'),
      alta: lotes.filter(l => l.prioridad === 'ALTA'),
      media: lotes.filter(l => l.prioridad === 'MEDIA'),
      baja: lotes.filter(l => l.prioridad === 'BAJA'),
      todas: lotes.sort((a, b) => b.score_urgencia - a.score_urgencia)
    };
  }

  /**
   * Genera un resumen ejecutivo
   */
  static generarResumenEjecutivo(notificaciones) {
    const totalLotes = notificaciones.todas.length;
    const valorTotal = notificaciones.todas.reduce(
      (sum, l) => sum + (parseFloat(l.valor_inventario) || 0),
      0
    );
    const valorCritico = notificaciones.criticas.concat(notificaciones.alta).reduce(
      (sum, l) => sum + (parseFloat(l.valor_inventario) || 0),
      0
    );

    return {
      total_lotes_en_riesgo: totalLotes,
      valor_total_inventario_riesgo: valorTotal,
      valor_inventario_critico: valorCritico,
      porcentaje_valor_critico: totalLotes > 0 
        ? Math.round((valorCritico / valorTotal) * 100)
        : 0,
      lotes_vencidos: notificaciones.criticas.length,
      lotes_alta_prioridad: notificaciones.alta.length,
      acciones_recomendadas: this.contarAccionesRecomendadas(notificaciones.todas),
      tendencia: this.calcularTendencia(notificaciones.todas)
    };
  }

  /**
   * Cuenta las acciones recomendadas
   */
  static contarAccionesRecomendadas(lotes) {
    const acciones = {
      promocion: 0,
      revision_compras: 0,
      revision_producto: 0,
      planificacion: 0
    };

    lotes.forEach(lote => {
      lote.recomendaciones.forEach(rec => {
        if (rec.accion === 'PROMOCION') acciones.promocion++;
        if (rec.accion === 'REVISION_COMPRAS') acciones.revision_compras++;
        if (rec.accion === 'REVISION_PRODUCTO') acciones.revision_producto++;
        if (rec.accion === 'PLANIFICACION') acciones.planificacion++;
      });
    });

    return acciones;
  }

  /**
   * Calcula tendencia basada en patrones
   */
  static calcularTendencia(lotes) {
    const vencidos = lotes.filter(l => l.dias_restantes < 0).length;
    const criticos = lotes.filter(l => l.dias_restantes >= 0 && l.dias_restantes <= 7).length;
    
    if (vencidos > 0) {
      return 'CRITICA - Productos ya vencidos detectados';
    } else if (criticos > lotes.length * 0.3) {
      return 'ALTA - Más del 30% de lotes en situación crítica';
    } else if (criticos > 0) {
      return 'ATENCION - Algunos lotes requieren acción inmediata';
    } else {
      return 'ESTABLE - Situación bajo control';
    }
  }

  /**
   * Predice vencimientos futuros basado en patrones históricos
   */
  static async predecirVencimientosFuturos(diasFuturo = 60) {
    const client = await db.pool.connect();
    
    try {
      // Analizar productos que históricamente han tenido problemas de vencimiento
      const productosProblematicos = await client.query(`
        SELECT 
          p.producto_id,
          p.nombre,
          COUNT(*) as veces_vencido,
          AVG(l.cantidad_actual * COALESCE(l.precio_compra, 0)) as perdida_promedio
        FROM lotes l
        JOIN productos p ON l.producto_id = p.producto_id
        WHERE l.deleted_at IS NULL
          AND l.fecha_vencimiento < CURRENT_DATE
          AND l.cantidad_actual > 0
        GROUP BY p.producto_id, p.nombre
        HAVING COUNT(*) >= 2
        ORDER BY veces_vencido DESC, perdida_promedio DESC
        LIMIT 20
      `);

      // Identificar productos con stock alto y baja rotación
      const productosAltoRiesgo = await client.query(`
        SELECT 
          p.producto_id,
          p.nombre,
          p.stock,
          COALESCE(SUM(iv.cantidad), 0) as unidades_vendidas_90dias,
          p.stock::DECIMAL / NULLIF(SUM(iv.cantidad), 0) as ratio_stock_venta
        FROM productos p
        LEFT JOIN items_venta iv ON p.producto_id = iv.producto_id
          AND iv.created_at >= CURRENT_DATE - INTERVAL '90 days'
        WHERE p.deleted_at IS NULL
          AND p.stock > 50
        GROUP BY p.producto_id, p.nombre, p.stock
        HAVING COALESCE(SUM(iv.cantidad), 0) < p.stock * 0.3
        ORDER BY ratio_stock_venta DESC NULLS LAST
        LIMIT 20
      `);

      return {
        productos_problematicos: productosProblematicos.rows,
        productos_alto_riesgo: productosAltoRiesgo.rows,
        recomendacion_general: 'Revisar estrategia de compras para productos con historial de vencimientos'
      };

    } catch (error) {
      console.error("Error en predecirVencimientosFuturos:", error);
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = NotificacionesVencimientosIA;

