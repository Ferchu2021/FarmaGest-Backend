/**
 * Script para verificar y corregir decimales en precios de productos
 */
require("dotenv").config();
const db = require("../db");

console.log("🔍 Verificando decimales en precios de productos...\n");

async function verificarDecimales() {
  const client = await db.pool.connect();
  
  try {
    await client.query("BEGIN");

    // 1. Verificar estructura de la tabla
    console.log("1. Verificando estructura de la tabla productos...");
    const estructura = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        numeric_precision, 
        numeric_scale
      FROM information_schema.columns 
      WHERE table_name = 'productos' 
        AND column_name IN ('precio', 'precio_compra_base', 'porcentaje_iva')
    `);
    
    console.log("   Estructura actual:");
    estructura.rows.forEach(col => {
      console.log(`   • ${col.column_name}: ${col.data_type}(${col.numeric_precision}, ${col.numeric_scale})`);
    });

    // 2. Verificar precios con más de 2 decimales
    console.log("\n2. Verificando precios con problemas de decimales...");
    const productosProblematicos = await client.query(`
      SELECT 
        producto_id,
        nombre,
        precio,
        precio_compra_base,
        porcentaje_iva,
        CASE 
          WHEN precio::text LIKE '%.___%' THEN 'Más de 2 decimales'
          ELSE 'OK'
        END as estado_precio,
        CASE 
          WHEN precio_compra_base IS NOT NULL AND precio_compra_base::text LIKE '%.___%' THEN 'Más de 2 decimales'
          WHEN precio_compra_base IS NULL THEN 'NULL'
          ELSE 'OK'
        END as estado_precio_compra_base
      FROM productos
      WHERE deleted_at IS NULL
        AND (
          precio::text LIKE '%.___%' 
          OR (precio_compra_base IS NOT NULL AND precio_compra_base::text LIKE '%.___%')
        )
      ORDER BY producto_id
    `);

    if (productosProblematicos.rows.length > 0) {
      console.log(`   ⚠️  Encontrados ${productosProblematicos.rows.length} productos con problemas:`);
      productosProblematicos.rows.forEach(p => {
        console.log(`   • ID ${p.producto_id}: ${p.nombre}`);
        console.log(`     Precio: ${p.precio} (${p.estado_precio})`);
        if (p.precio_compra_base) {
          console.log(`     Precio Compra Base: ${p.precio_compra_base} (${p.estado_precio_compra_base})`);
        }
      });

      // Corregir precios redondeándolos a 2 decimales
      console.log("\n3. Corrigiendo precios a 2 decimales...");
      let corregidos = 0;

      for (const producto of productosProblematicos.rows) {
        const precioRedondeado = Math.round(parseFloat(producto.precio) * 100) / 100;
        let precioCompraBaseRedondeado = producto.precio_compra_base;
        
        if (producto.precio_compra_base) {
          precioCompraBaseRedondeado = Math.round(parseFloat(producto.precio_compra_base) * 100) / 100;
        }

        await client.query(`
          UPDATE productos
          SET precio = $1,
              precio_compra_base = $2
          WHERE producto_id = $3
        `, [precioRedondeado, precioCompraBaseRedondeado, producto.producto_id]);

        console.log(`   ✅ Producto ID ${producto.producto_id}: Precio ${producto.precio} → ${precioRedondeado.toFixed(2)}`);
        corregidos++;
      }

      console.log(`\n   ✅ ${corregidos} productos corregidos`);
    } else {
      console.log("   ✅ Todos los precios tienen formato correcto (2 decimales)");
    }

    // 4. Verificar función de cálculo de precios
    console.log("\n4. Verificando función calcular_precio_venta...");
    const funcion = await client.query(`
      SELECT 
        proname as nombre_funcion,
        prosrc as codigo_funcion
      FROM pg_proc 
      WHERE proname = 'calcular_precio_venta'
    `);

    if (funcion.rows.length > 0) {
      console.log("   ✅ Función calcular_precio_venta existe");
      
      // Verificar si redondea correctamente
      if (funcion.rows[0].codigo_funcion.includes("ROUND")) {
        console.log("   ✅ Función incluye redondeo");
      } else {
        console.log("   ⚠️  Función no incluye redondeo explícito, verificando...");
      }
    } else {
      console.log("   ⚠️  Función calcular_precio_venta no encontrada");
    }

    // 5. Probar la función con un ejemplo
    console.log("\n5. Probando cálculo de precios...");
    const prueba1 = await client.query(`
      SELECT calcular_precio_venta(100.00, true, 21.00) as precio_medicamento,
             calcular_precio_venta(100.00, false, 21.00) as precio_otro
    `);
    
    console.log(`   • Precio medicamento (100 base, 25% gan, 21% IVA): ${prueba1.rows[0].precio_medicamento}`);
    console.log(`   • Precio otro (100 base, 30% gan, 21% IVA): ${prueba1.rows[0].precio_otro}`);

    await client.query("COMMIT");

    console.log("\n" + "=".repeat(60));
    console.log("✅ VERIFICACIÓN COMPLETADA");
    console.log("=".repeat(60));
    console.log(`📊 Productos verificados`);
    console.log(`🔧 Productos corregidos: ${productosProblematicos.rows.length || 0}`);
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

verificarDecimales();

