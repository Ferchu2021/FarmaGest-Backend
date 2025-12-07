/**
 * Script para aplicar correcciones de vista de pérdidas y sistema de ganancias
 */
require("dotenv").config();
const db = require("../db");
const fs = require("fs");
const path = require("path");

console.log("🔧 Aplicando correcciones de vista de pérdidas y sistema de ganancias...\n");

async function aplicarCorrecciones() {
  const client = await db.pool.connect();
  
  try {
    await client.query("BEGIN");

    // Leer el script SQL
    const sqlPath = path.join(__dirname, "corregir-vista-perdidas-y-ganancias.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    // Ejecutar el script SQL
    console.log("1. Ejecutando correcciones SQL...");
    await client.query(sql);
    console.log("   ✅ Correcciones SQL aplicadas");

    // Actualizar precios de productos existentes si tienen precio pero no precio_compra_base
    console.log("\n2. Actualizando precios de productos existentes...");
    const productosResult = await client.query(`
      SELECT producto_id, precio, es_medicamento, porcentaje_iva
      FROM productos
      WHERE precio > 0 AND (precio_compra_base IS NULL OR precio_compra_base = 0)
    `);

    const productos = productosResult.rows;
    console.log(`   📦 Encontrados ${productos.length} productos para actualizar`);

    for (const producto of productos) {
      // Calcular precio_compra_base a partir del precio actual (inversa)
      // precio = precio_compra_base * (1 + ganancia%) * (1 + IVA%)
      // precio_compra_base = precio / ((1 + ganancia%) * (1 + IVA%))
      const porcentajeGanancia = producto.es_medicamento ? 25 : 30;
      const porcentajeIVA = producto.porcentaje_iva || 21;
      
      const precioConGananciaEIVA = (1 + porcentajeGanancia / 100) * (1 + porcentajeIVA / 100);
      const precioCompraBase = producto.precio / precioConGananciaEIVA;

      await client.query(`
        UPDATE productos
        SET precio_compra_base = $1
        WHERE producto_id = $2
      `, [precioCompraBase.toFixed(2), producto.producto_id]);

      console.log(`   ✅ Producto ID ${producto.producto_id}: precio_compra_base = $${precioCompraBase.toFixed(2)}`);
    }

    await client.query("COMMIT");

    console.log("\n" + "=".repeat(60));
    console.log("✅ CORRECCIONES APLICADAS EXITOSAMENTE");
    console.log("=".repeat(60));
    console.log("📋 Cambios realizados:");
    console.log("   ✅ Vista de pérdidas corregida (muestra lotes vencidos)");
    console.log("   ✅ Vista detallada de lotes vencidos creada");
    console.log("   ✅ Campo es_medicamento agregado a productos");
    console.log("   ✅ Campo precio_compra_base agregado");
    console.log("   ✅ Campo porcentaje_iva agregado");
    console.log("   ✅ Función calcular_precio_venta creada");
    console.log("   ✅ Trigger para actualizar precios automáticamente");
    console.log(`   ✅ ${productos.length} productos actualizados con precio_compra_base`);
    console.log("=".repeat(60) + "\n");

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

aplicarCorrecciones();

