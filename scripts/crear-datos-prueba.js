const db = require("../db.js");
const bcrypt = require("bcrypt");

console.log("🔧 Creando datos de prueba...\n");

// Función para crear proveedores
function crearProveedores() {
  const proveedores = [
    { razon_social: "Laboratorios Bayer S.A.", direccion: "Av. Libertador 1234", telefono: "011-4567-8901", email: "contacto@bayer.com.ar" },
    { razon_social: "Pfizer Argentina", direccion: "Av. Santa Fe 2020", telefono: "011-4321-0987", email: "info@pfizer.com.ar" },
    { razon_social: "GlaxoSmithKline Argentina", direccion: "Av. Corrientes 3000", telefono: "011-4000-1111", email: "contacto@gsk.com.ar" },
    { razon_social: "Roche Argentina S.A.", direccion: "Av. 9 de Julio 5000", telefono: "011-5555-2222", email: "info@roche.com.ar" },
    { razon_social: "Merck Argentina", direccion: "Av. Córdoba 1500", telefono: "011-4444-3333", email: "contacto@merck.com.ar" }
  ];

  let creados = 0;
  let index = 0;

  function crearProveedor() {
    if (index >= proveedores.length) {
      console.log(`\n✅ ${creados} proveedores creados\n`);
      crearObrasSociales();
      return;
    }

    const proveedor = proveedores[index];
    db.query(
      `INSERT INTO proveedores (razon_social, direccion, telefono, email) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT DO NOTHING`,
      [proveedor.razon_social, proveedor.direccion, proveedor.telefono, proveedor.email],
      (err, result) => {
        if (err) {
          console.error(`❌ Error al crear proveedor ${proveedor.razon_social}:`, err.message);
        } else {
          if (result.rowCount > 0) {
            console.log(`✅ Proveedor creado: ${proveedor.razon_social}`);
            creados++;
          } else {
            console.log(`⚠️  Proveedor ya existe: ${proveedor.razon_social}`);
          }
        }
        index++;
        crearProveedor();
      }
    );
  }

  crearProveedor();
}

// Función para crear obras sociales
function crearObrasSociales() {
  const obrasSociales = [
    { obra_social: "OSDE", plan: "210", descuento: 30, codigo: "OSDE210" },
    { obra_social: "OSDE", plan: "310", descuento: 40, codigo: "OSDE310" },
    { obra_social: "Swiss Medical", plan: "Premium", descuento: 35, codigo: "SWISS-PRE" },
    { obra_social: "Swiss Medical", plan: "Clásico", descuento: 25, codigo: "SWISS-CLA" },
    { obra_social: "Galeno", plan: "300", descuento: 30, codigo: "GAL300" },
    { obra_social: "Medifé", plan: "Base", descuento: 20, codigo: "MED-BASE" },
    { obra_social: "IOMA", plan: "Único", descuento: 40, codigo: "IOMA-UNI" },
    { obra_social: "PAMI", plan: "Único", descuento: 50, codigo: "PAMI-UNI" }
  ];

  let creados = 0;
  let index = 0;

  function crearObraSocial() {
    if (index >= obrasSociales.length) {
      console.log(`\n✅ ${creados} obras sociales creadas\n`);
      console.log("=".repeat(60));
      console.log("✅ DATOS DE PRUEBA CREADOS EXITOSAMENTE");
      console.log("=".repeat(60));
      process.exit(0);
    }

    const obraSocial = obrasSociales[index];
    db.query(
      `INSERT INTO obras_sociales (obra_social, plan, descuento, codigo) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT DO NOTHING`,
      [obraSocial.obra_social, obraSocial.plan, obraSocial.descuento, obraSocial.codigo],
      (err, result) => {
        if (err) {
          console.error(`❌ Error al crear obra social ${obraSocial.obra_social}:`, err.message);
        } else {
          if (result.rowCount > 0) {
            console.log(`✅ Obra social creada: ${obraSocial.obra_social} - ${obraSocial.plan}`);
            creados++;
          } else {
            console.log(`⚠️  Obra social ya existe: ${obraSocial.obra_social} - ${obraSocial.plan}`);
          }
        }
        index++;
        crearObraSocial();
      }
    );
  }

  crearObraSocial();
}

// Iniciar el proceso
console.log("📦 Creando proveedores...\n");
crearProveedores();



