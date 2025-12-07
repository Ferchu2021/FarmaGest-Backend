const db = require("../db");

async function verificarObrasSociales() {
  try {
    const result = await db.query(
      "SELECT DISTINCT obra_social, COUNT(*) as cantidad FROM obras_sociales GROUP BY obra_social ORDER BY obra_social"
    );
    
    const rows = result.rows || result;
    console.log("Obras sociales únicas:");
    rows.forEach((r) => {
      console.log(`- "${r.obra_social}" (${r.cantidad} registros)`);
    });
    
    // Verificar variaciones de OSDE y Swiss
    const resultVariaciones = await db.query(
      "SELECT obra_social, obra_social_id FROM obras_sociales WHERE obra_social ILIKE '%osde%' OR obra_social ILIKE '%swiss%' ORDER BY obra_social"
    );
    
    const variaciones = resultVariaciones.rows || resultVariaciones;
    console.log("\nVariaciones de OSDE y Swiss:");
    variaciones.forEach((r) => {
      console.log(`- ID: ${r.obra_social_id}, Nombre: "${r.obra_social}"`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

verificarObrasSociales();



