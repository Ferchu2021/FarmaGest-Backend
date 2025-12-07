/**
 * Script para agregar obras sociales argentinas con planes y descuentos
 */
require("dotenv").config();
const db = require("../db");

console.log("🏥 Creando obras sociales argentinas...\n");

// Lista de obras sociales con sus planes y descuentos típicos
const obrasSociales = [
  // Obras sociales principales
  {
    obra_social: "OSDE",
    plan: "210",
    descuento: 20.00,
    codigo: "OSDE210",
  },
  {
    obra_social: "OSDE",
    plan: "310",
    descuento: 25.00,
    codigo: "OSDE310",
  },
  {
    obra_social: "OSDE",
    plan: "410",
    descuento: 30.00,
    codigo: "OSDE410",
  },
  {
    obra_social: "Swiss Medical",
    plan: "SMG 20",
    descuento: 20.00,
    codigo: "SMG20",
  },
  {
    obra_social: "Swiss Medical",
    plan: "SMG 30",
    descuento: 25.00,
    codigo: "SMG30",
  },
  {
    obra_social: "Swiss Medical",
    plan: "SMG 50",
    descuento: 30.00,
    codigo: "SMG50",
  },
  {
    obra_social: "Galeno",
    plan: "Basic",
    descuento: 15.00,
    codigo: "GALENO-BASIC",
  },
  {
    obra_social: "Galeno",
    plan: "Premium",
    descuento: 25.00,
    codigo: "GALENO-PREMIUM",
  },
  {
    obra_social: "Medicus",
    plan: "Plan Estándar",
    descuento: 20.00,
    codigo: "MEDICUS-EST",
  },
  {
    obra_social: "Medicus",
    plan: "Plan Premium",
    descuento: 30.00,
    codigo: "MEDICUS-PREM",
  },
  {
    obra_social: "Omint",
    plan: "Plan Básico",
    descuento: 20.00,
    codigo: "OMINT-BAS",
  },
  {
    obra_social: "Omint",
    plan: "Plan Integral",
    descuento: 35.00,
    codigo: "OMINT-INT",
  },
  {
    obra_social: "Prevención Salud",
    plan: "Standard",
    descuento: 18.00,
    codigo: "PREV-STD",
  },
  {
    obra_social: "Prevención Salud",
    plan: "Premium",
    descuento: 28.00,
    codigo: "PREV-PREM",
  },
  {
    obra_social: "Accord Salud",
    plan: "Plan Básico",
    descuento: 15.00,
    codigo: "ACCORD-BAS",
  },
  {
    obra_social: "Accord Salud",
    plan: "Plan Superior",
    descuento: 25.00,
    codigo: "ACCORD-SUP",
  },
  {
    obra_social: "Obra Social del Personal de la Industria Farmacéutica (OSPI)",
    plan: "Plan Regular",
    descuento: 20.00,
    codigo: "OSPI-REG",
  },
  {
    obra_social: "Obra Social del Personal de la Industria Farmacéutica (OSPI)",
    plan: "Plan Plus",
    descuento: 30.00,
    codigo: "OSPI-PLUS",
  },
  {
    obra_social: "Obra Social del Personal de Farmacia (OSPeF)",
    plan: "Plan Estándar",
    descuento: 22.00,
    codigo: "OSPeF-EST",
  },
  {
    obra_social: "Obra Social del Personal de Farmacia (OSPeF)",
    plan: "Plan Premium",
    descuento: 32.00,
    codigo: "OSPeF-PREM",
  },
  {
    obra_social: "DASUTEN",
    plan: "Plan Básico",
    descuento: 18.00,
    codigo: "DASUTEN-BAS",
  },
  {
    obra_social: "DASUTEN",
    plan: "Plan Completo",
    descuento: 28.00,
    codigo: "DASUTEN-COM",
  },
  {
    obra_social: "Obra Social de Empleados de Comercio (OSECAC)",
    plan: "Plan Regular",
    descuento: 20.00,
    codigo: "OSECAC-REG",
  },
  {
    obra_social: "Obra Social de Empleados de Comercio (OSECAC)",
    plan: "Plan Plus",
    descuento: 30.00,
    codigo: "OSECAC-PLUS",
  },
  {
    obra_social: "OSPACA (Obra Social del Personal de la Actividad Comercial)",
    plan: "Plan Estándar",
    descuento: 18.00,
    codigo: "OSPACA-EST",
  },
  {
    obra_social: "OSPACA (Obra Social del Personal de la Actividad Comercial)",
    plan: "Plan Superior",
    descuento: 28.00,
    codigo: "OSPACA-SUP",
  },
  {
    obra_social: "Obra Social de Empleados de la Industria (OSEI)",
    plan: "Plan Básico",
    descuento: 15.00,
    codigo: "OSEI-BAS",
  },
  {
    obra_social: "Obra Social de Empleados de la Industria (OSEI)",
    plan: "Plan Integral",
    descuento: 25.00,
    codigo: "OSEI-INT",
  },
  {
    obra_social: "Obra Social Bancaria (OSBA)",
    plan: "Plan Regular",
    descuento: 20.00,
    codigo: "OSBA-REG",
  },
  {
    obra_social: "Obra Social Bancaria (OSBA)",
    plan: "Plan Premium",
    descuento: 30.00,
    codigo: "OSBA-PREM",
  },
  {
    obra_social: "Obra Social del Personal de la Construcción (OSPC)",
    plan: "Plan Estándar",
    descuento: 18.00,
    codigo: "OSPC-EST",
  },
  {
    obra_social: "Obra Social del Personal de la Construcción (OSPC)",
    plan: "Plan Superior",
    descuento: 28.00,
    codigo: "OSPC-SUP",
  },
  {
    obra_social: "Obra Social del Personal de la Alimentación (OSPA)",
    plan: "Plan Básico",
    descuento: 15.00,
    codigo: "OSPA-BAS",
  },
  {
    obra_social: "Obra Social del Personal de la Alimentación (OSPA)",
    plan: "Plan Completo",
    descuento: 25.00,
    codigo: "OSPA-COM",
  },
  {
    obra_social: "OSPRERA (Obra Social del Personal Rural y Estibadores)",
    plan: "Plan Regular",
    descuento: 20.00,
    codigo: "OSPRERA-REG",
  },
  {
    obra_social: "OSPRERA (Obra Social del Personal Rural y Estibadores)",
    plan: "Plan Plus",
    descuento: 30.00,
    codigo: "OSPRERA-PLUS",
  },
  {
    obra_social: "Obra Social de Luz y Fuerza (OSLYF)",
    plan: "Plan Estándar",
    descuento: 22.00,
    codigo: "OSLYF-EST",
  },
  {
    obra_social: "Obra Social de Luz y Fuerza (OSLYF)",
    plan: "Plan Premium",
    descuento: 32.00,
    codigo: "OSLYF-PREM",
  },
  {
    obra_social: "OSFATLYN (Obra Social de Farmacéuticos y Bioquímicos)",
    plan: "Plan Regular",
    descuento: 25.00,
    codigo: "OSFATLYN-REG",
  },
  {
    obra_social: "OSFATLYN (Obra Social de Farmacéuticos y Bioquímicos)",
    plan: "Plan Superior",
    descuento: 35.00,
    codigo: "OSFATLYN-SUP",
  },
  {
    obra_social: "IOMA (Instituto de Obra Médico Asistencial)",
    plan: "Plan Estándar",
    descuento: 15.00,
    codigo: "IOMA-EST",
  },
  {
    obra_social: "IOMA (Instituto de Obra Médico Asistencial)",
    plan: "Plan Plus",
    descuento: 25.00,
    codigo: "IOMA-PLUS",
  },
  {
    obra_social: "PAMI (Programa de Atención Médica Integral)",
    plan: "Plan Regular",
    descuento: 40.00,
    codigo: "PAMI-REG",
  },
  {
    obra_social: "PAMI (Programa de Atención Médica Integral)",
    plan: "Plan Plus",
    descuento: 50.00,
    codigo: "PAMI-PLUS",
  },
  {
    obra_social: "Obra Social de Prensa (OSPREN)",
    plan: "Plan Básico",
    descuento: 18.00,
    codigo: "OSPREN-BAS",
  },
  {
    obra_social: "Obra Social de Prensa (OSPREN)",
    plan: "Plan Integral",
    descuento: 28.00,
    codigo: "OSPREN-INT",
  },
  {
    obra_social: "OSDEBA (Obra Social de Empleados de Banco de la Nación)",
    plan: "Plan Regular",
    descuento: 20.00,
    codigo: "OSDEBA-REG",
  },
  {
    obra_social: "OSDEBA (Obra Social de Empleados de Banco de la Nación)",
    plan: "Plan Premium",
    descuento: 30.00,
    codigo: "OSDEBA-PREM",
  },
  {
    obra_social: "Obra Social de Empleados de la Administración Pública (OSEP)",
    plan: "Plan Estándar",
    descuento: 15.00,
    codigo: "OSEP-EST",
  },
  {
    obra_social: "Obra Social de Empleados de la Administración Pública (OSEP)",
    plan: "Plan Superior",
    descuento: 25.00,
    codigo: "OSEP-SUP",
  },
];

