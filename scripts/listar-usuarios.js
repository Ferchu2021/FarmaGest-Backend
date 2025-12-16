/**
 * Script para listar usuarios y sus correos
 */
require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "farma_gest",
});

async function listarUsuarios() {
  try {
    const result = await pool.query(
      `SELECT u.usuario_id, u.nombre, u.apellido, u.correo, r.rol 
       FROM usuarios u 
       LEFT JOIN roles r ON u.rol_id = r.rol_id 
       WHERE u.deleted_at IS NULL 
       ORDER BY u.usuario_id`
    );

    console.log("=== USUARIOS EN LA BASE DE DATOS ===\n");
    
    if (result.rows.length === 0) {
      console.log("No hay usuarios registrados.\n");
    } else {
      result.rows.forEach((usuario, index) => {
        console.log(`${index + 1}. ${usuario.nombre} ${usuario.apellido}`);
        console.log(`   Correo: ${usuario.correo}`);
        console.log(`   Rol: ${usuario.rol || "Sin rol"}`);
        console.log();
      });
      
      console.log("📧 CORREOS DE USUARIOS:");
      console.log("─".repeat(50));
      result.rows.forEach((usuario, index) => {
        console.log(`${index + 1}. ${usuario.correo}`);
      });
    }
  } catch (error) {
    console.error("❌ Error al listar usuarios:", error.message);
  } finally {
    await pool.end();
  }
}

listarUsuarios();










