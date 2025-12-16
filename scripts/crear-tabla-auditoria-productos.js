require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function crearTablaAuditoria() {
  const client = await pool.connect();
  try {
    console.log('=== Creando Tabla auditoria_productos ===\n');
    
    // Crear tabla
    await client.query(`
      CREATE TABLE IF NOT EXISTS auditoria_productos (
        auditoria_id SERIAL PRIMARY KEY,
        producto_id INTEGER REFERENCES productos(producto_id) ON DELETE SET NULL,
        accion VARCHAR(50) NOT NULL,
        detalle_cambio TEXT,
        fecha_movimiento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        usuario_id INTEGER REFERENCES usuarios(usuario_id) ON DELETE SET NULL
      );
    `);
    
    console.log('✅ Tabla auditoria_productos creada');
    
    // Crear índices
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_auditoria_productos_producto_id 
      ON auditoria_productos(producto_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_auditoria_productos_usuario_id 
      ON auditoria_productos(usuario_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_auditoria_productos_fecha 
      ON auditoria_productos(fecha_movimiento DESC);
    `);
    
    console.log('✅ Índices creados');
    
    // Verificar
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'auditoria_productos';
    `);
    
    if (result.rows.length > 0) {
      console.log('\n✅ Verificación: Tabla auditoria_productos existe');
    } else {
      console.log('\n❌ Error: La tabla no se creó correctamente');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('   Código:', error.code);
    console.error('   Detalle:', error.detail);
  } finally {
    client.release();
    await pool.end();
  }
}

crearTablaAuditoria();

