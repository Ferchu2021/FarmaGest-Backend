/**
 * Script para probar el logout
 */
require("dotenv").config();
const Usuario = require("../models/usuariosModel");

// Primero hacer login para obtener un session_id válido
const correo = "admin@farmagest.com";
const contrasena = "Admin2024!";
const ip_address = "127.0.0.1";
const user_agent = "Test Agent";

console.log("🔐 Probando login y logout...\n");

Usuario.validarUsuarioLogin(
  correo,
  contrasena,
  ip_address,
  user_agent,
  (err, usuario) => {
    if (err) {
      console.error("❌ Error en login:", err.message);
      process.exit(1);
    }

    console.log("✅ Login exitoso!");
    console.log(`   Session ID: ${usuario.sesion_id}\n`);

    // Ahora probar logout
    console.log("🔓 Probando logout...");
    Usuario.logoutUsuario(usuario.sesion_id, (err, resultado) => {
      if (err) {
        console.error("❌ Error en logout:", err.message);
        process.exit(1);
      }

      const affectedRows = resultado.rowCount || resultado.affectedRows || 0;
      if (affectedRows > 0) {
        console.log("✅ Logout exitoso!");
        console.log(`   Sesión cerrada correctamente`);
      } else {
        console.log("⚠️  No se encontró la sesión para cerrar");
      }
      process.exit(0);
    });
  }
);

