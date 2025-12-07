/**
 * Script para mostrar la configuración de conexión para Power BI
 * Muestra las credenciales y pasos para conectar
 */
require("dotenv").config();

console.log("=".repeat(70));
console.log("📊 CONFIGURACIÓN PARA POWER BI - FarmaGest");
console.log("=".repeat(70));
console.log("");

// Obtener configuración de la base de datos
const config = {
  servidor: process.env.DB_HOST || "localhost",
  puerto: process.env.DB_PORT || 5432,
  baseDatos: process.env.DB_NAME || "farma_gest",
  usuario: process.env.DB_USER || "farma_app",
  password: process.env.DB_PASSWORD || "FarmaApp2024!",
};

console.log("🔗 DATOS DE CONEXIÓN:");
console.log("-".repeat(70));
console.log(`   Servidor:     ${config.servidor}`);
console.log(`   Puerto:       ${config.puerto}`);
console.log(`   Base de datos: ${config.baseDatos}`);
console.log(`   Usuario:      ${config.usuario}`);
console.log(`   Contraseña:   ${config.password}`);
console.log("");

console.log("=".repeat(70));
console.log("📋 PASOS PARA CONECTAR POWER BI:");
console.log("=".repeat(70));
console.log("");

console.log("1️⃣  ABRIR POWER BI DESKTOP");
console.log("   • Abre la aplicación Power BI Desktop");
console.log("   • Si no lo tienes, descárgalo desde:");
console.log("     https://powerbi.microsoft.com/desktop/");
console.log("");

console.log("2️⃣  CONECTAR A POSTGRESQL");
console.log("   • Haz clic en: Obtener datos → Más...");
console.log("   • Busca: 'PostgreSQL database'");
console.log("   • Selecciona y haz clic en 'Conectar'");
console.log("");

console.log("3️⃣  INGRESAR DATOS DE CONEXIÓN");
console.log(`   • Servidor: ${config.servidor}:${config.puerto}`);
console.log(`   • Base de datos: ${config.baseDatos}`);
console.log("   • Haz clic en 'Aceptar'");
console.log("");

console.log("4️⃣  INGRESAR CREDENCIALES");
console.log(`   • Usuario: ${config.usuario}`);
console.log(`   • Contraseña: ${config.password}`);
console.log("   • Selecciona: 'Usar estas credenciales en el futuro'");
console.log("   • Haz clic en 'Conectar'");
console.log("");

console.log("5️⃣  SELECCIONAR VISTAS");
console.log("   • En el navegador, marca las siguientes vistas:");
console.log("");
console.log("   ✅ VISTAS PRINCIPALES:");
console.log("      • v_ventas_completas");
console.log("      • v_items_venta_detalle");
console.log("      • v_productos_mas_vendidos");
console.log("      • v_clientes_analisis");
console.log("      • v_ventas_por_periodo");
console.log("");
console.log("   ✅ VISTAS DE LOTES Y VENCIMIENTOS:");
console.log("      • v_power_bi_lotes");
console.log("      • v_power_bi_vencimientos_mensual");
console.log("      • v_power_bi_productos_inventario");
console.log("      • v_power_bi_movimientos_lotes");
console.log("");
console.log("   ✅ VISTAS DE ANÁLISIS:");
console.log("      • v_resumen_perdidas_vencimientos");
console.log("      • v_detalle_lotes_vencidos");
console.log("");

console.log("6️⃣  CONFIGURAR MODO DE CONECTIVIDAD");
console.log("   • Recomendado: 'Importar' (mejor rendimiento)");
console.log("   • Alternativa: 'DirectQuery' (datos en tiempo real)");
console.log("");

console.log("7️⃣  CARGAR DATOS");
console.log("   • Haz clic en 'Cargar'");
console.log("   • Espera a que se importen los datos");
console.log("");

console.log("=".repeat(70));
console.log("📊 VISTAS DISPONIBLES Y SU PROPÓSITO:");
console.log("=".repeat(70));
console.log("");

