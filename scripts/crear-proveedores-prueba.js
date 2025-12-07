/**
 * Script para crear 25 proveedores de prueba para FarmaGest
 */
require("dotenv").config();
const db = require("../db");

console.log("🏢 Creando 25 proveedores de prueba...\n");

// Lista de 25 proveedores realistas para farmacia
const proveedores = [
  {
    razon_social: "Laboratorios Bayer Argentina S.A.",
    direccion: "Av. del Libertador 4980, C1428ARF CABA, Buenos Aires",
    telefono: "011-4780-7000",
    email: "contacto@bayer.com.ar",
  },
  {
    razon_social: "Pfizer Argentina S.R.L.",
    direccion: "Av. Libertador 4980, Piso 15, C1428ARF CABA",
    telefono: "011-4831-0900",
    email: "info@pfizer.com.ar",
  },
  {
    razon_social: "GlaxoSmithKline Argentina S.A.",
    direccion: "Av. Corrientes 222, C1043AAP CABA, Buenos Aires",
    telefono: "011-4322-8000",
    email: "info@gsk.com.ar",
  },
  {
    razon_social: "Roche Argentina S.A.",
    direccion: "Ing. Enrique Butty 275, C1001AFB CABA",
    telefono: "011-4377-5300",
    email: "contacto@roche.com.ar",
  },
  {
    razon_social: "Novartis Argentina S.A.",
    direccion: "Av. del Libertador 4980, C1428ARF CABA",
    telefono: "011-4788-1000",
    email: "info@novartis.com.ar",
  },
  {
    razon_social: "Sanofi Argentina S.A.",
    direccion: "Av. del Libertador 4980, Piso 19, C1428ARF CABA",
    telefono: "011-4327-0200",
    email: "contacto@sanofi.com.ar",
  },
  {
    razon_social: "Laboratorios Bagó S.A.",
    direccion: "Av. Libertador 5800, B1606AOH Vicente López, Buenos Aires",
    telefono: "011-4703-8500",
    email: "info@bago.com.ar",
  },
  {
    razon_social: "Laboratorios Elea S.A.C.I.F. y A.",
    direccion: "Av. del Libertador 5690, B1636CGG Olivos, Buenos Aires",
    telefono: "011-4718-8000",
    email: "contacto@elea.com.ar",
  },
  {
    razon_social: "Laboratorios Raffo S.A.",
    direccion: "Av. Gral. Paz 6801, B1686BGB El Palomar, Buenos Aires",
    telefono: "011-4756-6400",
    email: "info@raffo.com.ar",
  },
  {
    razon_social: "Laboratorios Richmond S.A.C.I.F.",
    direccion: "Av. Libertador 4980, Piso 20, C1428ARF CABA",
    telefono: "011-4787-5900",
    email: "contacto@richmond.com.ar",
  },
  {
    razon_social: "Laboratorios Roemmers S.A.I.C.F.",
    direccion: "Av. Libertador 4980, C1428ARF CABA, Buenos Aires",
    telefono: "011-4327-8400",
    email: "info@roemmers.com.ar",
  },
  {
    razon_social: "Laboratorios Sandoz Argentina S.A.",
    direccion: "Av. del Libertador 4980, C1428ARF CABA",
    telefono: "011-4780-7000",
    email: "contacto@sandoz.com.ar",
  },
  {
    razon_social: "Laboratorios Beta S.A.",
    direccion: "Av. Gral. Paz 6901, B1686AEB El Palomar, Buenos Aires",
    telefono: "011-4752-9000",
    email: "info@beta.com.ar",
  },
  {
    razon_social: "Laboratorios Bussié S.A.",
    direccion: "Av. del Libertador 4980, Piso 18, C1428ARF CABA",
    telefono: "011-4787-1500",
    email: "contacto@bussie.com.ar",
  },
  {
    razon_social: "Laboratorios Disprofarma S.A.",
    direccion: "Av. Libertador 5800, B1606AOH Vicente López, Buenos Aires",
    telefono: "011-4705-3000",
    email: "info@disprofarma.com.ar",
  },
  {
    razon_social: "Laboratorios Gador S.A.",
    direccion: "Av. del Libertador 5690, B1636CGG Olivos, Buenos Aires",
    telefono: "011-4715-2000",
    email: "contacto@gador.com.ar",
  },
  {
    razon_social: "Laboratorios Casasco S.A.",
    direccion: "Av. Gral. Paz 6801, B1686BGB El Palomar, Buenos Aires",
    telefono: "011-4756-7500",
    email: "info@casasco.com.ar",
  },
  {
    razon_social: "Laboratorios Denver Farma S.A.",
    direccion: "Av. Libertador 4980, C1428ARF CABA, Buenos Aires",
    telefono: "011-4325-8600",
    email: "contacto@denverfarma.com.ar",
  },
  {
    razon_social: "Laboratorios Química Montpellier S.A.",
    direccion: "Av. del Libertador 4980, Piso 12, C1428ARF CABA",
    telefono: "011-4780-8500",
    email: "info@montpellier.com.ar",
  },
  {
    razon_social: "Laboratorios Sidus S.A.",
    direccion: "Av. Libertador 5800, B1606AOH Vicente López, Buenos Aires",
    telefono: "011-4703-9000",
    email: "contacto@sidus.com.ar",
  },
  {
    razon_social: "Laboratorios Vannier S.A.",
    direccion: "Av. Gral. Paz 6901, B1686AEB El Palomar, Buenos Aires",
    telefono: "011-4752-7500",
    email: "info@vannier.com.ar",
  },
  {
    razon_social: "Laboratorios Exeltis Argentina S.A.",
    direccion: "Av. del Libertador 5690, B1636CGG Olivos, Buenos Aires",
    telefono: "011-4718-6500",
    email: "contacto@exeltis.com.ar",
  },
  {
    razon_social: "Laboratorios ELEA S.A.C.I.F. y A.",
    direccion: "Av. Libertador 4980, Piso 8, C1428ARF CABA",
    telefono: "011-4327-9200",
    email: "info@elea2.com.ar",
  },
  {
    razon_social: "Laboratorios MEDA Pharma S.A.",
    direccion: "Av. Gral. Paz 6801, B1686BGB El Palomar, Buenos Aires",
    telefono: "011-4756-5000",
    email: "contacto@medapharma.com.ar",
  },
  {
    razon_social: "Laboratorios Glaxo Argentina S.A.",
    direccion: "Av. del Libertador 4980, C1428ARF CABA, Buenos Aires",
    telefono: "011-4780-9200",
    email: "info@glaxo.com.ar",
  },
];

