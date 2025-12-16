require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function testPassword() {
  const client = await pool.connect();
  try {
    console.log('=== Probando Contraseña del Admin ===\n');
    
    // Obtener usuario admin
    const result = await client.query(
      "SELECT usuario_id, correo, contrasena FROM usuarios WHERE correo = $1",
      ['admin@farmagest.com']
    );
    
    if (result.rows.length === 0) {
      console.log('ERROR: Usuario admin no encontrado');
      process.exit(1);
    }
    
    const usuario = result.rows[0];
    console.log('Usuario encontrado:', usuario.correo);
    console.log('Hash de contraseña (primeros 30 caracteres):', usuario.contrasena.substring(0, 30) + '...\n');
    
    // Probar diferentes contraseñas
    const passwordsToTest = ['admin123', 'Admin123', 'ADMIN123', 'admin', 'Admin2024!'];
    
    console.log('Probando contraseñas:');
    for (const password of passwordsToTest) {
      const match = await bcrypt.compare(password, usuario.contrasena);
      console.log(`  "${password}": ${match ? '✅ CORRECTA' : '❌ incorrecta'}`);
    }
    
    console.log('\n=== Reseteando a admin123 ===\n');
    
    // Resetear a admin123
    const nuevaPassword = 'admin123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(nuevaPassword, saltRounds);
    
    await client.query(
      "UPDATE usuarios SET contrasena = $1 WHERE correo = $2",
      [hashedPassword, 'admin@farmagest.com']
    );
    
    console.log('✅ Contraseña actualizada a: admin123');
    
    // Verificar que funciona
    const verifyMatch = await bcrypt.compare('admin123', hashedPassword);
    console.log(`Verificación: admin123 ${verifyMatch ? '✅ coincide' : '❌ no coincide'}\n`);
    
    console.log('=== Credenciales ===');
    console.log('Email: admin@farmagest.com');
    console.log('Contraseña: admin123');
    
  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

testPassword();

