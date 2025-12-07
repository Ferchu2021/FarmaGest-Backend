/**
 * Script para crear usuarios adicionales
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

async function crearUsuariosAdicionales() {
  console.log("👥 Creando usuarios adicionales...\n");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Obtener IDs de roles
    const roles = await client.query(
      "SELECT rol_id, rol FROM roles ORDER BY rol_id"
    );
    
    const rolesMap = {};
    roles.rows.forEach((r) => {
      rolesMap[r.rol] = r.rol_id;
    });

    console.log("📋 Roles disponibles:");
    roles.rows.forEach((r) => {
      console.log(`   - ${r.rol} (ID: ${r.rol_id})`);
    });
    console.log();

    // Usuarios a crear
    const nuevosUsuarios = [
      {
        nombre: "Juan",
        apellido: "Pérez",
        correo: "juan.perez@farmagest.com",
        rol: "Vendedor",
        contrasena: "Vendedor2024!",
      },
      {
        nombre: "María",
        apellido: "González",
        correo: "maria.gonzalez@farmagest.com",
        rol: "Gerente",
        contrasena: "Gerente2024!",
      },
    ];

    let creados = 0;
    let existentes = 0;

    for (const usuario of nuevosUsuarios) {
      // Verificar si el usuario ya existe
      const existe = await client.query(
        "SELECT usuario_id FROM usuarios WHERE correo = $1",
        [usuario.correo]
      );

      if (existe.rows.length > 0) {
        console.log(`⚠️  Usuario ya existe: ${usuario.correo}`);
        existentes++;
        continue;
      }

      // Verificar que el rol existe
      const rolId = rolesMap[usuario.rol];
      if (!rolId) {
        console.log(
          `❌ Error: Rol "${usuario.rol}" no encontrado. Usuario ${usuario.correo} no creado.`
        );
        continue;
      }

      // Hashear la contraseña
      const hashedPassword = await bcrypt.hash(usuario.contrasena, 10);

      // Crear el usuario
      await client.query(
        `INSERT INTO usuarios (nombre, apellido, correo, contrasena, rol_id, estado) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          usuario.nombre,
          usuario.apellido,
          usuario.correo,
          hashedPassword,
          rolId,
          true,
        ]
      );

      console.log(`✅ Usuario creado: ${usuario.nombre} ${usuario.apellido}`);
      console.log(`   Correo: ${usuario.correo}`);
      console.log(`   Rol: ${usuario.rol}`);
      console.log(`   Contraseña: ${usuario.contrasena}`);
      console.log();
      creados++;
    }

    await client.query("COMMIT");

    console.log("=".repeat(50));
    console.log(`✅ Proceso completado:`);
    console.log(`   - Usuarios creados: ${creados}`);
    console.log(`   - Usuarios ya existentes: ${existentes}`);
    console.log("=".repeat(50));

    if (creados > 0) {
      console.log("\n📋 RESUMEN DE NUEVOS USUARIOS:");
      nuevosUsuarios.forEach((u) => {
        console.log(`\n   👤 ${u.nombre} ${u.apellido}`);
        console.log(`      Correo: ${u.correo}`);
        console.log(`      Rol: ${u.rol}`);
        console.log(`      Contraseña: ${u.contrasena}`);
      });
    }
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("\n❌ Error al crear usuarios:", error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

crearUsuariosAdicionales();



