/**
 * Script para crear más productos de prueba
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

async function crearMasProductos() {
  console.log("📦 Creando más productos de prueba...\n");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Obtener categorías
    const categoriasResult = await client.query(
      "SELECT categoria_id, nombre FROM categorias ORDER BY categoria_id"
    );
    
    const categorias = categoriasResult.rows;
    if (categorias.length === 0) {
      console.log("❌ No hay categorías. Ejecuta primero crear-datos-iniciales.js");
      await pool.end();
      return;
    }

    // Productos adicionales
    const productos = [
      // Medicamentos
      { nombre: "Diclofenaco 50mg", codigo: "DIC001", marca: "Bayer", categoria: "Medicamentos", stock: 75, precio: 2100.00 },
      { nombre: "Loratadina 10mg", codigo: "LOR001", marca: "Pfizer", categoria: "Medicamentos", stock: 90, precio: 1800.00 },
      { nombre: "Acetaminofén 500mg", codigo: "ACE001", marca: "GlaxoSmithKline", categoria: "Medicamentos", stock: 110, precio: 1600.00 },
      { nombre: "Ranitidina 150mg", codigo: "RAN001", marca: "Bayer", categoria: "Medicamentos", stock: 65, precio: 1900.00 },
      { nombre: "Metformina 500mg", codigo: "MET001", marca: "Pfizer", categoria: "Medicamentos", stock: 55, precio: 2800.00 },
      
      // Suplementos
      { nombre: "Vitamina D 1000 UI", codigo: "VIT001", marca: "Bayer", categoria: "Suplementos", stock: 120, precio: 3200.00 },
      { nombre: "Vitamina C 1000mg", codigo: "VIT002", marca: "Pfizer", categoria: "Suplementos", stock: 100, precio: 2500.00 },
      { nombre: "Calcio + Vitamina D", codigo: "CAL001", marca: "GlaxoSmithKline", categoria: "Suplementos", stock: 80, precio: 3500.00 },
      { nombre: "Omega 3 1000mg", codigo: "OME002", marca: "Bayer", categoria: "Suplementos", stock: 70, precio: 4200.00 },
      
      // Cuidado Personal
      { nombre: "Jabón Neutro 200g", codigo: "JAB001", marca: "Bayer", categoria: "Cuidado Personal", stock: 150, precio: 800.00 },
      { nombre: "Shampoo Anticaspa 400ml", codigo: "SHA001", marca: "Pfizer", categoria: "Cuidado Personal", stock: 95, precio: 1800.00 },
      { nombre: "Crema Hidratante 250g", codigo: "CRE001", marca: "GlaxoSmithKline", categoria: "Cuidado Personal", stock: 85, precio: 2200.00 },
      
      // Primeros Auxilios
      { nombre: "Gasas Estériles 10x10", codigo: "GAS001", marca: "Bayer", categoria: "Primeros Auxilios", stock: 200, precio: 1200.00 },
      { nombre: "Vendas Elásticas 10cm", codigo: "VEN001", marca: "Pfizer", categoria: "Primeros Auxilios", stock: 180, precio: 1500.00 },
      { nombre: "Alcohol Etílico 100ml", codigo: "ALC001", marca: "GlaxoSmithKline", categoria: "Primeros Auxilios", stock: 160, precio: 900.00 },
      { nombre: "Agua Oxigenada 100ml", codigo: "OXI001", marca: "Bayer", categoria: "Primeros Auxilios", stock: 140, precio: 850.00 },
      
      // Bebés
      { nombre: "Leche Infantil Etapa 1 800g", codigo: "LEC001", marca: "Bayer", categoria: "Bebés", stock: 60, precio: 4500.00 },
      { nombre: "Pañales Talla M 50u", codigo: "PAN001", marca: "Pfizer", categoria: "Bebés", stock: 80, precio: 5200.00 },
      { nombre: "Toallas Húmedas 80u", codigo: "TOA001", marca: "GlaxoSmithKline", categoria: "Bebés", stock: 75, precio: 2800.00 },
    ];

    let creados = 0;
    let existentes = 0;

    for (const producto of productos) {
      // Buscar categoría
      const categoria = categorias.find(c => c.nombre === producto.categoria);
      if (!categoria) {
        console.log(`⚠️  Categoría no encontrada: ${producto.categoria} - Producto omitido: ${producto.nombre}`);
        continue;
      }

      // Verificar si ya existe
      const existe = await client.query(
        "SELECT producto_id FROM productos WHERE codigo = $1",
        [producto.codigo]
      );

      if (existe.rows.length > 0) {
        existentes++;
        continue;
      }

      // Insertar producto
      await client.query(
        `INSERT INTO productos (nombre, codigo, marca, categoria_id, stock, precio) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          producto.nombre,
          producto.codigo,
          producto.marca,
          categoria.categoria_id,
          producto.stock,
          producto.precio,
        ]
      );

      console.log(`✅ ${producto.nombre} - ${producto.codigo} (${producto.categoria})`);
      creados++;
    }

    await client.query("COMMIT");

    console.log(`\n✅ Proceso completado:`);
    console.log(`   - Productos creados: ${creados}`);
    console.log(`   - Productos ya existentes: ${existentes}`);
    console.log(`   - Total productos ahora: ${5 + creados}`);

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("\n❌ Error al crear productos:", error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

crearMasProductos();



