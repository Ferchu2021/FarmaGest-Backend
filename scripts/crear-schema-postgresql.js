/**
 * Script para crear el esquema completo de PostgreSQL
 * Uso: node scripts/crear-schema-postgresql.js
 */

require("dotenv").config();
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
  host: process.env.DB_HOST || process.env.host || "localhost",
  port: process.env.DB_PORT || process.env.port || 5432,
  user: process.env.DB_USER || process.env.user,
  password: process.env.DB_PASSWORD || process.env.password,
  database: process.env.DB_NAME || process.env.database,
});

async function crearSchema() {
  console.log("🚀 Creando esquema de PostgreSQL para FarmaGest...\n");
  
  const client = await pool.connect();
  
  try {
    // Leer el archivo SQL
    const sqlFile = path.join(__dirname, "..", "database", "postgresql_schema.sql");
    
    if (!fs.existsSync(sqlFile)) {
      console.error(`❌ Error: No se encuentra el archivo ${sqlFile}`);
      process.exit(1);
    }
    
    const sqlContent = fs.readFileSync(sqlFile, "utf8");
    
    // Dividir en queries individuales (separadas por ;)
    // Filtrar comentarios y líneas vacías
    const queries = sqlContent
      .split(";")
      .map(query => query.trim())
      .filter(query => 
        query.length > 0 && 
        !query.startsWith("--") &&
        !query.startsWith("/*") &&
        query !== ""
      );
    
    console.log(`📝 Se encontraron ${queries.length} queries para ejecutar\n`);
    
    let ejecutadas = 0;
    let errores = 0;
    const erroresDetalle = [];
    
    // Ejecutar cada query
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      
      // Saltar comentarios dentro de queries
      if (query.startsWith("--") || query.startsWith("/*")) {
        continue;
      }
      
      try {
        await client.query(query);
        ejecutadas++;
        
        // Mostrar progreso cada 10 queries
        if (ejecutadas % 10 === 0) {
          console.log(`   ✅ ${ejecutadas} queries ejecutadas...`);
        }
      } catch (error) {
        // Algunos errores son esperados (tabla ya existe, etc.)
        if (error.code === "42P07" || error.code === "42710") {
          // Tabla/índice ya existe
          ejecutadas++;
          continue;
        }
        
        errores++;
        erroresDetalle.push({
          query: query.substring(0, 100) + "...",
          error: error.message,
          code: error.code
        });
        
        console.error(`\n❌ Error en query ${i + 1}:`);
        console.error(`   Código: ${error.code}`);
        console.error(`   Mensaje: ${error.message}`);
        console.error(`   Query: ${query.substring(0, 200)}...\n`);
      }
    }
    
    console.log("\n" + "=".repeat(50));
    console.log("📊 Resumen de ejecución:");
    console.log(`   ✅ Queries ejecutadas exitosamente: ${ejecutadas}`);
    console.log(`   ❌ Errores: ${errores}`);
    console.log("=".repeat(50) + "\n");
    
    if (errores > 0) {
      console.log("⚠️  Errores detallados:");
      erroresDetalle.forEach((err, index) => {
        console.log(`\n${index + 1}. Código: ${err.code}`);
        console.log(`   Mensaje: ${err.error}`);
        console.log(`   Query: ${err.query}`);
      });
    }
    
    // Verificar que las tablas se crearon
    console.log("\n🔍 Verificando tablas creadas...");
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    if (result.rows.length > 0) {
      console.log(`✅ Se encontraron ${result.rows.length} tablas:`);
      result.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    }
    
    // Verificar vistas
    console.log("\n🔍 Verificando vistas creadas...");
    const viewsResult = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (viewsResult.rows.length > 0) {
      console.log(`✅ Se encontraron ${viewsResult.rows.length} vistas:`);
      viewsResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    }
    
    if (errores === 0) {
      console.log("\n✅ ¡Esquema creado exitosamente!");
      console.log("📊 La base de datos está lista para Power BI");
      console.log("🤖 La base de datos está lista para IA");
    } else {
      console.log("\n⚠️  El esquema se creó con algunos errores.");
      console.log("   Revisa los errores detallados arriba.");
    }
    
  } catch (error) {
    console.error("\n❌ Error crítico al crear el esquema:");
    console.error(`   Código: ${error.code}`);
    console.error(`   Mensaje: ${error.message}`);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar
crearSchema();




