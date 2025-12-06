const db = require("../db");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const { v4: uuidv4 } = require("uuid"); // Importar la función para generar UUID

class Usuario {
  constructor(nombre, apellido, correo, rol_id, contrasena) {
    this.nombre = nombre;
    this.apellido = apellido;
    this.correo = correo;
    this.rol_id = rol_id;
    this.contrasena = contrasena;
  }

  static obtenerUsuarios(
    page = 0,
    pageSize = 6,
    search = "",
    rolID = "1",
    sesion,
    callback
  ) {
    const offset = (page - 1) * pageSize;
    const searchQuery = search ? `%${search}%` : "%";

    let query = `
    SELECT u.usuario_id, u.nombre as Nombre, u.apellido as Apellido, u.correo as Correo,  r.rol_id, r.rol as Rol FROM usuarios as u
    LEFT JOIN roles as r on r.rol_id = u.rol_id
    WHERE deleted_at is NULL and (nombre LIKE ? OR apellido LIKE ? OR correo LIKE ?)
  `;

    // Agregar condición para filtrar por rol si rolID no es 0
    const params = [searchQuery, searchQuery, searchQuery];
    if (rolID != 0) {
      query += ` AND r.rol_id = ?`;
      params.push(rolID);
    }

    query += ` LIMIT ? OFFSET ?`;
    params.push(pageSize, offset);
    
    // La actualización de sesión ahora se maneja en el middleware de routes.js
    return db.query(query, params, callback);
  }
  static agregarUsuario(nuevoUsuario, callback) {
    // Primero, verifica si el correo ya está registrado
    db.query(
      "SELECT * FROM usuarios WHERE correo = ?",
      [nuevoUsuario.correo],
      (error, results) => {
        if (error) {
          console.error("Error al verificar correo:", error);
          return callback(error);
        }

        if (results.length > 0) {
          // Si ya existe un usuario con ese correo, retorna un error
          return callback(new Error("El correo ya está registrado"));
        } else {
          // Encripta la contraseña antes de insertarla en la base de datos
          bcrypt.hash(
            nuevoUsuario.contrasena,
            saltRounds,
            (err, hashedPassword) => {
              if (err) {
                console.error("Error al encriptar la contraseña:", err);
                return callback(err);
              }

              // Si no existe, inserta el nuevo usuario con la contraseña encriptada
              db.query(
                "INSERT INTO usuarios (nombre, apellido, correo, rol_id, contrasena, estado) VALUES (?, ?, ?, ?, ?, true)",
                [
                  nuevoUsuario.nombre,
                  nuevoUsuario.apellido,
                  nuevoUsuario.correo,
                  nuevoUsuario.rol_id,
                  hashedPassword,
                ],
                (err, resultado) => {
                  if (err) {
                    console.error("Error al insertar usuario:", err);
                    return callback(err);
                  }
                  callback(null, resultado);
                }
              );
            }
          );
        }
      }
    );
  }

  static actualizarUsuario(usuario_id, usuario, callback) {
    return db.query(
      "UPDATE usuarios SET nombre = ?, apellido = ?, correo = ?, rol_id = ? WHERE usuario_id = ?",
      [
        usuario.nombre,
        usuario.apellido,
        usuario.correo,
        usuario.rol_id,
        parseInt(usuario_id),
      ],
      callback
    );
  }

  static actualizarPassword = (correo, hashedPassword, callback) => {
    return db.query(
      "UPDATE usuarios SET contrasena = ? WHERE correo = ?",
      [hashedPassword, correo],
      callback
    );
  };

  static eliminarUsuario(usuarioID, callback) {
    return db.query(
      "UPDATE usuarios SET deleted_at = NOW() WHERE usuario_id = ?",
      [usuarioID],
      callback
    );
  }
  static logoutUsuario(sessionId, callback) {
    return db.query(
      `UPDATE sesiones SET hora_logout = CURRENT_TIMESTAMP WHERE sesion_id = $1`,
      [sessionId],
      (err, resultado) => {
        if (err) {
          console.error("Error al desloguear usuario:", err);
          return callback(err);
        } else {
          // PostgreSQL devuelve rowCount, MySQL devuelve affectedRows
          const affectedRows = resultado.rowCount || resultado.affectedRows || 0;
          const mysqlFormatResult = {
            ...resultado,
            affectedRows: affectedRows,
            rowCount: affectedRows
          };
          return callback(null, mysqlFormatResult);
        }
      }
    );
  }

