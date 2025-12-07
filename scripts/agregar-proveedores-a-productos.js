/**
 * Script para agregar proveedores a productos existentes
 */
require("dotenv").config();
const db = require("../db");

console.log("🔧 Agregando proveedores a productos existentes...\n");

// Obtener todos los proveedores
db.query(
  "SELECT proveedor_id FROM proveedores ORDER BY proveedor_id",
  [],
  (err, proveedoresResult) => {
    if (err) {
      console.error("❌ Error al obtener proveedores:", err.message);
      process.exit(1);
    }

    const proveedores = (proveedoresResult.rows || proveedoresResult || []).map(p => p.proveedor_id);
    
    if (proveedores.length === 0) {
      console.error("❌ No hay proveedores en la base de datos. Crea proveedores primero.");
      process.exit(1);
    }

    console.log(`✅ Proveedores disponibles: ${proveedores.length}\n`);

    // Obtener productos sin proveedor
    db.query(
      "SELECT producto_id, nombre FROM productos WHERE (proveedor_id IS NULL OR proveedor_id = 0) AND deleted_at IS NULL",
      [],
      (err, productosResult) => {
        if (err) {
          console.error("❌ Error al obtener productos:", err.message);
          process.exit(1);
        }

        const productos = productosResult.rows || productosResult || [];
        
        if (productos.length === 0) {
          console.log("✅ Todos los productos ya tienen proveedor asignado\n");
          process.exit(0);
        }

        console.log(`📦 Productos sin proveedor: ${productos.length}\n`);

        let actualizados = 0;
        let index = 0;

        function actualizarSiguiente() {
          if (index >= productos.length) {
            console.log(`\n${"=".repeat(60)}`);
            console.log(`✅ PROCESO COMPLETADO`);
            console.log(`${"=".repeat(60)}`);
            console.log(`   - Productos actualizados: ${actualizados}`);
            console.log(`   - Total de productos procesados: ${productos.length}\n`);
            process.exit(0);
          }

          const producto = productos[index];
          index++;

          // Asignar proveedor aleatorio
          const proveedorId = proveedores[Math.floor(Math.random() * proveedores.length)];

          db.query(
            `UPDATE productos SET proveedor_id = $1 WHERE producto_id = $2`,
            [proveedorId, producto.producto_id],
            (err) => {
              if (err) {
                console.error(`❌ Error al actualizar producto ${producto.nombre}:`, err.message);
              } else {
                console.log(`✅ [${index}/${productos.length}] ${producto.nombre} → Proveedor ID: ${proveedorId}`);
                actualizados++;
              }
              actualizarSiguiente();
            }
          );
        }

        console.log("📦 Asignando proveedores...\n");
        actualizarSiguiente();
      }
    );
  }
);

