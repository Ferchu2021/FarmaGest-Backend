/**
 * Script para crear permisos y asignarlos al rol Administrador
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

async function crearPermisosAdministrador() {
  console.log("🔐 Creando permisos y asignándolos al Administrador...\n");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Obtener o crear el rol Administrador
    let adminRolResult = await client.query(
      "SELECT rol_id FROM roles WHERE rol = 'Administrador'"
    );
    
    if (adminRolResult.rows.length === 0) {
      await client.query("INSERT INTO roles (rol) VALUES ('Administrador')");
      adminRolResult = await client.query(
        "SELECT rol_id FROM roles WHERE rol = 'Administrador'"
      );
    }
    
    const adminRolId = adminRolResult.rows[0].rol_id;
    console.log(`✅ Rol Administrador encontrado (ID: ${adminRolId})`);

    // 2. Crear permisos si no existen
    const permisos = [
      "ver_productos",
      "crear_productos",
      "editar_productos",
      "eliminar_productos",
      "ver_clientes",
      "crear_clientes",
      "editar_clientes",
      "eliminar_clientes",
      "ver_ventas",
      "crear_ventas",
      "editar_ventas",
      "ver_usuarios",
      "crear_usuarios",
      "editar_usuarios",
      "eliminar_usuarios",
      "ver_reportes",
      "ver_auditoria",
      "ver_proveedores",
      "crear_proveedores",
      "editar_proveedores",
      "eliminar_proveedores",
      "ver_obras_sociales",
      "crear_obras_sociales",
      "editar_obras_sociales",
      "eliminar_obras_sociales",
    ];

    console.log("\n📋 Creando permisos...");
    const permisosIds = {};

    for (const permiso of permisos) {
      // Verificar si existe
      let permisoResult = await client.query(
        "SELECT permiso_id FROM permisos WHERE permiso = $1",
        [permiso]
      );

      if (permisoResult.rows.length === 0) {
        // Crear permiso
        await client.query(
          "INSERT INTO permisos (permiso, descripcion) VALUES ($1, $2)",
          [permiso, `Permiso para ${permiso.replace(/_/g, ' ')}`]
        );
        permisoResult = await client.query(
          "SELECT permiso_id FROM permisos WHERE permiso = $1",
          [permiso]
        );
        console.log(`   ✅ Permiso creado: ${permiso}`);
      } else {
        console.log(`   ℹ️  Permiso ya existe: ${permiso}`);
      }

      permisosIds[permiso] = permisoResult.rows[0].permiso_id;
    }

    // 3. Asignar todos los permisos al Administrador
    console.log("\n🔗 Asignando permisos al rol Administrador...");
    let asignados = 0;
    let yaAsignados = 0;

    for (const [permiso, permisoId] of Object.entries(permisosIds)) {
      // Verificar si ya está asignado
      const existe = await client.query(
        "SELECT 1 FROM roles_permisos WHERE rol_id = $1 AND permiso_id = $2",
        [adminRolId, permisoId]
      );

      if (existe.rows.length === 0) {
        await client.query(
          "INSERT INTO roles_permisos (rol_id, permiso_id) VALUES ($1, $2)",
          [adminRolId, permisoId]
        );
        asignados++;
      } else {
        yaAsignados++;
      }
    }

    await client.query("COMMIT");

    console.log(`\n✅ Proceso completado:`);
    console.log(`   - Permisos creados/verificados: ${permisos.length}`);
    console.log(`   - Permisos asignados al Administrador: ${asignados}`);
    console.log(`   - Permisos ya asignados: ${yaAsignados}`);
    console.log(`\n🎉 El administrador ahora tiene acceso completo al sistema`);

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

crearPermisosAdministrador();










