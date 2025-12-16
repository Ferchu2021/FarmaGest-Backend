const db = require("../db.js");

console.log("🔧 Creando permisos de gestión para el menú...\n");

// Permisos que el frontend necesita para mostrar el menú
const permisosGestion = [
  {
    permiso: "gestion_productos",
    descripcion: "Acceso al módulo de gestión de productos"
  },
  {
    permiso: "gestion_clientes",
    descripcion: "Acceso al módulo de gestión de clientes"
  },
  {
    permiso: "gestion_ventas",
    descripcion: "Acceso al módulo de gestión de ventas"
  },
  {
    permiso: "gestion_proveedores",
    descripcion: "Acceso al módulo de gestión de proveedores"
  },
  {
    permiso: "gestion_obras_sociales",
    descripcion: "Acceso al módulo de gestión de obras sociales"
  },
  {
    permiso: "gestion_usuarios",
    descripcion: "Acceso al módulo de gestión de usuarios"
  }
];

let creados = 0;
let yaExistentes = 0;

function crearPermisosGestion(index = 0) {
  if (index >= permisosGestion.length) {
    // Asignar todos los permisos de gestión al rol Administrador
    asignarPermisosAlAdministrador();
    return;
  }

  const permiso = permisosGestion[index];
  
  // Verificar si el permiso ya existe
  db.query(
    `SELECT permiso_id FROM permisos WHERE permiso = $1`,
    [permiso.permiso],
    (err, result) => {
      if (err) {
        console.error(`❌ Error al verificar permiso ${permiso.permiso}:`, err);
        crearPermisosGestion(index + 1);
        return;
      }

      if (result.rows && result.rows.length > 0) {
        console.log(`⚠️  Permiso '${permiso.permiso}' ya existe`);
        yaExistentes++;
        crearPermisosGestion(index + 1);
      } else {
        // Crear el permiso
        db.query(
          `INSERT INTO permisos (permiso, descripcion) VALUES ($1, $2) RETURNING permiso_id`,
          [permiso.permiso, permiso.descripcion],
          (err, result) => {
            if (err) {
              console.error(`❌ Error al crear permiso ${permiso.permiso}:`, err);
            } else {
              console.log(`✅ Permiso '${permiso.permiso}' creado`);
              creados++;
            }
            crearPermisosGestion(index + 1);
          }
        );
      }
    }
  );
}

function asignarPermisosAlAdministrador() {
  console.log("\n🔗 Asignando permisos de gestión al rol Administrador...\n");
  
  // Obtener el rol_id del Administrador
  db.query(
    `SELECT rol_id FROM roles WHERE rol = 'Administrador'`,
    [],
    (err, result) => {
      if (err) {
        console.error("❌ Error al obtener rol Administrador:", err);
        finalizar();
        return;
      }

      if (!result.rows || result.rows.length === 0) {
        console.error("❌ No se encontró el rol Administrador");
        finalizar();
        return;
      }

      const rolId = result.rows[0].rol_id;
      
      // Obtener todos los permisos de gestión
      db.query(
        `SELECT permiso_id FROM permisos WHERE permiso LIKE 'gestion_%'`,
        [],
        (err, result) => {
          if (err) {
            console.error("❌ Error al obtener permisos de gestión:", err);
            finalizar();
            return;
          }

          const permisosIds = result.rows.map(r => r.permiso_id);
          let asignados = 0;

          if (permisosIds.length === 0) {
            console.log("⚠️  No hay permisos de gestión para asignar");
            finalizar();
            return;
          }

          function asignarPermiso(permIndex = 0) {
            if (permIndex >= permisosIds.length) {
              console.log(`\n✅ ${asignados} permisos de gestión asignados al Administrador\n`);
              finalizar();
              return;
            }

            const permisoId = permisosIds[permIndex];
            
            // Verificar si ya está asignado
            db.query(
              `SELECT rol_id FROM roles_permisos WHERE rol_id = $1 AND permiso_id = $2`,
              [rolId, permisoId],
              (err, result) => {
                if (err) {
                  console.error(`❌ Error al verificar asignación:`, err);
                  asignarPermiso(permIndex + 1);
                  return;
                }

                if (result.rows && result.rows.length > 0) {
                  // Ya está asignado
                  asignarPermiso(permIndex + 1);
                } else {
                  // Asignar el permiso
                  db.query(
                    `INSERT INTO roles_permisos (rol_id, permiso_id) VALUES ($1, $2)`,
                    [rolId, permisoId],
                    (err) => {
                      if (err) {
                        console.error(`❌ Error al asignar permiso:`, err);
                      } else {
                        asignados++;
                      }
                      asignarPermiso(permIndex + 1);
                    }
                  );
                }
              }
            );
          }

          asignarPermiso();
        }
      );
    }
  );
}

function finalizar() {
  console.log("\n" + "=".repeat(60));
  console.log("📊 RESUMEN:");
  console.log(`   ✅ Permisos creados: ${creados}`);
  console.log(`   ⚠️  Permisos ya existentes: ${yaExistentes}`);
  console.log("=".repeat(60));
  console.log("\n✅ Proceso completado. Reinicia el servidor backend.\n");
  process.exit(0);
}

// Iniciar el proceso
crearPermisosGestion();