async function agregarObrasSociales() {
  const client = await db.pool.connect();
  
  try {
    await client.query("BEGIN");

    console.log("=".repeat(70));
    console.log("AGREGANDO OBRAS SOCIALES");
    console.log("=".repeat(70));

    let obrasSocialesCreadas = 0;
    let obrasSocialesExistentes = 0;
    let obrasSocialesDuplicadas = 0;

    for (const obraSocial of obrasSociales) {
      // Verificar si ya existe (misma obra social + plan)
      const existe = await client.query(
        `SELECT obra_social_id FROM obras_sociales 
         WHERE obra_social = $1 AND plan = $2 AND deleted_at IS NULL`,
        [obraSocial.obra_social, obraSocial.plan]
      );

      if (existe.rows.length > 0) {
        obrasSocialesExistentes++;
        console.log(`   ⏭️  Ya existe: ${obraSocial.obra_social} - ${obraSocial.plan}`);
        continue;
      }

      // Verificar si existe con el mismo código
      if (obraSocial.codigo) {
        const existeCodigo = await client.query(
          `SELECT obra_social_id FROM obras_sociales 
           WHERE codigo = $1 AND deleted_at IS NULL`,
          [obraSocial.codigo]
        );

        if (existeCodigo.rows.length > 0) {
          obrasSocialesDuplicadas++;
          console.log(`   ⚠️  Código duplicado (omitido): ${obraSocial.codigo} - ${obraSocial.obra_social}`);
          continue;
        }
      }

      // Insertar nueva obra social
      await client.query(
        `INSERT INTO obras_sociales (obra_social, plan, descuento, codigo)
         VALUES ($1, $2, $3, $4)`,
        [
          obraSocial.obra_social,
          obraSocial.plan,
          obraSocial.descuento,
          obraSocial.codigo || null,
        ]
      );

      obrasSocialesCreadas++;
      console.log(`   ✅ Creada: ${obraSocial.obra_social} - ${obraSocial.plan} (${obraSocial.descuento}% desc.)`);
    }

    await client.query("COMMIT");

    console.log("\n" + "=".repeat(70));
    console.log("✅ PROCESO COMPLETADO");
    console.log("=".repeat(70));
    console.log(`📊 Resumen:`);
    console.log(`   • Obras sociales creadas: ${obrasSocialesCreadas}`);
    console.log(`   • Obras sociales ya existentes: ${obrasSocialesExistentes}`);
    console.log(`   • Obras sociales con código duplicado (omitidas): ${obrasSocialesDuplicadas}`);
    console.log(`   • Total procesadas: ${obrasSociales.length}`);
    console.log("=".repeat(70) + "\n");

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

agregarObrasSociales();

