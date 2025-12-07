/**
 * Script para verificar sesiones
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

async function verificarSesiones() {
  try {
    const result = await pool.query(
      `SELECT sesion_id, correo_usuario, hora_logueo, hora_logout 
       FROM sesiones 
       ORDER BY hora_logueo DESC 
       LIMIT 5`
    );

    console.log("📋 Últimas 5 sesiones:\n");
    if (result.rows.length === 0) {
      console.log("   No hay sesiones registradas.\n");
    } else {
      result.rows.forEach((s, i) => {
        console.log(`${i + 1}. Session: ${s.sesion_id.substring(0, 20)}...`);
        console.log(`   Email: ${s.correo_usuario}`);
        console.log(`   Login: ${s.hora_logueo}`);
        console.log(`   Logout: ${s.hora_logout || "Activa"}`);
        console.log();
      });
    }

    // Probar logout
    if (result.rows.length > 0) {
      const primeraSesion = result.rows[0];
      console.log(`🔓 Probando logout con session: ${primeraSesion.sesion_id.substring(0, 20)}...`);
      
      const updateResult = await pool.query(
        `UPDATE sesiones 
         SET hora_logout = CURRENT_TIMESTAMP 
         WHERE sesion_id = $1`,
        [primeraSesion.sesion_id]
      );

      console.log(`   Filas afectadas: ${updateResult.rowCount}`);
      if (updateResult.rowCount > 0) {
        console.log(`   ✅ Logout exitoso`);
      } else {
        console.log(`   ❌ No se encontró la sesión`);
      }
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
  }
}

verificarSesiones();



