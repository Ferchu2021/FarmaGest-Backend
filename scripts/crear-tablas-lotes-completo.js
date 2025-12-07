/**
 * Script para crear las tablas de lotes y vencimientos (versión mejorada)
 */
require("dotenv").config();
const db = require("../db");

console.log("📦 Creando tablas de lotes y vencimientos...\n");

async function crearTablasLotes() {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");
    
    // Crear tabla lotes
    console.log("1. Creando tabla lotes...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS lotes (
        lote_id SERIAL PRIMARY KEY,
        producto_id INTEGER NOT NULL REFERENCES productos(producto_id) ON DELETE CASCADE,
        numero_lote VARCHAR(100) NOT NULL,
        fecha_vencimiento DATE NOT NULL,
        fecha_fabricacion DATE,
        cantidad_inicial INTEGER NOT NULL CHECK (cantidad_inicial > 0),
        cantidad_actual INTEGER NOT NULL CHECK (cantidad_actual >= 0),
        precio_compra DECIMAL(10, 2) CHECK (precio_compra >= 0),
        precio_venta DECIMAL(10, 2) CHECK (precio_venta >= 0),
        proveedor_id INTEGER REFERENCES proveedores(proveedor_id) ON DELETE SET NULL,
        fecha_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ubicacion VARCHAR(255),
        observaciones TEXT,
        estado VARCHAR(50) DEFAULT 'ACTIVO',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        CONSTRAINT chk_cantidad_actual CHECK (cantidad_actual <= cantidad_inicial)
      )
    `);
    console.log("   ✅ Tabla lotes creada");
    
    // Crear índices para lotes
    console.log("2. Creando índices para lotes...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_lotes_producto_id ON lotes(producto_id);
      CREATE INDEX IF NOT EXISTS idx_lotes_numero_lote ON lotes(numero_lote);
      CREATE INDEX IF NOT EXISTS idx_lotes_fecha_vencimiento ON lotes(fecha_vencimiento);
      CREATE INDEX IF NOT EXISTS idx_lotes_estado ON lotes(estado);
      CREATE INDEX IF NOT EXISTS idx_lotes_deleted_at ON lotes(deleted_at);
    `);
    console.log("   ✅ Índices creados");
    
    // Crear tabla movimientos_lotes
    console.log("3. Creando tabla movimientos_lotes...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS movimientos_lotes (
        movimiento_id SERIAL PRIMARY KEY,
        lote_id INTEGER NOT NULL REFERENCES lotes(lote_id) ON DELETE CASCADE,
        tipo_movimiento VARCHAR(50) NOT NULL,
        cantidad INTEGER NOT NULL,
        cantidad_anterior INTEGER NOT NULL,
        cantidad_nueva INTEGER NOT NULL,
        motivo TEXT,
        referencia_id INTEGER,
        referencia_tipo VARCHAR(50),
        usuario_id INTEGER REFERENCES usuarios(usuario_id) ON DELETE SET NULL,
        fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        observaciones TEXT
      )
    `);
    console.log("   ✅ Tabla movimientos_lotes creada");
    
    // Crear índices para movimientos_lotes
    console.log("4. Creando índices para movimientos_lotes...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_movimientos_lotes_lote_id ON movimientos_lotes(lote_id);
      CREATE INDEX IF NOT EXISTS idx_movimientos_lotes_tipo ON movimientos_lotes(tipo_movimiento);
      CREATE INDEX IF NOT EXISTS idx_movimientos_lotes_fecha ON movimientos_lotes(fecha_movimiento DESC);
    `);
    console.log("   ✅ Índices creados");
    
    // Agregar columna lote_id a items_venta si no existe
    console.log("5. Verificando columna lote_id en items_venta...");
    const columnExists = await client.query(`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'items_venta' AND column_name = 'lote_id'
    `);
    
    if (columnExists.rows.length === 0) {
      await client.query(`
        ALTER TABLE items_venta 
        ADD COLUMN lote_id INTEGER REFERENCES lotes(lote_id) ON DELETE SET NULL
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_items_venta_lote_id ON items_venta(lote_id)
      `);
      console.log("   ✅ Columna lote_id agregada a items_venta");
    } else {
      console.log("   ✅ Columna lote_id ya existe");
    }
    
    // Crear vistas
    console.log("6. Creando vistas...");
    
    // Eliminar vistas existentes si hay problemas
    await client.query(`DROP VIEW IF EXISTS v_lotes_completos CASCADE`);
    await client.query(`DROP VIEW IF EXISTS v_productos_vencer CASCADE`);
    await client.query(`DROP VIEW IF EXISTS v_resumen_perdidas_vencimientos CASCADE`);
    
    // Vista: Lotes completos
    await client.query(`
      CREATE OR REPLACE VIEW v_lotes_completos AS
      SELECT 
        l.lote_id,
        l.numero_lote,
        l.fecha_vencimiento,
        l.fecha_fabricacion,
        l.cantidad_inicial,
        l.cantidad_actual,
        l.precio_compra,
        l.precio_venta,
        l.estado,
        l.fecha_entrada,
        l.ubicacion,
        p.producto_id,
        p.nombre AS producto_nombre,
        p.codigo AS producto_codigo,
        p.marca AS producto_marca,
        pr.proveedor_id,
        pr.razon_social AS proveedor_nombre,
        (l.fecha_vencimiento - CURRENT_DATE) AS dias_hasta_vencimiento,
        CASE 
          WHEN l.fecha_vencimiento < CURRENT_DATE THEN l.cantidad_actual * COALESCE(l.precio_compra, 0)
          ELSE 0
        END AS perdida_vencido
      FROM lotes l
      JOIN productos p ON l.producto_id = p.producto_id
      LEFT JOIN proveedores pr ON l.proveedor_id = pr.proveedor_id
      WHERE l.deleted_at IS NULL
    `);
    console.log("   ✅ Vista v_lotes_completos creada");
    
    // Vista: Productos por vencer
    await client.query(`
      CREATE OR REPLACE VIEW v_productos_vencer AS
      SELECT 
        l.lote_id,
        l.numero_lote,
        l.producto_id,
        p.nombre AS producto_nombre,
        p.codigo AS producto_codigo,
        l.fecha_vencimiento,
        (l.fecha_vencimiento - CURRENT_DATE) AS dias_restantes,
        l.cantidad_actual,
        l.precio_compra,
        l.cantidad_actual * COALESCE(l.precio_compra, 0) AS valor_inventario,
        CASE 
          WHEN l.fecha_vencimiento < CURRENT_DATE THEN 'VENCIDO'
          WHEN l.fecha_vencimiento <= CURRENT_DATE + INTERVAL '7 days' THEN 'CRÍTICO'
          WHEN l.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days' THEN 'PRÓXIMO'
          ELSE 'NORMAL'
        END AS nivel_alerta
      FROM lotes l
      JOIN productos p ON l.producto_id = p.producto_id
      WHERE l.deleted_at IS NULL
        AND l.cantidad_actual > 0
        AND l.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days'
      ORDER BY l.fecha_vencimiento ASC
    `);
    console.log("   ✅ Vista v_productos_vencer creada");
    
    await client.query("COMMIT");
    
    console.log("\n" + "=".repeat(60));
    console.log("✅ Todas las tablas y vistas creadas exitosamente");
    console.log("=".repeat(60));
    
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

crearTablasLotes();