  static validarUsuarioLogin(
    correo,
    contrasena,
    ip_address,
    user_agent,
    callback
  ) {
    // Query compatible con PostgreSQL - usar STRING_AGG en lugar de GROUP_CONCAT
    db.query(
      `
      SELECT 
        u.usuario_id, 
        u.nombre, 
        u.apellido, 
        u.correo, 
        u.estado, 
        u.rol_id,
        r.rol, 
        u.contrasena,  
        COALESCE(STRING_AGG(p.permiso, ', '), '') as permisos
      FROM 
        usuarios as u
      LEFT JOIN 
        roles as r on r.rol_id = u.rol_id
      LEFT JOIN 
        roles_permisos as rp on rp.rol_id = u.rol_id
      LEFT JOIN 
        permisos as p on p.permiso_id = rp.permiso_id
      WHERE 
        u.correo = ? AND u.deleted_at IS NULL
      GROUP BY 
        u.usuario_id, u.nombre, u.apellido, u.correo, u.estado, u.rol_id, r.rol, u.contrasena;
      `,
      [correo],
      (err, results) => {
        if (err) {
          console.error("Error en query de login:", err);
          return callback(err);
        }

        // PostgreSQL devuelve results.rows, no results directamente
        const rows = results.rows || results;
        
        if (!rows || rows.length === 0) {
          // No se encontró el usuario
          return callback(new Error("Correo o contraseña incorrectos"));
        }

        // Usuario encontrado, compara la contraseña encriptada
        const usuario = rows[0];

        bcrypt.compare(contrasena, usuario.contrasena, (err, match) => {
          if (err) {
            return callback(err);
          }

          if (!match) {
            // Contraseña incorrecta
            return callback(new Error("Correo o contraseña incorrectos"));
          }
          const sessionId = uuidv4(); // Generar un UUID único para la sesión
          // Cerrar cualquier sesión activa antes de insertar una nueva
          db.query(
            `UPDATE sesiones 
   SET hora_logout = CURRENT_TIMESTAMP 
   WHERE correo_usuario = $1 AND hora_logout IS NULL`,
            [correo],
            (err, resultado) => {
              if (err) {
                console.error("Error al cerrar sesión anterior:", err);
                return callback(err);
              }

              // Insertar la nueva sesión
              db.query(
                `INSERT INTO sesiones (sesion_id, correo_usuario, navegador, ip, hora_logueo, ultima_actividad, hora_logout)
                  VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL)`,
                [sessionId, correo, user_agent, ip_address],
                (err, resultado) => {
                  if (err) {
                    console.error("Error al insertar sesión:", err);
                    return callback(err);
                  }
                }
              );
            }
          );

          // Contraseña correcta, retorna los detalles del usuario
          // Convertir permisos de string a array si es necesario
          let permisosArray = [];
          if (usuario.permisos) {
            if (typeof usuario.permisos === 'string' && usuario.permisos.trim() !== '') {
              permisosArray = usuario.permisos.split(', ').filter(p => p.trim() !== '');
            } else if (Array.isArray(usuario.permisos)) {
              permisosArray = usuario.permisos;
            }
          }

          callback(null, {
            usuario_id: usuario.usuario_id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            correo: usuario.correo,
            estado: usuario.estado,
            rol_id: usuario.rol_id,
            rol: usuario.rol,
            permisos: permisosArray,
            sesion_id: sessionId,
          });
        });
      }
    );
  }

  static obtenerRoles(callback) {
    return db.query(
      "SELECT rol_id, rol FROM roles ORDER BY rol_id",
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

module.exports = Usuario;
