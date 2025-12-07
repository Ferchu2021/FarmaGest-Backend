/**
 * Script para crear/actualizar las vistas optimizadas para Power BI
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const db = require("../db");

console.log("📊 Aplicando vistas optimizadas para Power BI...\n");

async function aplicarVistas() {
  const client = await db.pool.connect();
  
  try {
    // Leer el archivo SQL de vistas de lotes
    const sqlPath = path.join(__dirname, "..", "database", "vistas_power_bi_lotes.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    
    console.log("✅ Archivo SQL leído correctamente\n");
    
    // Dividir el SQL en statements individuales
    // Separar por punto y coma, pero considerar que algunos statements pueden tener múltiples líneas
    const statements = sql
      .split(/;(?=\s*(?:CREATE|COMMENT|--))/)
      .map(s => s.trim())
      .filter(s => {
        // Filtrar líneas vacías, comentarios simples y separadores
        return s.length > 10 && 
               !s.startsWith("--=") && 
               !s.match(/^--\s*$/);
      });
    
    console.log(`📝 Ejecutando vistas SQL...\n`);
    
    for (let i = 0; i < statements.length; i++) {
      let statement = statements[i];
      
      // Limpiar comentarios al inicio de cada línea
      statement = statement.split('\n')
        .map(line => {
          // Mantener líneas que no son solo comentarios
          const trimmed = line.trim();
          if (trimmed.startsWith('--') && !trimmed.match(/COMMENT ON/)) {
            return '';
          }
          return line;
        })
        .filter(line => line.trim().length > 0)
        .join('\n');
      
      if (statement.length < 20) continue;
      
      try {
        // Ejecutar el statement
        await client.query(statement);
        
        // Extraer el nombre de la vista si es CREATE VIEW
        const viewMatch = statement.match(/CREATE\s+OR\s+REPLACE\s+VIEW\s+(\w+)/i);
        if (viewMatch) {
          console.log(`   ✅ Vista creada/actualizada: ${viewMatch[1]}`);
        }
        
        // Extraer comentarios también
        const commentMatch = statement.match(/COMMENT\s+ON\s+VIEW\s+(\w+)/i);
        if (commentMatch) {
          console.log(`   ✅ Comentario agregado a: ${commentMatch[1]}`);
        }
      } catch (error) {
        // Ignorar errores de comentarios si la vista ya existe
        if (error.message.includes("does not exist") && statement.includes("COMMENT")) {
          // La vista no existe aún, el comentario se agregará después
          continue;
        }
        
        // Mostrar otros errores
        if (!error.message.includes("already exists")) {
          const viewMatch = statement.match(/CREATE\s+OR\s+REPLACE\s+VIEW\s+(\w+)/i) ||
                           statement.match(/COMMENT\s+ON\s+VIEW\s+(\w+)/i);
          const viewName = viewMatch ? viewMatch[1] : `statement ${i + 1}`;
          console.error(`   ⚠️  Error en ${viewName}: ${error.message.split('\n')[0]}`);
        }
      }
    }
    
    console.log("\n🔍 Verificando vistas creadas...\n");
    
    // Verificar que las vistas existen
    const vistasEsperadas = [
      "v_power_bi_lotes",
      "v_power_bi_vencimientos_mensual",
      "v_power_bi_productos_inventario",
      "v_power_bi_movimientos_lotes"
    ];
    
    for (const vista of vistasEsperadas) {
      try {
        const result = await client.query(`
          SELECT COUNT(*) as count 
          FROM information_schema.views 
          WHERE table_schema = 'public' 
            AND table_name = $1
        `, [vista]);
        
        if (parseInt(result.rows[0].count) > 0) {
          console.log(`   ✅ ${vista} - Existe`);
        } else {
          console.log(`   ❌ ${vista} - No encontrada`);
        }
      } catch (error) {
        console.error(`   ⚠️  Error verificando ${vista}:`, error.message);
      }
    }
    
    console.log("\n" + "=".repeat(70));
    console.log("✅ Vistas de Power BI aplicadas correctamente");
    console.log("=".repeat(70));
    console.log("\n📋 Próximos pasos:");
    console.log("   1. Ejecuta: node scripts/configurar-power-bi.js");
    console.log("   2. Abre Power BI Desktop");
    console.log("   3. Conecta a PostgreSQL usando las credenciales mostradas");
    console.log("   4. Selecciona las vistas recomendadas");
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

aplicarVistas();