let creados = 0;
let index = 0;

function crearProveedor() {
  if (index >= proveedores.length) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`✅ PROCESO COMPLETADO`);
    console.log(`${"=".repeat(60)}`);
    console.log(`   - Proveedores creados: ${creados}`);
    console.log(`   - Proveedores ya existentes: ${proveedores.length - creados}`);
    console.log(`\n🎉 Total de proveedores en la base de datos: ${creados} nuevos\n`);
    process.exit(0);
  }

  const proveedor = proveedores[index];

  // Verificar si el proveedor ya existe
  db.query(
    `SELECT proveedor_id FROM proveedores WHERE razon_social = $1`,
    [proveedor.razon_social],
    (err, checkResult) => {
      if (err) {
        console.error(`❌ Error al verificar proveedor ${proveedor.razon_social}:`, err.message);
        index++;
        crearProveedor();
        return;
      }

      const exists = (checkResult.rows || checkResult || []).length > 0;

      if (exists) {
        console.log(`⚠️  Proveedor ya existe: ${proveedor.razon_social}`);
        index++;
        crearProveedor();
        return;
      }

      // Insertar proveedor usando formato PostgreSQL
      db.query(
        `INSERT INTO proveedores (razon_social, direccion, telefono, email) 
         VALUES ($1, $2, $3, $4) 
         RETURNING proveedor_id`,
        [proveedor.razon_social, proveedor.direccion, proveedor.telefono, proveedor.email],
        (err, result) => {
          if (err) {
            console.error(`❌ Error al crear proveedor ${proveedor.razon_social}:`, err.message);
          } else {
            const proveedorId = result.rows?.[0]?.proveedor_id || result.insertId;
            console.log(`✅ [${index + 1}/${proveedores.length}] ${proveedor.razon_social}`);
            creados++;
          }
          index++;
          crearProveedor();
        }
      );
    }
  );
}

// Iniciar el proceso
crearProveedor();

