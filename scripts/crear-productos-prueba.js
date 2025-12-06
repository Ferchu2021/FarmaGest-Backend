/**
 * Script para crear productos de prueba
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

async function crearProductosPrueba() {
  console.log("📦 Creando productos de prueba...\n");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Obtener categorías
    const categoriasResult = await client.query(
      "SELECT categoria_id, nombre FROM categorias ORDER BY categoria_id LIMIT 1"
    );
    
    if (categoriasResult.rows.length === 0) {
      console.log("❌ No hay categorías. Ejecuta primero crear-datos-iniciales.js");
      await pool.end();
      return;
    }

    const categoriaId = categoriasResult.rows[0].categoria_id;
    console.log(`✅ Usando categoría ID: ${categoriaId}\n`);

    // Productos de prueba
    const productos = [
      {
        nombre: "Paracetamol 500mg",
        codigo: "PAR001",
        marca: "Bayer",
        categoria_id: categoriaId,
        stock: 100,
        precio: 1500.00,
      },
      {
        nombre: "Ibuprofeno 400mg",
        codigo: "IBU001",
        marca: "Pfizer",
        categoria_id: categoriaId,
        stock: 80,
        precio: 1800.00,
      },
      {
        nombre: "Aspirina 100mg",
        codigo: "ASP001",
        marca: "Bayer",
        categoria_id: categoriaId,
        stock: 120,
        precio: 1200.00,
      },
      {
        nombre: "Omeprazol 20mg",
        codigo: "OME001",
        marca: "Pfizer",
        categoria_id: categoriaId,
        stock: 60,
        precio: 2500.00,
      },
      {
        nombre: "Amoxicilina 500mg",
        codigo: "AMO001",
        marca: "GlaxoSmithKline",
        categoria_id: categoriaId,
        stock: 50,
        precio: 3200.00,
      },
    ];

    let creados = 0;

    for (const producto of productos) {
      // Verificar si ya existe
      const existe = await client.query(
        "SELECT producto_id FROM productos WHERE codigo = $1",
        [producto.codigo]
      );

      if (existe.rows.length > 0) {
        console.log(`⚠️  Producto ya existe: ${producto.codigo} - ${producto.nombre}`);
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
          producto.categoria_id,
          producto.stock,
          producto.precio,
        ]
      );

      console.log(`✅ ${producto.nombre} - ${producto.codigo}`);
      creados++;
    }

    await client.query("COMMIT");

    console.log(`\n✅ Proceso completado:`);
    console.log(`   - Productos creados: ${creados}`);
    console.log(`   - Productos ya existentes: ${productos.length - creados}`);
    
    if (creados > 0) {
      console.log(`\n📦 Productos disponibles en la base de datos`);
    }

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("\n❌ Error al crear productos:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

crearProductosPrueba();

