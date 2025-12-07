const db = require("../db.js");

console.log("🔧 Creando clientes de prueba...\n");

// Primero necesitamos obtener obras sociales y ciudades disponibles
db.query(
  `SELECT obra_social_id, obra_social FROM obras_sociales WHERE deleted_at IS NULL LIMIT 5`,
  [],
  (err, obrasResult) => {
    if (err) {
      console.error("❌ Error al obtener obras sociales:", err);
      process.exit(1);
    }

    const obras = obrasResult.rows || obrasResult || [];
    
    if (obras.length === 0) {
      console.log("⚠️  No hay obras sociales en la BD. Creando clientes sin obra social...");
    }

    db.query(
      `SELECT ciudad_id, ciudad FROM ciudades LIMIT 5`,
      [],
      (err, ciudadesResult) => {
        if (err) {
          console.error("❌ Error al obtener ciudades:", err);
          process.exit(1);
        }

        const ciudades = ciudadesResult.rows || ciudadesResult || [];
        
        if (ciudades.length === 0) {
          console.log("⚠️  No hay ciudades en la BD. Creando clientes sin ciudad...");
        }

        // Crear clientes de prueba
        const clientes = [
          { nombre: "Juan", apellido: "Pérez", dni: "12345678", obra_social_id: obras[0]?.obra_social_id || null, ciudad_id: ciudades[0]?.ciudad_id || null },
          { nombre: "María", apellido: "González", dni: "23456789", obra_social_id: obras[1]?.obra_social_id || null, ciudad_id: ciudades[1]?.ciudad_id || null },
          { nombre: "Carlos", apellido: "Rodríguez", dni: "34567890", obra_social_id: obras[0]?.obra_social_id || null, ciudad_id: ciudades[0]?.ciudad_id || null },
          { nombre: "Ana", apellido: "Martínez", dni: "45678901", obra_social_id: obras[2]?.obra_social_id || null, ciudad_id: ciudades[2]?.ciudad_id || null },
          { nombre: "Luis", apellido: "Fernández", dni: "56789012", obra_social_id: obras[1]?.obra_social_id || null, ciudad_id: ciudades[1]?.ciudad_id || null },
          { nombre: "Laura", apellido: "López", dni: "67890123", obra_social_id: obras[0]?.obra_social_id || null, ciudad_id: ciudades[0]?.ciudad_id || null },
          { nombre: "Pedro", apellido: "Sánchez", dni: "78901234", obra_social_id: obras[3]?.obra_social_id || null, ciudad_id: ciudades[3]?.ciudad_id || null },
          { nombre: "Carmen", apellido: "Torres", dni: "89012345", obra_social_id: obras[2]?.obra_social_id || null, ciudad_id: ciudades[2]?.ciudad_id || null }
        ];

        let creados = 0;
        let index = 0;

        function crearCliente() {
          if (index >= clientes.length) {
            console.log(`\n✅ ${creados} clientes creados\n`);
            console.log("=".repeat(60));
            console.log("✅ CLIENTES DE PRUEBA CREADOS EXITOSAMENTE");
            console.log("=".repeat(60));
            process.exit(0);
          }

          const cliente = clientes[index];
          
          // Verificar si el DNI ya existe
          db.query(
            `SELECT cliente_id FROM clientes WHERE dni = $1 AND deleted_at IS NULL`,
            [cliente.dni],
            (err, checkResult) => {
              if (err) {
                console.error(`❌ Error al verificar DNI ${cliente.dni}:`, err.message);
                index++;
                crearCliente();
                return;
              }

              const exists = (checkResult.rows || checkResult || []).length > 0;
              
              if (exists) {
                console.log(`⚠️  Cliente con DNI ${cliente.dni} ya existe, omitiendo...`);
                index++;
                crearCliente();
                return;
              }

              db.query(
                `INSERT INTO clientes (nombre, apellido, dni, obra_social_id, ciudad_id) 
                 VALUES ($1, $2, $3, $4, $5) 
                 RETURNING cliente_id`,
                [cliente.nombre, cliente.apellido, cliente.dni, cliente.obra_social_id, cliente.ciudad_id],
                (err, result) => {
                  if (err) {
                    console.error(`❌ Error al crear cliente ${cliente.nombre} ${cliente.apellido}:`, err.message);
                  } else {
                    console.log(`✅ Cliente creado: ${cliente.nombre} ${cliente.apellido} (DNI: ${cliente.dni})`);
                    creados++;
                  }
                  index++;
                  crearCliente();
                }
              );
            }
          );
        }

        crearCliente();
      }
    );
  }
);



