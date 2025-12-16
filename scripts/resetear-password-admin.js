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

async function resetearPasswordAdmin() {
  const client = await pool.connect();
  try {
    console.log('=== Reseteando Contraseña del Usuario Admin ===\n');
    
    // Nueva contraseña
    const nuevaPassword = 'admin123';
    
    // Hashear la contraseña
    console.log('Hasheando contraseña...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(nuevaPassword, saltRounds);
    console.log('Contraseña hasheada correctamente\n');
    
    // Verificar si existe el usuario
    console.log('Verificando usuario admin...');
    const userCheck = await client.query(
      "SELECT usuario_id, correo FROM usuarios WHERE correo = $1",
      ['admin@farmagest.com']
    );
    
    if (userCheck.rows.length === 0) {
      console.log('Usuario admin no encontrado. Creando usuario...');
      
      // Obtener rol_id de Administrador
      const rolResult = await client.query(
        "SELECT rol_id FROM roles WHERE rol = 'Administrador' LIMIT 1"
      );
      
      if (rolResult.rows.length === 0) {
        console.error('ERROR: No se encontró el rol Administrador');
        process.exit(1);
      }
      
      const rolId = rolResult.rows[0].rol_id;
      
      // Crear usuario admin
      await client.query(
        `INSERT INTO usuarios (nombre, apellido, correo, rol_id, contrasena, estado) 
         VALUES ($1, $2, $3, $4, $5, true)`,
        ['Admin', 'Sistema', 'admin@farmagest.com', rolId, hashedPassword]
      );
      
      console.log('✅ Usuario admin creado exitosamente');
    } else {
      console.log('Usuario admin encontrado. Actualizando contraseña...');
      
      // Actualizar contraseña
      await client.query(
        "UPDATE usuarios SET contrasena = $1 WHERE correo = $2",
        [hashedPassword, 'admin@farmagest.com']
      );
      
      console.log('✅ Contraseña actualizada exitosamente');
    }
    
    console.log('\n=== Credenciales ===');
    console.log('Email: admin@farmagest.com');
    console.log('Contraseña: admin123');
    console.log('\n✅ Proceso completado');
    
  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

resetearPasswordAdmin();

