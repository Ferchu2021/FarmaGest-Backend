/**
 * Script de prueba para el sistema de notificaciones inteligentes
 */
require("dotenv").config();
const NotificacionesVencimientosIA = require("../services/notificacionesIA/notificacionesVencimientosIA");

async function testNotificacionesIA() {
  console.log("🤖 Probando sistema de notificaciones inteligentes...\n");

  try {
    // 1. Generar notificaciones inteligentes
    console.log("=".repeat(70));
    console.log("1. GENERANDO NOTIFICACIONES INTELIGENTES");
    console.log("=".repeat(70));

    const notificaciones = await NotificacionesVencimientosIA.generarNotificacionesInteligentes(30);

    console.log("\n📊 RESUMEN EJECUTIVO:");
    console.log(`   • Total lotes en riesgo: ${notificaciones.resumen.total_lotes_en_riesgo}`);
    console.log(`   • Valor total inventario en riesgo: $${notificaciones.resumen.valor_total_inventario_riesgo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`);
    console.log(`   • Valor inventario crítico: $${notificaciones.resumen.valor_inventario_critico.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`);
    console.log(`   • Porcentaje valor crítico: ${notificaciones.resumen.porcentaje_valor_critico}%`);
    console.log(`   • Lotes vencidos: ${notificaciones.resumen.lotes_vencidos}`);
    console.log(`   • Lotes alta prioridad: ${notificaciones.resumen.lotes_alta_prioridad}`);
    console.log(`   • Tendencia: ${notificaciones.resumen.tendencia}`);

    console.log("\n🎯 ACCIONES RECOMENDADAS:");
    console.log(`   • Promociones sugeridas: ${notificaciones.resumen.acciones_recomendadas.promocion}`);
    console.log(`   • Revisiones de compras: ${notificaciones.resumen.acciones_recomendadas.revision_compras}`);
    console.log(`   • Revisiones de productos: ${notificaciones.resumen.acciones_recomendadas.revision_producto}`);
    console.log(`   • Planificaciones: ${notificaciones.resumen.acciones_recomendadas.planificacion}`);

    console.log("\n🔴 NOTIFICACIONES CRÍTICAS:");
    if (notificaciones.notificaciones.criticas.length > 0) {
      notificaciones.notificaciones.criticas.slice(0, 5).forEach(lote => {
        console.log(`\n   • ${lote.producto_nombre} (${lote.numero_lote})`);
        console.log(`     Días restantes: ${lote.dias_restantes}`);
        console.log(`     Valor: $${lote.valor_inventario.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`);
        console.log(`     Score urgencia: ${lote.score_urgencia}/100`);
        console.log(`     Riesgo: ${lote.riesgo_vencimiento}`);
        if (lote.recomendaciones.length > 0) {
          console.log(`     Recomendaciones:`);
          lote.recomendaciones.forEach(rec => {
            console.log(`       - ${rec.mensaje}`);
          });
        }
      });
    } else {
      console.log("   ✅ No hay lotes críticos en este momento");
    }

    console.log("\n🟠 NOTIFICACIONES ALTA PRIORIDAD:");
    if (notificaciones.notificaciones.alta.length > 0) {
      notificaciones.notificaciones.alta.slice(0, 5).forEach(lote => {
        console.log(`\n   • ${lote.producto_nombre} (${lote.numero_lote})`);
        console.log(`     Días restantes: ${lote.dias_restantes}`);
        console.log(`     Score urgencia: ${lote.score_urgencia}/100`);
        if (lote.recomendaciones.length > 0) {
          console.log(`     Recomendación: ${lote.recomendaciones[0].mensaje}`);
        }
      });
    } else {
      console.log("   ✅ No hay lotes de alta prioridad en este momento");
    }

    // 2. Obtener predicciones
    console.log("\n" + "=".repeat(70));
    console.log("2. GENERANDO PREDICCIONES FUTURAS");
    console.log("=".repeat(70));

    const predicciones = await NotificacionesVencimientosIA.predecirVencimientosFuturos(60);

    console.log("\n📉 PRODUCTOS PROBLEMÁTICOS (histórico):");
    if (predicciones.productos_problematicos.length > 0) {
      predicciones.productos_problematicos.slice(0, 5).forEach(prod => {
        console.log(`   • ${prod.nombre}`);
        console.log(`     Veces vencido: ${prod.veces_vencido}`);
        console.log(`     Pérdida promedio: $${prod.perdida_promedio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`);
      });
    } else {
      console.log("   ✅ No hay productos problemáticos identificados");
    }

    console.log("\n⚠️  PRODUCTOS DE ALTO RIESGO:");
    if (predicciones.productos_alto_riesgo.length > 0) {
      predicciones.productos_alto_riesgo.slice(0, 5).forEach(prod => {
        console.log(`   • ${prod.nombre}`);
        console.log(`     Stock actual: ${prod.stock}`);
        console.log(`     Vendido en 90 días: ${prod.unidades_vendidas_90dias}`);
        console.log(`     Ratio stock/venta: ${prod.ratio_stock_venta ? parseFloat(prod.ratio_stock_venta).toFixed(2) : 'N/A'}`);
      });
    } else {
      console.log("   ✅ No hay productos de alto riesgo identificados");
    }

    console.log("\n💡 RECOMENDACIÓN GENERAL:");
    console.log(`   ${predicciones.recomendacion_general}`);

    console.log("\n" + "=".repeat(70));
    console.log("✅ PRUEBA COMPLETADA");
    console.log("=".repeat(70));
    console.log(`\n📌 Endpoints disponibles:`);
    console.log(`   • GET /api/notificaciones-ia/vencimientos?dias=30`);
    console.log(`   • GET /api/notificaciones-ia/predicciones?dias=60`);
    console.log("=".repeat(70) + "\n");

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }

  process.exit(0);
}

testNotificacionesIA();

