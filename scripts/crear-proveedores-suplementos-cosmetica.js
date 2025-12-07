/**
 * Script para crear proveedores de suplementos, cosmética y productos de cuidado personal
 */
require("dotenv").config();
const db = require("../db");

console.log("🏢 Creando proveedores de suplementos y cosmética...\n");

// Lista de proveedores para suplementos y cosmética
const proveedores = [
  // Suplementos nutricionales
  {
    razon_social: "Nature's Bounty Argentina S.A.",
    direccion: "Av. del Libertador 1850, C1112AAP CABA, Buenos Aires",
    telefono: "011-4780-2200",
    email: "ventas@naturesbounty.com.ar",
  },
  {
    razon_social: "Centrum Argentina S.R.L.",
    direccion: "Av. Corrientes 2345, C1043AAQ CABA, Buenos Aires",
    telefono: "011-4322-8100",
    email: "info@centrum.com.ar",
  },
  {
    razon_social: "Enerzona Argentina S.A.",
    direccion: "Av. Santa Fe 3200, C1425BGP CABA, Buenos Aires",
    telefono: "011-4821-1500",
    email: "contacto@enerzona.com.ar",
  },
  {
    razon_social: "Prozis Suplementos S.A.",
    direccion: "Av. Córdoba 4567, C1188AAV CABA, Buenos Aires",
    telefono: "011-4871-2400",
    email: "ventas@prozis.com.ar",
  },
  {
    razon_social: "Sportlife Argentina S.A.",
    direccion: "Av. Libertador 4980, Piso 8, C1428ARF CABA",
    telefono: "011-4788-1100",
    email: "info@sportlife.com.ar",
  },
  
  // Cosméticos y cuidado personal
  {
    razon_social: "L'Oréal Argentina S.A.",
    direccion: "Av. del Libertador 4980, Piso 12, C1428ARF CABA",
    telefono: "011-4780-7000",
    email: "contacto@loreal.com.ar",
  },
  {
    razon_social: "Unilever Argentina S.A.",
    direccion: "Av. del Libertador 4980, Piso 15, C1428ARF CABA",
    telefono: "011-4780-8000",
    email: "info@unilever.com.ar",
  },
  {
    razon_social: "P&G Argentina S.A.",
    direccion: "Av. del Libertador 4980, Piso 18, C1428ARF CABA",
    telefono: "011-4780-9000",
    email: "ventas@pg.com.ar",
  },
  {
    razon_social: "Nivea Argentina S.A.",
    direccion: "Av. Corrientes 2500, C1043AAR CABA, Buenos Aires",
    telefono: "011-4322-8200",
    email: "contacto@nivea.com.ar",
  },
  {
    razon_social: "Garnier Argentina S.A.",
    direccion: "Av. Santa Fe 3300, C1425BGQ CABA, Buenos Aires",
    telefono: "011-4821-1600",
    email: "info@garnier.com.ar",
  },
  {
    razon_social: "Vichy Argentina S.A.",
    direccion: "Av. Córdoba 4600, C1188AAW CABA, Buenos Aires",
    telefono: "011-4871-2500",
    email: "ventas@vichy.com.ar",
  },
  {
    razon_social: "La Roche-Posay Argentina S.A.",
    direccion: "Av. Libertador 4980, Piso 10, C1428ARF CABA",
    telefono: "011-4788-1200",
    email: "contacto@larocheposay.com.ar",
  },
  
  // Productos naturales y orgánicos
  {
    razon_social: "Weleda Argentina S.A.",
    direccion: "Av. del Libertador 1850, Piso 5, C1112AAP CABA",
    telefono: "011-4780-2300",
    email: "info@weleda.com.ar",
  },
  {
    razon_social: "Bioderma Argentina S.A.",
    direccion: "Av. Corrientes 2350, C1043AAQ CABA, Buenos Aires",
    telefono: "011-4322-8300",
    email: "ventas@bioderma.com.ar",
  },
  {
    razon_social: "Avene Argentina S.A.",
    direccion: "Av. Santa Fe 3250, C1425BGR CABA, Buenos Aires",
    telefono: "011-4821-1700",
    email: "contacto@avene.com.ar",
  },
  
  // Maquillaje
  {
    razon_social: "Maybelline Argentina S.A.",
    direccion: "Av. Córdoba 4700, C1188AAX CABA, Buenos Aires",
    telefono: "011-4871-2600",
    email: "info@maybelline.com.ar",
  },
  {
    razon_social: "Revlon Argentina S.A.",
    direccion: "Av. Libertador 4980, Piso 9, C1428ARF CABA",
    telefono: "011-4788-1300",
    email: "ventas@revlon.com.ar",
  },
  {
    razon_social: "MAC Cosmetics Argentina S.A.",
    direccion: "Av. del Libertador 1850, Piso 6, C1112AAP CABA",
    telefono: "011-4780-2400",
    email: "contacto@maccosmetics.com.ar",
  },
  
  // Perfumería
  {
    razon_social: "Coty Argentina S.A.",
    direccion: "Av. Corrientes 2400, C1043AAS CABA, Buenos Aires",
    telefono: "011-4322-8400",
    email: "info@coty.com.ar",
  },
  {
    razon_social: "Inter Parfums Argentina S.A.",
    direccion: "Av. Santa Fe 3350, C1425BGS CABA, Buenos Aires",
    telefono: "011-4821-1800",
    email: "ventas@interparfums.com.ar",
  },
  
  // Productos para bebés y niños
  {
    razon_social: "Johnson & Johnson Argentina S.A.",
    direccion: "Av. Córdoba 4800, C1188AAY CABA, Buenos Aires",
    telefono: "011-4871-2700",
    email: "contacto@jnj.com.ar",
  },
  {
    razon_social: "Huggies Argentina S.A.",
    direccion: "Av. Libertador 4980, Piso 11, C1428ARF CABA",
    telefono: "011-4788-1400",
    email: "info@huggies.com.ar",
  },
];

async function crearProveedores() {
  const client = await db.pool.connect();
  
  try {
    await client.query("BEGIN");

    let creados = 0;
    let duplicados = 0;

    for (const proveedor of proveedores) {
      // Verificar si ya existe
      const existe = await client.query(
        `SELECT proveedor_id FROM proveedores WHERE razon_social = $1`,
        [proveedor.razon_social]
      );

      if (existe.rows.length > 0) {
        console.log(`   ⚠️  Ya existe: ${proveedor.razon_social}`);
        duplicados++;
        continue;
      }

      // Insertar proveedor
      await client.query(
        `INSERT INTO proveedores (razon_social, direccion, telefono, email)
         VALUES ($1, $2, $3, $4)`,
        [
          proveedor.razon_social,
          proveedor.direccion,
          proveedor.telefono,
          proveedor.email,
        ]
      );

      creados++;
      console.log(`   ✅ Creado: ${proveedor.razon_social}`);
    }

    await client.query("COMMIT");

    console.log("\n" + "=".repeat(60));
    console.log(`✅ PROCESO COMPLETADO`);
    console.log("=".repeat(60));
    console.log(`📦 Proveedores creados: ${creados}`);
    console.log(`⚠️  Proveedores duplicados (omitidos): ${duplicados}`);
    console.log("=".repeat(60) + "\n");

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

crearProveedores();

