/**
 * Script para probar la query de productos directamente
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

async function testQuery() {
  const page = 1;
  const pageSize = 10;
  const offset = (page - 1) * pageSize;
  const searchQuery = "%";

  const query = `
    SELECT p.producto_id, p.nombre as Nombre, p.codigo as Codigo, p.marca as Marca, p.stock as Stock, p.precio as Precio, c.categoria_id, c.nombre as Categoria 
    FROM productos as p
    LEFT JOIN categorias as c on c.categoria_id = p.categoria_id
    WHERE p.deleted_at IS NULL and (p.nombre LIKE $1 OR p.codigo LIKE $2 OR p.marca LIKE $3)
    LIMIT $4 OFFSET $5
  `;

  try {
    const result = await pool.query(query, [searchQuery, searchQuery, searchQuery, pageSize, offset]);
    console.log(`Total productos encontrados: ${result.rows.length}`);
    console.log("\nProductos:");
    result.rows.forEach((p, i) => {
      console.log(`${i + 1}. ${p.Nombre || p.nombre} - ${p.Codigo || p.codigo}`);
    });
    
    if (result.rows.length === 0) {
      console.log("\n⚠️  No hay productos en la base de datos");
      console.log("   Ejecuta el script crear-datos-iniciales.js para crear productos de prueba");
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

testQuery();

