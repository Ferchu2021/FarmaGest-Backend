/**
 * Script para crear las tablas de lotes y vencimientos
 */
require("dotenv").config();
const db = require("../db");
const fs = require("fs");
const path = require("path");

console.log("📦 Creando tablas de lotes y vencimientos...\n");

async function crearTablasLotes() {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");
    
    const sqlPath = path.join(__dirname, "../database/lotes_vencimientos_schema.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    
    // Dividir el SQL en comandos individuales
    const comandos = sql
      .split(";")
      .map((cmd) => cmd.trim())
      .filter((cmd) => cmd.length > 0 && !cmd.startsWith("--") && !cmd.startsWith("COMMENT"));
    
    console.log(`Ejecutando ${comandos.length} comandos SQL...\n`);
    
    for (let i = 0; i < comandos.length; i++) {
      const comando = comandos[i];
      if (comando.length > 10) {
        try {
          await client.query(comando);
          console.log(`✅ Comando ${i + 1}/${comandos.length} ejecutado`);
        } catch (err) {
          // Ignorar errores de "ya existe" o "duplicate"
          if (!err.message.includes("already exists") && !err.message.includes("duplicate")) {
            console.error(`⚠️  Advertencia en comando ${i + 1}:`, err.message);
          }
        }
      }
    }
    
    await client.query("COMMIT");
    console.log("\n" + "=".repeat(60));
    console.log("✅ Tablas de lotes creadas exitosamente");
    console.log("=".repeat(60));
    
    // Verificar que las tablas se crearon
    const checkTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('lotes', 'movimientos_lotes')
    `);
    
    console.log("\n📊 Tablas verificadas:");
    checkTables.rows.forEach((row) => {
      console.log(`   ✅ ${row.table_name}`);
    });
    
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("\n❌ Error al crear tablas:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

crearTablasLotes();

