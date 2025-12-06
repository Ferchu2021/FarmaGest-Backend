/**
 * Script para crear 10 productos adicionales
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

async function crear10ProductosMas() {
  console.log("📦 Creando 10 productos adicionales...\n");

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

    // 10 productos adicionales
    const productos = [
      // Medicamentos
      { nombre: "Clorfenamina 4mg", codigo: "CLO001", marca: "Bayer", categoria: "Medicamentos", stock: 85, precio: 1400.00 },
      { nombre: "Dexametasona 0.5mg", codigo: "DEX001", marca: "Pfizer", categoria: "Medicamentos", stock: 70, precio: 2200.00 },
      
      // Suplementos
      { nombre: "Hierro + Ácido Fólico", codigo: "HIE001", marca: "Bayer", categoria: "Suplementos", stock: 65, precio: 2900.00 },
      { nombre: "Magnesio 400mg", codigo: "MAG001", marca: "Pfizer", categoria: "Suplementos", stock: 75, precio: 3100.00 },
      { nombre: "Zinc 25mg", codigo: "ZIN001", marca: "GlaxoSmithKline", categoria: "Suplementos", stock: 60, precio: 2700.00 },
      
      // Cuidado Personal
      { nombre: "Desodorante Roll-on 50ml", codigo: "DES001", marca: "Bayer", categoria: "Cuidado Personal", stock: 130, precio: 1200.00 },
      { nombre: "Pasta Dental 100g", codigo: "PAS001", marca: "Pfizer", categoria: "Cuidado Personal", stock: 145, precio: 950.00 },
      
      // Primeros Auxilios
      { nombre: "Termómetro Digital", codigo: "TER001", marca: "Bayer", categoria: "Primeros Auxilios", stock: 40, precio: 3500.00 },
      { nombre: "Tijeras Medicinales", codigo: "TIJ001", marca: "Pfizer", categoria: "Primeros Auxilios", stock: 50, precio: 2800.00 },
      
      // Otros
      { nombre: "Protector Solar FPS 50", codigo: "PRO001", marca: "GlaxoSmithKline", categoria: "Otros", stock: 90, precio: 3800.00 },
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
        console.log(`⚠️  Producto ya existe: ${producto.codigo} - ${producto.nombre}`);
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
    
    // Obtener total actual
    const totalResult = await client.query(
      "SELECT COUNT(*) as total FROM productos WHERE deleted_at IS NULL"
    );
    const total = totalResult.rows[0].total;
    console.log(`   - Total productos ahora: ${total}`);

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("\n❌ Error al crear productos:", error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

crear10ProductosMas();

