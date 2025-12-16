require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function testCrearProducto() {
  const client = await pool.connect();
  try {
    console.log('=== Test: Crear Producto ===\n');
    
    // Datos de prueba similares a los que envía el frontend
    const nuevoProducto = {
      nombre: 'Producto Test',
      codigo: 'TEST-' + Date.now(), // Código único
      marca: 'Marca Test',
      categoria_id: null,
      stock: 0,
      precio: 100.50,
      proveedor_id: null,
      es_medicamento: false,
      porcentaje_iva: 21
    };
    
    console.log('Datos del producto:', nuevoProducto);
    console.log('');
    
    // Calcular precio_compra_base
    let precioFinal = Math.round(parseFloat(nuevoProducto.precio) * 100) / 100;
    let precioCompraBase = null;
    
    if (precioFinal) {
      const esMedicamento = nuevoProducto.es_medicamento || false;
      const porcentajeIVA = nuevoProducto.porcentaje_iva || 21;
      const porcentajeGanancia = esMedicamento ? 25 : 30;
      const precioConGananciaEIVA = (1 + porcentajeGanancia / 100) * (1 + porcentajeIVA / 100);
      precioCompraBase = Math.round((precioFinal / precioConGananciaEIVA) * 100) / 100;
    }
    
    const porcentajeIVA = Math.round(parseFloat(nuevoProducto.porcentaje_iva) * 100) / 100;
    const stock = nuevoProducto.stock !== undefined && nuevoProducto.stock !== null ? parseInt(nuevoProducto.stock) : 0;
    
    console.log('Valores calculados:');
    console.log('  precioFinal:', precioFinal);
    console.log('  precioCompraBase:', precioCompraBase);
    console.log('  porcentajeIVA:', porcentajeIVA);
    console.log('  stock:', stock);
    console.log('');
    
    // Intentar insertar
    console.log('Intentando insertar producto...');
    const result = await client.query(
      `INSERT INTO productos (nombre, codigo, marca, categoria_id, stock, precio, proveedor_id, 
       precio_compra_base, es_medicamento, porcentaje_iva) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING producto_id`,
      [
        nuevoProducto.nombre,
        nuevoProducto.codigo || null,
        nuevoProducto.marca || null,
        nuevoProducto.categoria_id || null,
        stock,
        precioFinal,
        nuevoProducto.proveedor_id || null,
        precioCompraBase,
        nuevoProducto.es_medicamento || false,
        porcentajeIVA,
      ]
    );
    
    console.log('✅ Producto insertado exitosamente!');
    console.log('   producto_id:', result.rows[0].producto_id);
    
    // Intentar insertar en auditoría
    console.log('\nIntentando insertar en auditoría...');
    try {
      await client.query(
        `INSERT INTO auditoria_productos (producto_id, accion, detalle_cambio, fecha_movimiento, usuario_id) 
         VALUES ($1, 'CREAR', $2, NOW(), $3)`,
        [result.rows[0].producto_id, `Se ha creado un nuevo producto ${nuevoProducto.nombre} → Código ${nuevoProducto.codigo}`, 1]
      );
      console.log('✅ Auditoría registrada exitosamente!');
    } catch (auditErr) {
      console.error('❌ Error en auditoría (no crítico):', auditErr.message);
      console.error('   Código:', auditErr.code);
      console.error('   Detalle:', auditErr.detail);
    }
    
    // Limpiar - eliminar el producto de prueba
    console.log('\nLimpiando producto de prueba...');
    await client.query('DELETE FROM productos WHERE producto_id = $1', [result.rows[0].producto_id]);
    console.log('✅ Producto de prueba eliminado');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('   Código:', error.code);
    console.error('   Detalle:', error.detail);
    console.error('   Hint:', error.hint);
    console.error('   Posición:', error.position);
    if (error.where) {
      console.error('   Where:', error.where);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

testCrearProducto();

