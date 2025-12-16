require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function testCrearCliente() {
  const client = await pool.connect();
  try {
    console.log('=== Test: Crear Cliente ===\n');
    
    const nuevoCliente = {
      nombre: 'Test',
      apellido: 'Cliente',
      dni: 'TEST-' + Date.now(),
      obra_social_id: null,
      ciudad_id: null
    };
    
    console.log('Datos del cliente:', nuevoCliente);
    console.log('');
    
    // Intentar insertar
    console.log('Intentando insertar cliente...');
    const result = await client.query(
      `INSERT INTO clientes (nombre, apellido, dni, obra_social_id, ciudad_id) 
       VALUES ($1, $2, $3, $4, $5)
       RETURNING cliente_id`,
      [
        nuevoCliente.nombre,
        nuevoCliente.apellido,
        nuevoCliente.dni,
        nuevoCliente.obra_social_id || null,
        nuevoCliente.ciudad_id || null,
      ]
    );
    
    console.log('✅ Cliente insertado exitosamente!');
    console.log('   cliente_id:', result.rows[0].cliente_id);
    
    const clienteId = result.rows[0].cliente_id;
    
    // Intentar insertar en auditoría
    console.log('\nIntentando insertar en auditoría...');
    try {
      await client.query(
        `INSERT INTO auditoria_clientes (cliente_id, accion, detalle_cambio, fecha_movimiento, usuario_id) 
         VALUES ($1, 'CREAR', $2, CURRENT_TIMESTAMP, $3)`,
        [clienteId, `Se ha creado un nuevo cliente ${nuevoCliente.nombre} ${nuevoCliente.apellido}`, 1]
      );
      console.log('✅ Auditoría registrada exitosamente!');
    } catch (auditErr) {
      console.error('❌ Error en auditoría:', auditErr.message);
      console.error('   Código:', auditErr.code);
      console.error('   Detalle:', auditErr.detail);
    }
    
    // Limpiar - eliminar el cliente de prueba
    console.log('\nLimpiando cliente de prueba...');
    await client.query('DELETE FROM clientes WHERE cliente_id = $1', [clienteId]);
    console.log('✅ Cliente de prueba eliminado');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('   Código:', error.code);
    console.error('   Detalle:', error.detail);
    console.error('   Hint:', error.hint);
  } finally {
    client.release();
    await pool.end();
  }
}

testCrearCliente();

