/**
 * Script para eliminar obras sociales duplicadas (OSDE y Swiss Medical)
 */
require("dotenv").config();
const db = require("../db");

console.log("🔍 Buscando obras sociales duplicadas (OSDE y Swiss Medical)...\n");

// Función para buscar duplicados
function buscarDuplicados(nombreObraSocial, callback) {
  // Buscar por nombre (case insensitive)
  db.query(
    `SELECT obra_social_id, obra_social, plan, descuento, codigo, deleted_at,
            (SELECT COUNT(*) FROM clientes WHERE obra_social_id = obras_sociales.obra_social_id AND deleted_at IS NULL) as clientes_asociados
     FROM obras_sociales 
     WHERE UPPER(TRIM(obra_social)) LIKE UPPER(TRIM($1))
       AND deleted_at IS NULL
     ORDER BY obra_social_id ASC`,
    [`%${nombreObraSocial}%`],
    (err, results) => {
      if (err) {
        return callback(err, null);
      }
      
      const rows = results.rows || results || [];
      callback(null, rows);
    }
  );
}

// Función para eliminar duplicado (soft delete)
function eliminarDuplicado(obraSocialId, motivo, callback) {
  db.query(
    `UPDATE obras_sociales 
     SET deleted_at = CURRENT_TIMESTAMP 
     WHERE obra_social_id = $1`,
    [obraSocialId],
    (err, result) => {
      if (err) {
        return callback(err);
      }
      console.log(`   ✅ Eliminado (soft delete): ID ${obraSocialId} - ${motivo}`);
      callback(null);
    }
  );
}

// Función para actualizar clientes que usan el duplicado
function actualizarClientesDuplicados(obraSocialIdAntiguo, obraSocialIdNuevo, callback) {
  db.query(
    `UPDATE clientes 
     SET obra_social_id = $1 
     WHERE obra_social_id = $2 AND deleted_at IS NULL`,
    [obraSocialIdNuevo, obraSocialIdAntiguo],
    (err, result) => {
      if (err) {
        return callback(err);
      }
      const rowsUpdated = result.rowCount || 0;
      if (rowsUpdated > 0) {
        console.log(`   ✅ ${rowsUpdated} cliente(s) actualizado(s) para usar la obra social principal`);
      }
      callback(null);
    }
  );
}

// Función principal para procesar duplicados
function procesarDuplicados(nombreObraSocial) {
  buscarDuplicados(nombreObraSocial, (err, obras) => {
    if (err) {
      console.error(`❌ Error al buscar duplicados de ${nombreObraSocial}:`, err.message);
      return;
    }

    if (obras.length <= 1) {
      console.log(`✅ ${nombreObraSocial}: No hay duplicados (${obras.length} encontrada(s))`);
      return;
    }

    console.log(`\n📋 ${nombreObraSocial}: ${obras.length} duplicado(s) encontrado(s)`);
    
    // Mostrar todos los duplicados
    obras.forEach((obra, index) => {
      console.log(`   ${index + 1}. ID: ${obra.obra_social_id} - "${obra.obra_social}" - Plan: ${obra.plan || 'N/A'} - Clientes: ${obra.clientes_asociados || 0}`);
    });

    // Identificar el principal (el que tiene más clientes o el primero)
    let principal = obras[0];
    for (const obra of obras) {
      const clientesPrincipal = parseInt(principal.clientes_asociados || 0);
      const clientesObra = parseInt(obra.clientes_asociados || 0);
      
      if (clientesObra > clientesPrincipal) {
        principal = obra;
      }
    }

    console.log(`\n   📌 Obra social principal a mantener: ID ${principal.obra_social_id} - "${principal.obra_social}" (${principal.clientes_asociados || 0} clientes)`);

    // Procesar duplicados
    let procesados = 0;
    let index = 0;

    function procesarSiguiente() {
      if (index >= obras.length) {
        console.log(`\n   ✅ Procesados ${procesados} duplicado(s) de ${nombreObraSocial}\n`);
        return;
      }

      const obra = obras[index];
      index++;

      // Si es el principal, saltarlo
      if (obra.obra_social_id === principal.obra_social_id) {
        procesarSiguiente();
        return;
      }

      // Actualizar clientes si los hay
      if (parseInt(obra.clientes_asociados || 0) > 0) {
        actualizarClientesDuplicados(obra.obra_social_id, principal.obra_social_id, (err) => {
          if (err) {
            console.error(`   ❌ Error al actualizar clientes del ID ${obra.obra_social_id}:`, err.message);
          }
          
          // Eliminar el duplicado
          eliminarDuplicado(obra.obra_social_id, `Duplicado de ${nombreObraSocial}`, (err) => {
            if (err) {
              console.error(`   ❌ Error al eliminar ID ${obra.obra_social_id}:`, err.message);
            } else {
              procesados++;
            }
            procesarSiguiente();
          });
        });
      } else {
        // No hay clientes, eliminar directamente
        eliminarDuplicado(obra.obra_social_id, `Duplicado de ${nombreObraSocial}`, (err) => {
          if (err) {
            console.error(`   ❌ Error al eliminar ID ${obra.obra_social_id}:`, err.message);
          } else {
            procesados++;
          }
          procesarSiguiente();
        });
      }
    }

    procesarSiguiente();
  });
}

// Función para verificar resultados finales
function verificarResultados() {
  console.log("\n" + "=".repeat(60));
  console.log("🔍 VERIFICACIÓN FINAL");
  console.log("=".repeat(60) + "\n");

  buscarDuplicados("OSDE", (err, obrasOSDE) => {
    if (!err) {
      const activasOSDE = obrasOSDE.filter(o => !o.deleted_at);
      console.log(`📊 OSDE: ${activasOSDE.length} obra(s) social(es) activa(s)`);
      if (activasOSDE.length > 1) {
        console.log(`   ⚠️  Aún hay duplicados de OSDE`);
        activasOSDE.forEach(obra => {
          console.log(`      - ID: ${obra.obra_social_id} - "${obra.obra_social}"`);
        });
      } else if (activasOSDE.length === 1) {
        console.log(`   ✅ OSDE sin duplicados`);
      }
    }

    buscarDuplicados("Swiss Medical", (err, obrasSwiss) => {
      if (!err) {
        const activasSwiss = obrasSwiss.filter(o => !o.deleted_at);
        console.log(`📊 Swiss Medical: ${activasSwiss.length} obra(s) social(es) activa(s)`);
        if (activasSwiss.length > 1) {
          console.log(`   ⚠️  Aún hay duplicados de Swiss Medical`);
          activasSwiss.forEach(obra => {
            console.log(`      - ID: ${obra.obra_social_id} - "${obra.obra_social}"`);
          });
        } else if (activasSwiss.length === 1) {
          console.log(`   ✅ Swiss Medical sin duplicados`);
        }
      }

      console.log("\n" + "=".repeat(60));
      console.log("✅ PROCESO COMPLETADO");
      console.log("=".repeat(60) + "\n");
      process.exit(0);
    });
  });
}

// Procesar duplicados
console.log("🚀 Iniciando proceso de eliminación de duplicados...\n");

// Esperar un poco para que ambas consultas terminen antes de verificar
setTimeout(() => {
  procesarDuplicados("OSDE");
}, 500);

setTimeout(() => {
  procesarDuplicados("Swiss Medical");
}, 1000);

// Verificar resultados después de un tiempo
setTimeout(() => {
  verificarResultados();
}, 5000);

