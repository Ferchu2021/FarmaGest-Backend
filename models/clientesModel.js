const db = require("../db");

class Cliente {
  constructor(nombre, apellido, dni, obra_social_id, ciudad_id) {
    this.nombre = nombre;
    this.apellido = apellido;
    this.dni = dni;
    this.obra_social_id = obra_social_id;
    this.ciudad_id = ciudad_id;
  }

  static obtenerClientes(
    page = 0,
    pageSize = 6,
    search = "",
    sesion,
    obraSocialID = 0,
    ciudadID = 0,
    callback
  ) {
    const offset = (page - 1) * pageSize;
    const searchQuery = search ? `%${search}%` : "%";

    let query = `
      SELECT 
        c.cliente_id, 
        c.nombre as Nombre, 
        c.apellido as Apellido, 
        c.dni as DNI, 
        o.obra_social_id,
        o.obra_social,
        ci.ciudad_id, 
        ci.ciudad as Ciudad
      FROM clientes as c
      LEFT JOIN obras_sociales as o on o.obra_social_id = c.obra_social_id
      LEFT JOIN ciudades as ci on ci.ciudad_id = c.ciudad_id
      WHERE c.deleted_at IS NULL 
        AND (c.nombre LIKE $1 OR c.apellido LIKE $2 OR c.dni LIKE $3)
    `;

    const params = [searchQuery, searchQuery, searchQuery];
    let paramIndex = 4;

    // Agregar filtro por obra social si se proporciona
    if (obraSocialID && obraSocialID > 0) {
      query += ` AND c.obra_social_id = $${paramIndex}`;
      params.push(obraSocialID);
      paramIndex++;
    }

    // Agregar filtro por ciudad si se proporciona
    if (ciudadID && ciudadID > 0) {
      query += ` AND c.ciudad_id = $${paramIndex}`;
      params.push(ciudadID);
      paramIndex++;
    }

    query += ` ORDER BY c.cliente_id LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(pageSize, offset);

    // La actualización de sesión ahora se maneja en el middleware de routes.js
    return db.query(query, params, (err, results) => {
      if (err) {
        return callback(err, null);
      }
      // PostgreSQL devuelve results.rows, MySQL devuelve results directamente
      const rows = results.rows || results;
      callback(null, rows);
    });
  }

  static agregarCliente(nuevoCliente, usuario_id, callback) {
    console.log("agregarCliente - Modelo - Datos:", {
      nombre: nuevoCliente.nombre,
      apellido: nuevoCliente.apellido,
      dni: nuevoCliente.dni,
      obra_social_id: nuevoCliente.obra_social_id,
      ciudad_id: nuevoCliente.ciudad_id,
      usuario_id: usuario_id
    });

    return db.query(
      `INSERT INTO clientes (nombre, apellido, dni, obra_social_id, ciudad_id) 
       VALUES ($1, $2, $3, $4, $5)
       RETURNING cliente_id`,
      [
        nuevoCliente.nombre,
        nuevoCliente.apellido,
        nuevoCliente.dni,
        nuevoCliente.obra_social_id || null,
        nuevoCliente.ciudad_id || null,
      ],
      (err, result) => {
        if (err) {
          console.error("Error al insertar cliente:", err);
          console.error("Detalles:", {
            message: err.message,
            code: err.code,
            detail: err.detail,
            hint: err.hint,
          });
          return callback(err, null);
        }
        
        // PostgreSQL devuelve el ID en result.rows[0].cliente_id
        const clienteId = result.rows && result.rows[0] ? result.rows[0].cliente_id : (result.insertId || null);
        
        if (!clienteId) {
          console.error("Error: No se pudo obtener el ID del cliente insertado");
          console.error("Result object:", JSON.stringify(result, null, 2));
          return callback(new Error("No se pudo obtener el ID del cliente insertado"), null);
        }
        
        console.log("Cliente insertado con ID:", clienteId);
        
        // Registrar en auditoría (no bloquear si falla)
        db.query(
          `INSERT INTO auditoria_clientes (cliente_id, accion, detalle_cambio, fecha_movimiento, usuario_id) 
           VALUES ($1, 'CREAR', $2, CURRENT_TIMESTAMP, $3)`,
          [clienteId, `Se ha creado un nuevo cliente ${nuevoCliente.nombre} ${nuevoCliente.apellido}`, usuario_id || 1],
          (err) => {
            if (err) {
              console.error("Error al registrar en auditoría (no crítico):", err);
            } else {
              console.log("Auditoría registrada correctamente");
            }
          }
        );
        
        callback(null, { id: clienteId, cliente_id: clienteId, ...nuevoCliente });
      }
    );
  }

  static actualizarCliente(cliente_id, cliente, callback) {
    db.query(
      `SELECT c.cliente_id, c.nombre, c.apellido, c.dni, o.obra_social_id, o.obra_social, ci.ciudad_id, ci.ciudad
      FROM clientes as c
      LEFT JOIN obras_sociales as o on o.obra_social_id = c.obra_social_id
      LEFT JOIN ciudades as ci on ci.ciudad_id = c.ciudad_id 
      WHERE c.cliente_id = $1`,
      [cliente_id],
      (err, resultados) => {
        if (err) {
          return callback(err, null);
        }

        // PostgreSQL devuelve results.rows, MySQL devuelve results directamente
        const rows = resultados.rows || resultados;
        
        if (!rows || rows.length === 0) {
          return callback(new Error("Cliente no encontrado"), null);
        }

        const clienteActual = rows[0];

        let detalle_cambio = "";

        // 2️⃣ Comparar campo por campo y generar la descripción del cambio
        if (cliente.nombre !== clienteActual.nombre) {
          detalle_cambio += `Nombre: ${clienteActual.nombre} → ${cliente.nombre}; `;
        }
        if (cliente.apellido !== clienteActual.apellido) {
          detalle_cambio += `Apellido: ${clienteActual.apellido} → ${cliente.apellido}; `;
        }
        if (cliente.dni !== clienteActual.dni) {
          detalle_cambio += `DNI: ${clienteActual.dni} → ${cliente.dni}; `;
        }
        if (cliente.obra_social !== clienteActual.obra_social) {
          detalle_cambio += `Obra Social: ${clienteActual.obra_social} → ${cliente.obra_social}; `;
        }
        if (cliente.Ciudad !== clienteActual.ciudad) {
          detalle_cambio += `Ciudad: ${clienteActual.ciudad} → ${cliente.Ciudad}; `;
        }

        db.query(
          `UPDATE clientes 
           SET nombre = $1, apellido = $2, dni = $3, obra_social_id = $4, ciudad_id = $5 
           WHERE cliente_id = $6`,
          [
            cliente.nombre,
            cliente.apellido,
            cliente.dni,
            cliente.obra_social_id || null,
            cliente.ciudad_id || null,
            parseInt(cliente_id),
          ],
          callback
        );
        if (detalle_cambio !== "") {
          db.query(
            `INSERT INTO auditoria_clientes (cliente_id, accion, detalle_cambio, fecha_movimiento, usuario_id) 
             VALUES ($1, 'ACTUALIZAR', $2, CURRENT_TIMESTAMP, $3)`,
            [cliente_id, detalle_cambio, cliente.usuario_id || 1],
            (err) => {
              if (err) {
                console.error("Error al registrar en auditoría:", err);
              }
            }
          );
        }
      }
    );
  }

  static eliminarCliente(
    clienteID,
    usuario_id,
    clienteNombre,
    clienteApellido,
    callback
  ) {
    db.query(
      `INSERT INTO auditoria_clientes (cliente_id, accion, fecha_movimiento, detalle_cambio, usuario_id) 
       VALUES ($1, 'ELIMINAR', CURRENT_TIMESTAMP, $2, $3)`,
      [clienteID, `Se ha eliminado cliente ${clienteNombre} ${clienteApellido}`, usuario_id || 1],
      (err) => {
        if (err) {
          console.error("Error al registrar en auditoría:", err);
        }
      }
    );
    return db.query(
      `UPDATE clientes SET deleted_at = CURRENT_TIMESTAMP WHERE cliente_id = $1`,
      [clienteID],
      callback
    );
  }

  static obtenerObrasSociales(callback) {
    return db.query(
      `
      SELECT DISTINCT ON (obra_social) 
        obra_social_id, 
        obra_social, 
        plan, 
        descuento, 
        codigo
      FROM obras_sociales 
      WHERE deleted_at IS NULL
      ORDER BY obra_social, obra_social_id
      `,
      [],
      (err, results) => {
        if (err) {
          return callback(err, null);
        }
        // PostgreSQL devuelve results.rows, MySQL devuelve results directamente
        const rows = results.rows || results;
        callback(null, rows);
      }
    );
  }

  static obtenerCiudades(callback) {
    return db.query(
      `
      SELECT ciudad_id, ciudad, codigo_postal, provincia_id
      FROM ciudades
      `,
      [],
      (err, results) => {
        if (err) {
          return callback(err, null);
        }
        // PostgreSQL devuelve results.rows, MySQL devuelve results directamente
        const rows = results.rows || results;
        callback(null, rows);
      }
    );
  }
}

module.exports = Cliente;
