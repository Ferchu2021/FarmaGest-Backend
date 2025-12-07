/**
 * Script para probar el login del administrador
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

async function testLogin() {
  const correo = "admin@farmagest.com";
  const contrasena = "Admin2024!";

  console.log(`🔐 Probando login para: ${correo}`);
  console.log(`   Contraseña: ${contrasena}\n`);

  try {
    // Verificar si el usuario existe
    const usuarioResult = await pool.query(
      `SELECT 
        u.usuario_id, 
        u.nombre, 
        u.apellido, 
        u.correo, 
        u.estado, 
        u.rol_id,
        u.contrasena,
        r.rol
      FROM usuarios u
      LEFT JOIN roles r ON r.rol_id = u.rol_id
      WHERE u.correo = $1 AND u.deleted_at IS NULL`,
      [correo]
    );

    if (usuarioResult.rows.length === 0) {
      console.log("❌ Usuario no encontrado");
      await pool.end();
      return;
    }

    const usuario = usuarioResult.rows[0];
    console.log("✅ Usuario encontrado:");
    console.log(`   ID: ${usuario.usuario_id}`);
    console.log(`   Nombre: ${usuario.nombre} ${usuario.apellido}`);
    console.log(`   Rol: ${usuario.rol}`);
    console.log(`   Estado: ${usuario.estado}`);
    console.log(`   Hash de contraseña: ${usuario.contrasena.substring(0, 20)}...`);
    console.log();

    // Comparar contraseña
    console.log("🔑 Comparando contraseña...");
    const match = await bcrypt.compare(contrasena, usuario.contrasena);

    if (match) {
      console.log("✅ Contraseña correcta!");
    } else {
      console.log("❌ Contraseña incorrecta!");
      console.log("   Intentando con otras contraseñas...");
      
      const passwords = ["admin123", "Admin2024!", "Admin2024"];
      for (const pwd of passwords) {
        const testMatch = await bcrypt.compare(pwd, usuario.contrasena);
        if (testMatch) {
          console.log(`   ✅ La contraseña correcta es: "${pwd}"`);
          break;
        }
      }
    }

    // Obtener permisos
    const permisosResult = await pool.query(
      `SELECT p.permiso 
       FROM roles_permisos rp
       JOIN permisos p ON p.permiso_id = rp.permiso_id
       WHERE rp.rol_id = $1`,
      [usuario.rol_id]
    );

    const permisos = permisosResult.rows.map((p) => p.permiso).join(", ") || "Sin permisos";
    console.log(`\n📋 Permisos: ${permisos}`);

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

testLogin();



