/**
 * Script para probar el login completo simulando la llamada
 */
require("dotenv").config();
const Usuario = require("../models/usuariosModel");

const correo = process.env.TEST_EMAIL || "admin@farmagest.com";
const contrasena = process.env.TEST_PASSWORD || "Admin2024!";
const ip_address = process.env.TEST_IP || "127.0.0.1";
const user_agent = process.env.TEST_USER_AGENT || "Test Agent";

console.log(`🔐 Probando login completo...\n`);
console.log(`Correo: ${correo}`);
console.log(`Contraseña: ${contrasena}\n`);

Usuario.validarUsuarioLogin(
  correo,
  contrasena,
  ip_address,
  user_agent,
  (err, usuario) => {
    if (err) {
      console.error("❌ Error:", err.message);
      console.error(err);
    } else {
      console.log("✅ Login exitoso!");
      console.log("\n📋 Datos del usuario:");
      console.log(JSON.stringify(usuario, null, 2));
    }
    process.exit(err ? 1 : 0);
  }
);




