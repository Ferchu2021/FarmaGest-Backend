const db = require("../db");

class ObraSocial {
  constructor(obra_social, plan, descuento, codigo) {
    this.obra_social = obra_social;
    this.plan = plan;
    this.descuento = descuento;
    this.codigo = codigo;
  }

  static obtenerObrasSociales(
    page = 0,
    pageSize = 6,
    search = "",
    sesion,
    callback
  ) {
    const offset = (page - 1) * pageSize;

    const searchQuery = search ? `%${search}%` : "%";

    let query = `
      SELECT obra_social_id, obra_social, plan as Plan, descuento as Descuento, codigo as Codigo
      FROM obras_sociales
      WHERE deleted_at is NULL and (obra_social LIKE ? OR plan LIKE ? OR codigo LIKE ?)
    `;

    const params = [searchQuery, searchQuery, searchQuery];
    query += ` LIMIT ? OFFSET ?`;
    params.push(pageSize, offset);

    // La actualización de sesión ahora se maneja en el middleware de routes.js
    return db.query(query, params, (err, results) => {
      if (err) {
        return callback(err, null);
      }
      // PostgreSQL devuelve results.rows, MySQL devuelve results directamente
      let rows = results.rows || results;
      // Asegurarse de que rows es un array
      if (!Array.isArray(rows)) {
        console.error("Error: results.rows no es un array. Tipo:", typeof results, "Contenido:", results);
        rows = [];
      }
      callback(null, rows);
    });
  }

  static agregarObraSocial(nuevaObraSocial, usuario_id, callback) {
    return db.query(
      "INSERT INTO obras_sociales (obra_social, plan, descuento, codigo) VALUES (?, ?, ?, ?)",
      [
        nuevaObraSocial.obra_social,
        nuevaObraSocial.plan,
        nuevaObraSocial.descuento,
        nuevaObraSocial.codigo,
      ],
      (err, result) => {
        if (err) {
          return callback(err, null);
        }

        db.query(
          `INSERT INTO auditoria_obras_sociales (obra_social_id, accion, detalle_cambio, fecha_movimiento, usuario_id) VALUES (?, 'CREAR', 'Se ha creado una nueva obra social ${nuevaObraSocial.obra_social}', CURRENT_TIMESTAMP, ?)`,
          [result.insertId, usuario_id], // usuario_id por defecto 1 si no está disponible
          (err) => {
            if (err) {
              console.error("Error al registrar en auditoría:", err);
            }
          }
        );
        callback(null, { id: result.insertId, ...nuevaObraSocial });
      }
    );
  }

  static actualizarObraSocial(obraSocialID, obraSocialActualizada, callback) {
    db.query(
      "SELECT * FROM obras_sociales WHERE obra_social_id = ?",
      [obraSocialID],
      (err, resultados) => {
        if (err) {
          return callback(err, null);
        }

        // PostgreSQL devuelve results.rows, MySQL devuelve results directamente
        const rows = resultados.rows || resultados;
        
        if (!rows || rows.length === 0) {
          return callback(new Error("Obra social no encontrada"), null);
        }

        const obraSocialAnterior = rows[0];

        let detalle_cambio = "";

        // 2️⃣ Comparar campo por campo y generar la descripción del cambio
        if (
          obraSocialActualizada.obra_social !== obraSocialAnterior.obra_social
        ) {
          detalle_cambio += `O.Social: ${obraSocialAnterior.obra_social} → ${obraSocialActualizada.obra_social}; `;
        }
        if (obraSocialActualizada.plan !== obraSocialAnterior.plan) {
          detalle_cambio += `Plan: ${obraSocialAnterior.plan} → ${obraSocialActualizada.plan}; `;
        }
        if (obraSocialActualizada.descuento !== obraSocialAnterior.descuento) {
          detalle_cambio += `Descuento: ${obraSocialAnterior.descuento} → ${obraSocialActualizada.descuento}; `;
        }
        if (obraSocialActualizada.codigo !== obraSocialAnterior.codigo) {
          detalle_cambio += `Codigo: ${obraSocialAnterior.codigo} → ${obraSocialActualizada.codigo}; `;
        }

        db.query(
          "UPDATE obras_sociales SET obra_social = ?, plan = ? , descuento = ?, codigo = ? WHERE obra_social_id = ?",
          [
            obraSocialActualizada.obra_social,
            obraSocialActualizada.plan,
            obraSocialActualizada.descuento,
            obraSocialActualizada.codigo,
            obraSocialID,
          ],
          callback
        );
        if (detalle_cambio !== "") {
          db.query(
            "INSERT INTO auditoria_obras_sociales (obra_social_id, accion, detalle_cambio, fecha_movimiento, usuario_id) VALUES (?, 'ACTUALIZAR', ?, CURRENT_TIMESTAMP, ?)",
            [obraSocialID, detalle_cambio, obraSocialActualizada.usuario_id], // usuario_id por defecto 1 si no está disponible
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

  static eliminarObraSocial(obraSocialID, usuario_id, obraSocial, callback) {
    db.query(
      `INSERT INTO auditoria_obras_sociales (obra_social_id, accion, fecha_movimiento,detalle_cambio, usuario_id) VALUES (?, 'ELIMINAR', CURRENT_TIMESTAMP,'Se ha eliminado la Obra social ${obraSocial}',?)`,
      [obraSocialID, usuario_id],
      (err) => {
        if (err) {
          console.error("Error al registrar en auditoría:", err);
        }
      }
    );
    return db.query(
      "UPDATE obras_sociales SET deleted_at = CURRENT_TIMESTAMP WHERE obra_social_id = ?",
      [obraSocialID],
      callback
    );
  }
}

module.exports = ObraSocial;
