const db = require("../db.js");

console.log("🔍 Verificando ventas en la base de datos...\n");

// Verificar todas las tablas relacionadas con ventas
Promise.all([
  db.query("SELECT COUNT(*) as total FROM ventas", []),
  db.query("SELECT COUNT(*) as total FROM items_venta", []),
  db.query("SELECT COUNT(*) as total FROM clientes WHERE deleted_at IS NULL", []),
  db.query("SELECT COUNT(*) as total FROM usuarios", [])
]).then(results => {
  const ventas = results[0].rows?.[0]?.total || results[0]?.[0]?.total || 0;
  const items = results[1].rows?.[0]?.total || results[1]?.[0]?.total || 0;
  const clientes = results[2].rows?.[0]?.total || results[2]?.[0]?.total || 0;
  const usuarios = results[3].rows?.[0]?.total || results[3]?.[0]?.total || 0;
  
  console.log("📊 ESTADO DE LA BASE DE DATOS:");
  console.log(`   Ventas: ${ventas}`);
  console.log(`   Items de venta: ${items}`);
  console.log(`   Clientes activos: ${clientes}`);
  console.log(`   Usuarios: ${usuarios}`);
  console.log("");
  
  if (ventas === 0) {
    console.log("💡 No hay ventas en la base de datos.");
    console.log("   Las ventas se crean cuando realizas una venta desde el frontend.");
    console.log("   Para crear una venta:");
    console.log("   1. Ve al módulo de Ventas");
    console.log("   2. Selecciona un cliente");
    console.log("   3. Agrega productos");
    console.log("   4. Completa la venta");
  } else {
    console.log("✅ Hay ventas en la base de datos.");
    console.log("   Si no aparecen en el frontend, verifica la query.");
  }
  
  process.exit(0);
}).catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});



