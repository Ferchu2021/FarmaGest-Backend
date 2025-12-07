/**
 * Script para resetear contraseñas de usuarios a valores por defecto
 * Uso: node scripts/resetear-contrasenas.js
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

async function resetearContrasenas() {
  console.log("🔐 Reseteando contraseñas de usuarios...\n");

  try {
    // Obtener todos los usuarios
    const usuarios = await pool.query(
      `SELECT u.usuario_id, u.nombre, u.apellido, u.correo, r.rol 
       FROM usuarios u 
       LEFT JOIN roles r ON u.rol_id = r.rol_id 
       WHERE u.deleted_at IS NULL 
       ORDER BY u.usuario_id`
    );

    if (usuarios.rows.length === 0) {
      console.log("❌ No hay usuarios registrados.");
      await pool.end();
      return;
    }

    console.log("📋 Usuarios encontrados:\n");

    // Resetear cada usuario con una contraseña basada en su rol
    for (const usuario of usuarios.rows) {
      let nuevaContrasena;

      // Determinar contraseña según el rol
      if (usuario.rol === "Administrador") {
        nuevaContrasena = "Admin2024!";
      } else if (usuario.rol === "Vendedor") {
        nuevaContrasena = "Vendedor2024!";
      } else if (usuario.rol === "Gerente") {
        nuevaContrasena = "Gerente2024!";
      } else {
        nuevaContrasena = "Usuario2024!";
      }

      // Hashear la contraseña
      const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);

      // Actualizar en la base de datos
      await pool.query(
        `UPDATE usuarios 
         SET contrasena = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE usuario_id = $2`,
        [hashedPassword, usuario.usuario_id]
      );

      console.log(`✅ ${usuario.nombre} ${usuario.apellido}`);
      console.log(`   Email: ${usuario.correo}`);
      console.log(`   Rol: ${usuario.rol || "Sin rol"}`);
      console.log(`   Nueva contraseña: ${nuevaContrasena}`);
      console.log();
    }

    console.log("✅ ¡Todas las contraseñas han sido actualizadas!\n");
    console.log("📝 Resumen de contraseñas:");
    console.log("   - Administrador: Admin2024!");
    console.log("   - Vendedor: Vendedor2024!");
    console.log("   - Gerente: Gerente2024!");
    console.log("   - Otros: Usuario2024!");
    console.log("\n🚀 Ahora puedes iniciar sesión con estas credenciales.");
  } catch (error) {
    console.error("\n❌ Error al resetear contraseñas:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetearContrasenas();



