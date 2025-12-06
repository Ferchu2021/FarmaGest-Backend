/**
 * Script para probar la conexión a PostgreSQL
 * Uso: node scripts/test-postgresql-connection.js
 */

require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || process.env.host || "localhost",
  port: process.env.DB_PORT || process.env.port || 5432,
  user: process.env.DB_USER || process.env.user,
  password: process.env.DB_PASSWORD || process.env.password,
  database: process.env.DB_NAME || process.env.database,
});

async function testConnection() {
  console.log("🔍 Probando conexión a PostgreSQL...\n");
  
  try {
    // Probar conexión básica
    const result = await pool.query("SELECT NOW() as current_time, version() as version");
    console.log("✅ Conexión exitosa!");
    console.log(`📅 Hora del servidor: ${result.rows[0].current_time}`);
    console.log(`📦 Versión: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}\n`);

    // Verificar extensiones
    console.log("🔍 Verificando extensiones...");
    const extensions = await pool.query(`
      SELECT extname, extversion 
      FROM pg_extension 
      ORDER BY extname
    `);
    
    if (extensions.rows.length > 0) {
      console.log("✅ Extensiones instaladas:");
      extensions.rows.forEach(ext => {
        console.log(`   - ${ext.extname} (v${ext.extversion})`);
      });
    } else {
      console.log("⚠️  No hay extensiones instaladas");
    }
    console.log();

    // Verificar tablas
    console.log("🔍 Verificando tablas...");
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    if (tables.rows.length > 0) {
      console.log(`✅ Tablas encontradas (${tables.rows.length}):`);
      tables.rows.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
    } else {
      console.log("⚠️  No hay tablas. Ejecuta el script de creación del esquema.");
    }
    console.log();

    // Verificar vistas
    console.log("🔍 Verificando vistas...");
    const views = await pool.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (views.rows.length > 0) {
      console.log(`✅ Vistas encontradas (${views.rows.length}):`);
      views.rows.forEach(view => {
        console.log(`   - ${view.table_name}`);
      });
    }
    console.log();

    // Verificar funciones
    console.log("🔍 Verificando funciones personalizadas...");
    const functions = await pool.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_type = 'FUNCTION'
      ORDER BY routine_name
    `);
    
    if (functions.rows.length > 0) {
      console.log(`✅ Funciones encontradas (${functions.rows.length}):`);
      functions.rows.forEach(func => {
        console.log(`   - ${func.routine_name}`);
      });
    }
    console.log();

    // Estadísticas del pool
    console.log("📊 Estadísticas del pool de conexiones:");
    console.log(`   - Total de conexiones: ${pool.totalCount}`);
    console.log(`   - Conexiones idle: ${pool.idleCount}`);
    console.log(`   - Conexiones en espera: ${pool.waitingCount}`);
    console.log();

    console.log("✅ Todas las pruebas completadas exitosamente!");
    
  } catch (error) {
    console.error("❌ Error al conectar a PostgreSQL:");
    console.error(`   Código: ${error.code}`);
    console.error(`   Mensaje: ${error.message}`);
    console.error("\n💡 Verifica:");
    console.error("   1. Que PostgreSQL esté corriendo");
    console.error("   2. Las credenciales en el archivo .env");
    console.error("   3. Que la base de datos exista");
    console.error("   4. Que el usuario tenga permisos");
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection();




