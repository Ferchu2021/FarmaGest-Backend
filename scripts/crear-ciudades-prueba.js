const db = require("../db");

const ciudades = [
  { ciudad: "Buenos Aires", codigo_postal: "C1000", provincia_id: 1 },
  { ciudad: "Córdoba", codigo_postal: "X5000", provincia_id: 2 },
  { ciudad: "Rosario", codigo_postal: "S2000", provincia_id: 3 },
  { ciudad: "Mendoza", codigo_postal: "M5500", provincia_id: 4 },
  { ciudad: "Tucumán", codigo_postal: "T4000", provincia_id: 5 },
  { ciudad: "La Plata", codigo_postal: "B1900", provincia_id: 1 },
  { ciudad: "Mar del Plata", codigo_postal: "B7600", provincia_id: 1 },
  { ciudad: "Salta", codigo_postal: "A4400", provincia_id: 6 },
  { ciudad: "Santa Fe", codigo_postal: "S3000", provincia_id: 3 },
  { ciudad: "San Juan", codigo_postal: "J5400", provincia_id: 7 },
  { ciudad: "Resistencia", codigo_postal: "H3500", provincia_id: 8 },
  { ciudad: "Corrientes", codigo_postal: "W3400", provincia_id: 9 },
  { ciudad: "Posadas", codigo_postal: "N3300", provincia_id: 10 },
  { ciudad: "Formosa", codigo_postal: "P3600", provincia_id: 11 },
  { ciudad: "Neuquén", codigo_postal: "Q8300", provincia_id: 12 },
  { ciudad: "Bahía Blanca", codigo_postal: "B8000", provincia_id: 1 },
  { ciudad: "Quilmes", codigo_postal: "B1878", provincia_id: 1 },
  { ciudad: "Lomas de Zamora", codigo_postal: "B1832", provincia_id: 1 },
  { ciudad: "Lanús", codigo_postal: "B1824", provincia_id: 1 },
  { ciudad: "Banfield", codigo_postal: "B1828", provincia_id: 1 },
];

async function crearCiudades() {
  console.log("🏙️  Creando ciudades de prueba...\n");

  try {
    for (const ciudad of ciudades) {
      // Verificar si la ciudad ya existe
      const checkQuery = await db.query(
        "SELECT ciudad_id FROM ciudades WHERE ciudad = $1",
        [ciudad.ciudad]
      );
      
      const exists = checkQuery.rows && checkQuery.rows.length > 0;

      if (!exists) {
        await db.query(
          `INSERT INTO ciudades (ciudad, codigo_postal, provincia_id)
           VALUES ($1, $2, $3)`,
          [ciudad.ciudad, ciudad.codigo_postal, ciudad.provincia_id]
        );
        console.log(`✅ Ciudad creada: ${ciudad.ciudad}`);
      } else {
        console.log(`⏭️  Ciudad ya existe: ${ciudad.ciudad}`);
      }
    }

    // Verificar el total de ciudades
    const countQuery = await db.query("SELECT COUNT(*) as count FROM ciudades");
    const total = countQuery.rows[0].count;

    console.log(`\n📊 Total de ciudades en la base de datos: ${total}`);
    console.log("\n✅ Proceso completado exitosamente!");
  } catch (error) {
    console.error("\n❌ Error al crear ciudades:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

crearCiudades();



