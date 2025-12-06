// Script para generar el comando SQL específico para tu configuración
// Lee el archivo .env y genera el ALTER USER correspondiente

require("dotenv").config();
const fs = require("fs");
const path = require("path");

const usuario = process.env.user;
const password = process.env.password;
const host = process.env.host || "localhost";

console.log("🔍 Generando comando SQL para tu configuración...\n");

if (!usuario || !password) {
  console.error("❌ Error: No se encontraron las credenciales en el archivo .env");
  console.error("   Verifica que tu archivo .env tenga:");
  console.error("   - user=tu_usuario");
  console.error("   - password=tu_contraseña");
  process.exit(1);
}

console.log("📋 Configuración encontrada:");
console.log(`   Usuario: ${usuario}`);
console.log(`   Host: ${host}`);
console.log(`   (Contraseña: ********)\n`);

// Determinar si es localhost o remoto
const isLocalhost = host === "localhost" || host === "127.0.0.1";
const hostSQL = isLocalhost ? "localhost" : "%";

console.log("=".repeat(60));
console.log("📝 COMANDO SQL A EJECUTAR:");
console.log("=".repeat(60));
console.log("\n1. Abre MySQL Workbench");
console.log("2. Conéctate como administrador (root o usuario con privilegios)");
console.log("3. Ejecuta este comando:\n");

console.log(`ALTER USER '${usuario}'@'${hostSQL}' IDENTIFIED WITH mysql_native_password BY '${password}';`);
console.log(`FLUSH PRIVILEGES;\n`);

console.log("=".repeat(60));
console.log("✅ VERIFICACIÓN:");
console.log("=".repeat(60));
console.log("\nDespués de ejecutar, verifica con:\n");
console.log(`SELECT user, host, plugin FROM mysql.user WHERE user = '${usuario}';\n`);
console.log("Debe mostrar 'mysql_native_password' en la columna 'plugin'\n");

// También generar un archivo SQL
const sqlFile = path.join(__dirname, "fix-auth-personalizado.sql");
const sqlContent = `-- Comando SQL generado automáticamente para tu configuración
-- Ejecuta esto en MySQL Workbench como administrador

ALTER USER '${usuario}'@'${hostSQL}' IDENTIFIED WITH mysql_native_password BY '${password}';
FLUSH PRIVILEGES;

-- Verificar que funcionó
SELECT user, host, plugin FROM mysql.user WHERE user = '${usuario}';
-- Debe mostrar 'mysql_native_password' en la columna 'plugin'
`;

fs.writeFileSync(sqlFile, sqlContent, "utf8");

console.log(`💾 También se guardó el comando en: ${sqlFile}`);
console.log("   Puedes abrir este archivo en MySQL Workbench y ejecutarlo directamente\n");




