/**
 * Script para crear la base de datos farma_gest
 */
require("dotenv").config();
const { Pool } = require("pg");

// Conectar a la base de datos 'postgres' para crear la nueva base de datos
const adminPool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: "postgres", // Conectarse a la base de datos por defecto
});

async function crearBaseDatos() {
  console.log("🚀 Creando base de datos farma_gest...\n");
  
  const client = await adminPool.connect();
  
  try {
    // Verificar si la base de datos ya existe
    const checkDb = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      ["farma_gest"]
    );
    
    if (checkDb.rows.length > 0) {
      console.log("ℹ️  La base de datos 'farma_gest' ya existe");
      console.log("   Saltando creación...\n");
    } else {
      // Crear la base de datos
      await client.query('CREATE DATABASE farma_gest');
      console.log("✅ Base de datos 'farma_gest' creada exitosamente\n");
    }
    
    // Cerrar conexión a postgres
    client.release();
    await adminPool.end();
    
    // Conectar a la nueva base de datos para crear extensiones
    console.log("📚 Creando extensiones necesarias...\n");
    const farmaPool = new Pool({
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "",
      database: "farma_gest",
    });
    
    const farmaClient = await farmaPool.connect();
    
    try {
      await farmaClient.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
      console.log("✅ Extensión pg_trgm creada");
      
      await farmaClient.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      console.log("✅ Extensión uuid-ossp creada");
      
      farmaClient.release();
      await farmaPool.end();
      
      console.log("\n✅ ¡Base de datos configurada exitosamente!");
      console.log("\n📋 Resumen:");
      console.log("   Base de datos: farma_gest");
      console.log("   Usuario: " + (process.env.DB_USER || "postgres"));
      console.log("   Host: " + (process.env.DB_HOST || "localhost") + ":" + (process.env.DB_PORT || 5432));
      console.log("\n🚀 Próximo paso: Ejecuta el esquema SQL");
      console.log("   node scripts/crear-schema-postgresql.js");
      
    } catch (error) {
      console.error("\n❌ Error al crear extensiones:");
      console.error(`   ${error.message}`);
      farmaClient.release();
      await farmaPool.end();
      process.exit(1);
    }
    
  } catch (error) {
    console.error("\n❌ Error al crear la base de datos:");
    console.error(`   Código: ${error.code}`);
    console.error(`   Mensaje: ${error.message}`);
    client.release();
    await adminPool.end();
    process.exit(1);
  }
}

crearBaseDatos();


