/**
 * Script para crear lotes para todos los productos existentes
 * Distribuye el stock del producto entre varios lotes con fechas de vencimiento variadas
 */
require("dotenv").config();
const db = require("../db");

console.log("📦 Creando lotes para productos existentes...\n");

async function crearLotesParaProductos() {
  const client = await db.pool.connect();
  
  try {
    await client.query("BEGIN");

    // 1. Obtener todos los productos activos con stock
    console.log("1. Obteniendo productos activos...");
    const productosResult = await client.query(`
      SELECT 
        producto_id, 
        nombre, 
        codigo, 
        stock, 
        precio,
        proveedor_id
      FROM productos 
      WHERE deleted_at IS NULL 
        AND stock > 0
      ORDER BY producto_id
    `);
    
    const productos = productosResult.rows;
    console.log(`   ✅ Encontrados ${productos.length} productos con stock\n`);

    if (productos.length === 0) {
      console.log("⚠️  No hay productos con stock para crear lotes");
      await client.query("ROLLBACK");
      return;
    }

    // 2. Obtener proveedores para asignar
    console.log("2. Obteniendo proveedores...");
    const proveedoresResult = await client.query(`
      SELECT proveedor_id, razon_social 
      FROM proveedores
    `);
    const proveedores = proveedoresResult.rows;
    console.log(`   ✅ Encontrados ${proveedores.length} proveedores\n`);

    let lotesCreados = 0;
    let productosProcesados = 0;

    // 3. Para cada producto, crear lotes
    for (const producto of productos) {
      productosProcesados++;
      
      console.log(`\n${productosProcesados}. Procesando: ${producto.nombre} (Stock: ${producto.stock})`);

      // Verificar si ya tiene lotes
      const lotesExistentes = await client.query(`
        SELECT COUNT(*) as cantidad 
        FROM lotes 
        WHERE producto_id = $1 AND deleted_at IS NULL
      `, [producto.producto_id]);

      if (parseInt(lotesExistentes.rows[0].cantidad) > 0) {
        console.log(`   ⚠️  Ya tiene lotes, omitiendo...`);
        continue;
      }

      // Determinar cuántos lotes crear según el stock
      let cantidadLotes = 1;
      if (producto.stock > 100) {
        cantidadLotes = Math.min(5, Math.floor(producto.stock / 50));
      } else if (producto.stock > 50) {
        cantidadLotes = 2;
      } else if (producto.stock > 20) {
        cantidadLotes = 2;
      }

      // Distribuir el stock entre los lotes
      const stockPorLote = Math.floor(producto.stock / cantidadLotes);
      const stockRestante = producto.stock % cantidadLotes;
      
      // Fechas de vencimiento variadas (algunos próximos a vencer, otros más lejanos)
      const hoy = new Date();
      const fechasVencimiento = [];
      
      for (let i = 0; i < cantidadLotes; i++) {
        const diasDesdeHoy = Math.floor(Math.random() * 720) - 60; // Entre 60 días pasado y 660 días futuro
        const fechaVencimiento = new Date(hoy);
        fechaVencimiento.setDate(fechaVencimiento.getDate() + diasDesdeHoy);
        fechasVencimiento.push(fechaVencimiento);
      }
      
      // Ordenar fechas de vencimiento (más próximas primero)
      fechasVencimiento.sort((a, b) => a - b);

      // Crear cada lote
      for (let i = 0; i < cantidadLotes; i++) {
        const cantidadEnLote = stockPorLote + (i === cantidadLotes - 1 ? stockRestante : 0);
        
        // Fecha de vencimiento
        const fechaVenc = fechasVencimiento[i];
        const fechaVencStr = fechaVenc.toISOString().split('T')[0];
        
        // Fecha de fabricación (6 meses a 2 años antes del vencimiento)
        const fechaFab = new Date(fechaVenc);
        const mesesAtras = 6 + Math.floor(Math.random() * 18);
        fechaFab.setMonth(fechaFab.getMonth() - mesesAtras);
        const fechaFabStr = fechaFab.toISOString().split('T')[0];
        
        // Número de lote (formato: PROD-YYYYMMDD-XXX)
        const año = fechaFab.getFullYear();
        const mes = String(fechaFab.getMonth() + 1).padStart(2, '0');
        const dia = String(fechaFab.getDate()).padStart(2, '0');
        const numeroAleatorio = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
        const codigoProducto = producto.codigo || String(producto.producto_id).padStart(6, '0');
        const numeroLote = `${codigoProducto}-${año}${mes}${dia}-${numeroAleatorio}`;
        
        // Precio de compra (70-90% del precio de venta)
        const precioCompra = parseFloat((producto.precio * (0.7 + Math.random() * 0.2)).toFixed(2));
        
        // Seleccionar proveedor aleatorio o el del producto
        let proveedorId = producto.proveedor_id;
        if (!proveedorId && proveedores.length > 0) {
          const proveedorAleatorio = proveedores[Math.floor(Math.random() * proveedores.length)];
          proveedorId = proveedorAleatorio.proveedor_id;
        }

        // Estado del lote
        const diasHastaVencimiento = Math.floor((fechaVenc - hoy) / (1000 * 60 * 60 * 24));
        let estado = 'ACTIVO';
        if (diasHastaVencimiento < 0) {
          estado = 'VENCIDO';
        } else if (diasHastaVencimiento <= 30) {
          estado = 'PRONTO_VENCER';
        }

        // Insertar lote
        const insertQuery = `
          INSERT INTO lotes (
            producto_id,
            numero_lote,
            fecha_vencimiento,
            fecha_fabricacion,
            cantidad_inicial,
            cantidad_actual,
            precio_compra,
            precio_venta,
            proveedor_id,
            estado,
            fecha_entrada
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
          RETURNING lote_id
        `;

        const insertResult = await client.query(insertQuery, [
          producto.producto_id,
          numeroLote,
          fechaVencStr,
          fechaFabStr,
          cantidadEnLote,
          cantidadEnLote,
          precioCompra,
          producto.precio,
          proveedorId,
          estado
        ]);

        const loteId = insertResult.rows[0].lote_id;

        // Crear movimiento inicial
        await client.query(`
          INSERT INTO movimientos_lotes (
            lote_id,
            tipo_movimiento,
            cantidad,
            cantidad_anterior,
            cantidad_nueva,
            motivo,
            fecha_movimiento
          ) VALUES ($1, 'ENTRADA', $2, 0, $3, 'Creación inicial del lote', CURRENT_TIMESTAMP)
        `, [loteId, cantidadEnLote, cantidadEnLote]);

        lotesCreados++;
        console.log(`   ✅ Lote ${i + 1}/${cantidadLotes}: ${numeroLote} - Cantidad: ${cantidadEnLote} - Vence: ${fechaVencStr} (${estado})`);
      }
    }

    await client.query("COMMIT");

    console.log("\n" + "=".repeat(60));
    console.log(`✅ PROCESO COMPLETADO`);
    console.log("=".repeat(60));
    console.log(`📦 Productos procesados: ${productosProcesados}`);
    console.log(`📦 Lotes creados: ${lotesCreados}`);
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

crearLotesParaProductos();

