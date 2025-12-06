/**
 * Script para crear datos iniciales en la base de datos
 * - Roles (Administrador, Vendedor, etc.)
 * - Usuario administrador
 * - Categorías básicas
 */
require("dotenv").config();
const { Pool } = require("pg");
const bcrypt = require("bcrypt");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "farma_gest",
});

async function crearDatosIniciales() {
  console.log("🚀 Creando datos iniciales para FarmaGest...\n");
  
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    
    // 1. Crear roles
    console.log("1. Creando roles...");
    const roles = [
      { nombre: "Administrador", descripcion: "Acceso completo al sistema" },
      { nombre: "Vendedor", descripcion: "Puede realizar ventas y consultar productos" },
      { nombre: "Gerente", descripcion: "Puede gestionar productos, clientes y ver reportes" }
    ];
    
    for (const rol of roles) {
      const checkRol = await client.query(
        "SELECT rol_id FROM roles WHERE rol = $1",
        [rol.nombre]
      );
      
      if (checkRol.rows.length === 0) {
        await client.query(
          "INSERT INTO roles (rol) VALUES ($1)",
          [rol.nombre]
        );
        console.log(`   ✅ Rol '${rol.nombre}' creado`);
      } else {
        console.log(`   ℹ️  Rol '${rol.nombre}' ya existe`);
      }
    }
    
    // 2. Obtener ID del rol Administrador
    const adminRol = await client.query(
      "SELECT rol_id FROM roles WHERE rol = 'Administrador'"
    );
    const adminRolId = adminRol.rows[0].rol_id;
    
    // 3. Crear usuario administrador
    console.log("\n2. Creando usuario administrador...");
    const adminEmail = "admin@farmagest.com";
    const adminPassword = "admin123"; // Contraseña por defecto
    
    const checkAdmin = await client.query(
      "SELECT usuario_id FROM usuarios WHERE correo = $1",
      [adminEmail]
    );
    
    if (checkAdmin.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await client.query(
        `INSERT INTO usuarios (nombre, apellido, correo, contrasena, rol_id, estado)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ["Administrador", "Sistema", adminEmail, hashedPassword, adminRolId, true]
      );
      console.log(`   ✅ Usuario administrador creado`);
      console.log(`   📧 Email: ${adminEmail}`);
      console.log(`   🔑 Contraseña: ${adminPassword}`);
    } else {
      console.log(`   ℹ️  Usuario administrador ya existe`);
    }
    
    // 4. Crear categorías básicas
    console.log("\n3. Creando categorías básicas...");
    const categorias = [
      "Medicamentos",
      "Suplementos",
      "Cuidado Personal",
      "Bebés",
      "Primeros Auxilios",
      "Otros"
    ];
    
    for (const categoria of categorias) {
      const checkCat = await client.query(
        "SELECT categoria_id FROM categorias WHERE nombre = $1",
        [categoria]
      );
      
      if (checkCat.rows.length === 0) {
        await client.query(
          "INSERT INTO categorias (nombre) VALUES ($1)",
          [categoria]
        );
        console.log(`   ✅ Categoría '${categoria}' creada`);
      } else {
        console.log(`   ℹ️  Categoría '${categoria}' ya existe`);
      }
    }
    
    await client.query("COMMIT");
    
    console.log("\n✅ ¡Datos iniciales creados exitosamente!");
    console.log("\n📋 Resumen:");
    console.log("   - Roles creados: Administrador, Vendedor, Gerente");
    console.log("   - Usuario administrador:");
    console.log("     Email: admin@farmagest.com");
    console.log("     Contraseña: admin123");
    console.log("   - Categorías básicas creadas");
    console.log("\n🚀 Ahora puedes iniciar sesión en el frontend!");
    
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("\n❌ Error al crear datos iniciales:");
    console.error(`   ${error.message}`);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

crearDatosIniciales();