const vistas = [
  {
    nombre: "v_ventas_completas",
    proposito: "Análisis completo de ventas con fechas descompuestas",
    uso: "Dashboards de ventas, análisis temporal, reportes ejecutivos"
  },
  {
    nombre: "v_items_venta_detalle",
    proposito: "Items vendidos con detalles de productos y clientes",
    uso: "Análisis de productos más vendidos, análisis por categoría"
  },
  {
    nombre: "v_productos_mas_vendidos",
    proposito: "Productos con estadísticas de ventas agregadas",
    uso: "Ranking de productos, análisis de rentabilidad"
  },
  {
    nombre: "v_clientes_analisis",
    proposito: "Análisis completo de clientes y su comportamiento",
    uso: "Segmentación de clientes, análisis de fidelidad"
  },
  {
    nombre: "v_ventas_por_periodo",
    proposito: "Ventas agrupadas por día/mes/trimestre",
    uso: "Tendencias temporales, comparativas por período"
  },
  {
    nombre: "v_power_bi_lotes",
    proposito: "Análisis completo de lotes con información de vencimientos",
    uso: "Control de inventario, alertas de vencimientos"
  },
  {
    nombre: "v_power_bi_vencimientos_mensual",
    proposito: "Análisis mensual de vencimientos y pérdidas",
    uso: "Reportes de pérdidas, predicciones de vencimientos"
  },
  {
    nombre: "v_power_bi_productos_inventario",
    proposito: "Productos con estadísticas de lotes y ventas",
    uso: "Análisis de inventario, optimización de stock"
  },
  {
    nombre: "v_power_bi_movimientos_lotes",
    proposito: "Movimientos de lotes con desglose temporal",
    uso: "Auditoría de inventario, trazabilidad"
  },
  {
    nombre: "v_resumen_perdidas_vencimientos",
    proposito: "Resumen de pérdidas económicas por vencimientos",
    uso: "Reportes financieros, análisis de pérdidas"
  },
  {
    nombre: "v_detalle_lotes_vencidos",
    proposito: "Detalle de lotes vencidos con información completa",
    uso: "Análisis detallado de vencimientos"
  }
];

vistas.forEach((vista, index) => {
  console.log(`${index + 1}. ${vista.nombre}`);
  console.log(`   Propósito: ${vista.proposito}`);
  console.log(`   Uso: ${vista.uso}`);
  console.log("");
});

console.log("=".repeat(70));
console.log("💡 CONSEJOS Y MEJORES PRÁCTICAS:");
console.log("=".repeat(70));
console.log("");

console.log("✅ Usa modo 'Importar' para mejor rendimiento");
console.log("✅ Configura actualización programada en Power BI Service");
console.log("✅ Crea relaciones entre vistas usando campos comunes (IDs)");
console.log("✅ Usa medidas DAX en lugar de columnas calculadas cuando sea posible");
console.log("✅ Filtra datos históricos si trabajas con grandes volúmenes");
console.log("✅ Crea dashboards interactivos con segmentadores de fecha");
console.log("");

console.log("=".repeat(70));
console.log("🔧 TROUBLESHOOTING:");
console.log("=".repeat(70));
console.log("");

console.log("❌ Error: 'No se puede conectar al servidor'");
console.log("   → Verifica que PostgreSQL esté corriendo");
console.log("   → Verifica que el puerto ${config.puerto} esté abierto");
console.log("   → Verifica las credenciales");
console.log("");

console.log("❌ Error: 'Timeout al conectar'");
console.log("   → Aumenta el timeout en configuración avanzada");
console.log("   → Verifica la carga del servidor PostgreSQL");
console.log("   → Usa modo 'Importar' en lugar de 'DirectQuery'");
console.log("");

console.log("❌ Rendimiento lento");
console.log("   → Usa vistas en lugar de tablas directas");
console.log("   → Limita el rango de fechas en las consultas");
console.log("   → Usa modo 'Importar' en lugar de 'DirectQuery'");
console.log("");

console.log("=".repeat(70));
console.log("📚 DOCUMENTACIÓN ADICIONAL:");
console.log("=".repeat(70));
console.log("");
console.log("   • Ver archivo: POWER_BI_INTEGRACION.md");
console.log("   • Documentación oficial:");
console.log("     https://docs.microsoft.com/power-bi/connect-data/desktop-connect-to-postgresql");
console.log("");

console.log("=".repeat(70));
console.log("✅ Configuración lista para usar en Power BI");
console.log("=".repeat(70));
console.log("");

