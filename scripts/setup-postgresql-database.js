/**
 * Script para crear la base de datos y usuario de PostgreSQL
 * Uso: node scripts/setup-postgresql-database.js
 * 
 * Este script crea:
 * - La base de datos farma_gest
 * - El usuario farma_app
 * - Las extensiones necesarias
 */

require("dotenv").config();
const { Pool } = require("pg");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

// Configuración para conectarse como postgres (superusuario)
const postgresConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  user: "postgres", // Usuario superusuario
  password: process.env.POSTGRES_PASSWORD || "", // Se pedirá si no está en .env
  database: "postgres", // Base de datos por defecto
};

// Configuración final para la aplicación
const appConfig = {
  host: process.env.DB_HOST || process.env.host || "localhost",
  port: process.env.DB_PORT || process.env.port || 5432,
  user: process.env.DB_USER || "farma_app",
  password: process.env.DB_PASSWORD || "FarmaApp2024!",
  database: process.env.DB_NAME || "farma_gest",
};

async function setupDatabase() {
  console.log("🚀 Configurando base de datos PostgreSQL para FarmaGest...\n");

  // Si no hay contraseña de postgres, intentar con psql
  if (!postgresConfig.password) {
    console.log("⚠️  No se encontró POSTGRES_PASSWORD en .env");
    console.log("   Intentando crear la base de datos usando psql...\n");
    
    try {
      // Intentar encontrar psql
      const psqlPath = "C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe";
      
      // Crear script SQL temporal
      const fs = require("fs");
      const sqlScript = `
-- Crear base de datos
SELECT 'CREATE DATABASE ${appConfig.database}' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${appConfig.database}')\\gexec

-- Crear usuario
DO \\$\\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '${appConfig.user}') THEN
    CREATE USER ${appConfig.user} WITH PASSWORD '${appConfig.password}';
  END IF;
END
\\$\\$;

-- Dar permisos
GRANT ALL PRIVILEGES ON DATABASE ${appConfig.database} TO ${appConfig.user};
      `;
      
      fs.writeFileSync("temp_setup.sql", sqlScript);
      
      console.log("📝 Ejecuta manualmente los siguientes comandos en PowerShell:\n");
      console.log("   & \"${psqlPath}\" -U postgres -f temp_setup.sql");
      console.log("\n   O ejecuta estos comandos en psql:\n");
      console.log(`   CREATE DATABASE ${appConfig.database};`);
      console.log(`   CREATE USER ${appConfig.user} WITH PASSWORD '${appConfig.password}';`);
      console.log(`   GRANT ALL PRIVILEGES ON DATABASE ${appConfig.database} TO ${appConfig.user};`);
      console.log(`   \\c ${appConfig.database}`);
      console.log(`   CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
      console.log(`   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
      
      return;
    } catch (error) {
      console.error("❌ Error:", error.message);
      return;
    }
  }

  // Si hay contraseña, proceder con Pool
  const postgresPool = new Pool(postgresConfig);

  try {
    // Crear base de datos
    console.log("📦 Creando base de datos...");
    await postgresPool.query(
      `SELECT 'CREATE DATABASE ${appConfig.database}' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${appConfig.database}')`
    );
    
    // Verificar si existe
    const dbCheck = await postgresPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [appConfig.database]
    );
    
    if (dbCheck.rows.length === 0) {
      await postgresPool.query(`CREATE DATABASE ${appConfig.database}`);
      console.log(`   ✅ Base de datos '${appConfig.database}' creada`);
    } else {
      console.log(`   ℹ️  Base de datos '${appConfig.database}' ya existe`);
    }

    // Crear usuario
    console.log("\n👤 Creando usuario...");
    const userCheck = await postgresPool.query(
      `SELECT 1 FROM pg_user WHERE usename = $1`,
      [appConfig.user]
    );
    
    if (userCheck.rows.length === 0) {
      await postgresPool.query(
        `CREATE USER ${appConfig.user} WITH PASSWORD $1`,
        [appConfig.password]
      );
      console.log(`   ✅ Usuario '${appConfig.user}' creado`);
    } else {
      console.log(`   ℹ️  Usuario '${appConfig.user}' ya existe`);
    }

    // Dar permisos
    console.log("\n🔐 Configurando permisos...");
    await postgresPool.query(
      `GRANT ALL PRIVILEGES ON DATABASE ${appConfig.database} TO ${appConfig.user}`
    );
    console.log("   ✅ Permisos configurados");

    // Cerrar conexión a postgres
    await postgresPool.end();

    // Conectar a la nueva base de datos para crear extensiones
    console.log("\n🔌 Conectando a la base de datos...");
    const appPool = new Pool({
      ...postgresConfig,
      database: appConfig.database,
    });

    // Crear extensiones
    console.log("\n📚 Creando extensiones...");
    await appPool.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    console.log("   ✅ Extensión pg_trgm creada");
    
    await appPool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    console.log("   ✅ Extensión uuid-ossp creada");

    await appPool.end();

    console.log("\n✅ ¡Base de datos configurada exitosamente!");
    console.log("\n📋 Resumen:");
    console.log(`   Base de datos: ${appConfig.database}`);
    console.log(`   Usuario: ${appConfig.user}`);
    console.log(`   Host: ${appConfig.host}:${appConfig.port}`);
    console.log("\n🚀 Próximo paso: Ejecuta 'node scripts/crear-schema-postgresql.js'");

  } catch (error) {
    console.error("\n❌ Error al configurar la base de datos:");
    console.error(`   Código: ${error.code}`);
    console.error(`   Mensaje: ${error.message}`);
    
    if (error.code === "28P01" || error.message.includes("password")) {
      console.error("\n💡 Solución:");
      console.error("   1. Agrega la contraseña del usuario 'postgres' a tu archivo .env:");
      console.error("      POSTGRES_PASSWORD=tu_contraseña_de_postgres");
      console.error("\n   2. O ejecuta manualmente en pgAdmin o psql:");
      console.error(`      CREATE DATABASE ${appConfig.database};`);
      console.error(`      CREATE USER ${appConfig.user} WITH PASSWORD '${appConfig.password}';`);
      console.error(`      GRANT ALL PRIVILEGES ON DATABASE ${appConfig.database} TO ${appConfig.user};`);
    }
    
    process.exit(1);
  }
}

// Ejecutar
setupDatabase();



