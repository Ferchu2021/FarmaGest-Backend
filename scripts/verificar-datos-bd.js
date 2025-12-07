/**
 * Script para verificar los datos cargados en las tablas de la base de datos
 */
require("dotenv").config();
const db = require("../db");

console.log("🔍 Verificando datos en la base de datos...\n");

async function verificarDatos() {
  const client = await db.pool.connect();
  
  try {
    console.log("=".repeat(70));
    console.log("VERIFICACIÓN DE DATOS EN BASE DE DATOS");
    console.log("=".repeat(70));
    console.log("");

    // 1. PRODUCTOS
    console.log("📦 PRODUCTOS");
    console.log("-".repeat(70));
    const productos = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as activos,
        COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as eliminados,
        COUNT(CASE WHEN proveedor_id IS NOT NULL THEN 1 END) as con_proveedor,
        COUNT(CASE WHEN precio_compra_base IS NOT NULL THEN 1 END) as con_precio_compra,
        COUNT(CASE WHEN es_medicamento = true THEN 1 END) as medicamentos,
        SUM(stock) as stock_total,
        AVG(precio) as precio_promedio
      FROM productos
    `);
    const prod = productos.rows[0];
    console.log(`   Total productos: ${prod.total}`);
    console.log(`   • Activos: ${prod.activos}`);
    console.log(`   • Eliminados: ${prod.eliminados}`);
    console.log(`   • Con proveedor: ${prod.con_proveedor}`);
    console.log(`   • Con precio compra: ${prod.con_precio_compra}`);
    console.log(`   • Medicamentos: ${prod.medicamentos}`);
    console.log(`   • Stock total: ${prod.stock_total || 0}`);
    console.log(`   • Precio promedio: $${parseFloat(prod.precio_promedio || 0).toFixed(2)}`);
    console.log("");

    // 2. PROVEEDORES
    console.log("🏢 PROVEEDORES");
    console.log("-".repeat(70));
    const proveedores = await client.query(`
      SELECT COUNT(*) as total FROM proveedores
    `);
    console.log(`   Total proveedores: ${proveedores.rows[0].total}`);
    
    // Mostrar algunos proveedores
    const proveedoresLista = await client.query(`
      SELECT razon_social, telefono, email 
      FROM proveedores 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    if (proveedoresLista.rows.length > 0) {
      console.log(`   Últimos 5 proveedores:`);
      proveedoresLista.rows.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.razon_social}`);
      });
    }
    console.log("");

    // 3. LOTES
    console.log("📋 LOTES");
    console.log("-".repeat(70));
    const lotes = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as activos,
        COUNT(CASE WHEN fecha_vencimiento < CURRENT_DATE AND cantidad_actual > 0 THEN 1 END) as vencidos,
        COUNT(CASE WHEN fecha_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' AND cantidad_actual > 0 THEN 1 END) as por_vencer,
        SUM(cantidad_actual) as cantidad_total,
        SUM(cantidad_actual * COALESCE(precio_compra, 0)) as valor_inventario
      FROM lotes
    `);
    const lot = lotes.rows[0];
    console.log(`   Total lotes: ${lot.total}`);
    console.log(`   • Activos: ${lot.activos}`);
    console.log(`   • Vencidos: ${lot.vencidos}`);
    console.log(`   • Por vencer (30 días): ${lot.por_vencer}`);
    console.log(`   • Cantidad total: ${lot.cantidad_total || 0}`);
    console.log(`   • Valor inventario: $${parseFloat(lot.valor_inventario || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`);
    console.log("");

    // 4. OBRAS SOCIALES
    console.log("🏥 OBRAS SOCIALES");
    console.log("-".repeat(70));
    const obrasSociales = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as activas,
        COUNT(DISTINCT obra_social) as obras_unicas,
        AVG(descuento) as descuento_promedio
      FROM obras_sociales
    `);
    const os = obrasSociales.rows[0];
    console.log(`   Total registros: ${os.total}`);
    console.log(`   • Activas: ${os.activas}`);
    console.log(`   • Obras sociales únicas: ${os.obras_unicas}`);
    console.log(`   • Descuento promedio: ${parseFloat(os.descuento_promedio || 0).toFixed(2)}%`);
    
    // Mostrar algunas obras sociales
    const obrasLista = await client.query(`
      SELECT obra_social, plan, descuento 
      FROM obras_sociales 
      WHERE deleted_at IS NULL
      ORDER BY obra_social, plan 
      LIMIT 10
    `);
    if (obrasLista.rows.length > 0) {
      console.log(`   Primeras 10 obras sociales:`);
      obrasLista.rows.forEach((o, i) => {
        console.log(`   ${i + 1}. ${o.obra_social} - ${o.plan} (${o.descuento}% desc.)`);
      });
    }
    console.log("");

    // 5. CLIENTES
    console.log("👥 CLIENTES");
    console.log("-".repeat(70));
    const clientes = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as activos,
        COUNT(CASE WHEN obra_social_id IS NOT NULL THEN 1 END) as con_obra_social
      FROM clientes
    `);
    const cli = clientes.rows[0];
    console.log(`   Total clientes: ${cli.total}`);
    console.log(`   • Activos: ${cli.activos}`);
    console.log(`   • Con obra social: ${cli.con_obra_social}`);
    console.log("");

    // 6. VENTAS
    console.log("💰 VENTAS");
    console.log("-".repeat(70));
    const ventas = await client.query(`
      SELECT 
        COUNT(*) as total,
        SUM(total) as total_ventas,
        AVG(total) as promedio_venta,
        MIN(fecha_hora) as primera_venta,
        MAX(fecha_hora) as ultima_venta
      FROM ventas
    `);
    const ven = ventas.rows[0];
    console.log(`   Total ventas: ${ven.total}`);
    console.log(`   • Total vendido: $${parseFloat(ven.total_ventas || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`);
    console.log(`   • Promedio por venta: $${parseFloat(ven.promedio_venta || 0).toFixed(2)}`);
    if (ven.primera_venta) {
      console.log(`   • Primera venta: ${new Date(ven.primera_venta).toLocaleDateString('es-AR')}`);
    }
    if (ven.ultima_venta) {
      console.log(`   • Última venta: ${new Date(ven.ultima_venta).toLocaleDateString('es-AR')}`);
    }
    console.log("");

    // 7. ITEMS DE VENTA
    console.log("🛒 ITEMS DE VENTA");
    console.log("-".repeat(70));
    const itemsVenta = await client.query(`
      SELECT 
        COUNT(*) as total_items,
        SUM(cantidad) as unidades_vendidas,
        SUM(total_item) as ingresos_items
      FROM items_venta
    `);
    const items = itemsVenta.rows[0];
    console.log(`   Total items: ${items.total_items}`);
    console.log(`   • Unidades vendidas: ${items.unidades_vendidas || 0}`);
    console.log(`   • Ingresos por items: $${parseFloat(items.ingresos_items || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`);
    console.log("");

    // 8. CATEGORÍAS
    console.log("📂 CATEGORÍAS");
    console.log("-".repeat(70));
    const categorias = await client.query(`
      SELECT COUNT(*) as total FROM categorias
    `);
    console.log(`   Total categorías: ${categorias.rows[0].total}`);
    
    const categoriasLista = await client.query(`
      SELECT c.nombre, COUNT(p.producto_id) as cantidad_productos
      FROM categorias c
      LEFT JOIN productos p ON c.categoria_id = p.categoria_id AND p.deleted_at IS NULL
      GROUP BY c.categoria_id, c.nombre
      ORDER BY cantidad_productos DESC
      LIMIT 10
    `);
    if (categoriasLista.rows.length > 0) {
      console.log(`   Categorías con más productos:`);
      categoriasLista.rows.forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.nombre}: ${c.cantidad_productos} productos`);
      });
    }
    console.log("");

    // 9. USUARIOS
    console.log("👤 USUARIOS");
    console.log("-".repeat(70));
    const usuarios = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as activos
      FROM usuarios
    `);
    const usu = usuarios.rows[0];
    console.log(`   Total usuarios: ${usu.total}`);
    console.log(`   • Activos: ${usu.activos}`);
    console.log("");

    // 10. MOVIMIENTOS DE LOTES
    console.log("📊 MOVIMIENTOS DE LOTES");
    console.log("-".repeat(70));
    const movimientos = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN tipo_movimiento = 'ENTRADA' THEN 1 END) as entradas,
        COUNT(CASE WHEN tipo_movimiento = 'SALIDA' THEN 1 END) as salidas,
        COUNT(CASE WHEN tipo_movimiento = 'AJUSTE' THEN 1 END) as ajustes
      FROM movimientos_lotes
    `);
    const mov = movimientos.rows[0];
    console.log(`   Total movimientos: ${mov.total}`);
    console.log(`   • Entradas: ${mov.entradas}`);
    console.log(`   • Salidas: ${mov.salidas}`);
    console.log(`   • Ajustes: ${mov.ajustes}`);
    console.log("");

    // 11. RESUMEN GENERAL
    console.log("=".repeat(70));
    console.log("📊 RESUMEN GENERAL");
    console.log("=".repeat(70));
    console.log(`   ✅ Productos activos: ${prod.activos}`);
    console.log(`   ✅ Proveedores: ${proveedores.rows[0].total}`);
    console.log(`   ✅ Lotes activos: ${lot.activos}`);
    console.log(`   ✅ Obras sociales activas: ${os.activas}`);
    console.log(`   ✅ Clientes activos: ${cli.activos}`);
    console.log(`   ✅ Ventas registradas: ${ven.total}`);
    console.log(`   ✅ Categorías: ${categorias.rows[0].total}`);
    console.log(`   ✅ Usuarios activos: ${usu.activos}`);
    console.log("=".repeat(70));
    console.log("");

    // 12. VERIFICACIÓN DE INTEGRIDAD
    console.log("🔍 VERIFICACIÓN DE INTEGRIDAD");
    console.log("-".repeat(70));
    
    // Productos sin proveedor (pero que deberían tener)
    const productosSinProveedor = await client.query(`
      SELECT COUNT(*) as total
      FROM productos
      WHERE deleted_at IS NULL 
        AND proveedor_id IS NULL
    `);
    console.log(`   Productos sin proveedor: ${productosSinProveedor.rows[0].total}`);
    
    // Productos sin precio_compra_base
    const productosSinPrecioCompra = await client.query(`
      SELECT COUNT(*) as total
      FROM productos
      WHERE deleted_at IS NULL 
        AND precio_compra_base IS NULL
    `);
    console.log(`   Productos sin precio_compra_base: ${productosSinPrecioCompra.rows[0].total}`);
    
    // Lotes sin producto asociado (no debería haber)
    const lotesSinProducto = await client.query(`
      SELECT COUNT(*) as total
      FROM lotes l
      LEFT JOIN productos p ON l.producto_id = p.producto_id
      WHERE p.producto_id IS NULL
    `);
    console.log(`   Lotes huérfanos (sin producto): ${lotesSinProducto.rows[0].total}`);
    
    // Productos sin lotes
    const productosSinLotes = await client.query(`
      SELECT COUNT(*) as total
      FROM productos p
      LEFT JOIN lotes l ON p.producto_id = l.producto_id AND l.deleted_at IS NULL
      WHERE p.deleted_at IS NULL
        AND l.lote_id IS NULL
        AND p.stock > 0
    `);
    console.log(`   Productos con stock pero sin lotes: ${productosSinLotes.rows[0].total}`);
    console.log("");

    console.log("=".repeat(70));
    console.log("✅ VERIFICACIÓN COMPLETADA");
    console.log("=".repeat(70));
    console.log("");

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

verificarDatos();

