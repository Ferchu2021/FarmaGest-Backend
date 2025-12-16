const Usuario = require("../models/usuariosModel");
const bcrypt = require("bcrypt");

const usuariosController = {
  obtenerUsuarios: (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 99;
    const search = req.query.search || "";
    const rolID = req.query.rolID || 0;
    const sesion = req.query.sesion;

    Usuario.obtenerUsuarios(
      page,
      pageSize,
      search,
      rolID,
      sesion,
      (err, usuarios) => {
        if (err) {
          res.status(500).json({ mensaje: "Error al obtener usuarios" });
        } else {
          res.json(usuarios);
        }
      }
    );
  },

  agregarUsuario: (req, res) => {
    const { nombre, apellido, correo, rol_id, contrasena } = req.body;

    const nuevoUsuario = new Usuario(
      nombre,
      apellido,
      correo,
      rol_id,
      contrasena
    );

    Usuario.agregarUsuario(nuevoUsuario, (err, resultado) => {
      if (err) {
        // Determina el tipo de error y ajusta el código de estado
        let mensajeError = "Error al agregar usuario";
        let codigoEstado = 500; // Error por defecto

        if (err.message.includes("El correo ya está registrado")) {
          mensajeError = "El correo ya está registrado";
          codigoEstado = 409; // Conflicto
        }
        res.status(codigoEstado).json({ mensaje: mensajeError });
      } else {
        res.status(201).json({
          mensaje: "Usuario agregado correctamente",
          usuario_id: resultado.insertId,
        });
      }
    });
  },

  actualizarUsuario: (req, res) => {
    const editarUsuario = req.body;
    Usuario.actualizarUsuario(req.params.id, editarUsuario, (err, usuario) => {
      if (err) throw err;
      res.json(usuario);
    });
  },

  actualizarPassword: async (req, res) => {
    const { password } = req.body;
    const correo = req.params.correo;

    // Encriptar la nueva contraseña
    try {
      const saltRounds = 10; // Puedes ajustar el número de rondas según tus necesidades
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      Usuario.actualizarPassword(correo, hashedPassword, (err, usuario) => {
        if (err) {
          console.error("Error al actualizar la contraseña:", err);
          return res
            .status(500)
            .json({ mensaje: "Error al actualizar la contraseña" });
        }
        res.json({ mensaje: "Contraseña actualizada correctamente" });
      });
    } catch (error) {
      console.error("Error al encriptar la contraseña:", error);
      res.status(500).json({ mensaje: "Error al encriptar la contraseña" });
    }
  },

  eliminarUsuario: (req, res) => {
    const usuarioID = req.params.id; // Obtener el ID del usuario desde los parámetros de la URL

    Usuario.eliminarUsuario(usuarioID, (err, resultado) => {
      if (err) {
        res.status(500).json({ mensaje: "Error al eliminar usuario" });
      } else {
        if (resultado.affectedRows > 0) {
          res.json({ mensaje: "Usuario eliminado correctamente" });
        } else {
          res.status(404).json({ mensaje: "Usuario no encontrado" });
        }
      }
    });
  },

  logoutUsuario: (req, res) => {
    const sessionId = req.params.sesion_id; // Obtener el ID del usuario desde los parámetros de la URL

    Usuario.logoutUsuario(sessionId, (err, resultado) => {
      if (err) {
        res.status(500).json({ mensaje: "Error al desloguear usuario" });
      } else {
        if (resultado.affectedRows > 0) {
          res
            .status(200)
            .json({ mensaje: "Usuario deslogueado correctamente" });
        } else {
          res.status(404).json({ mensaje: "Usuario no encontrado" });
        }
      }
    });
  },

  obtenerRoles: (req, res) => {
    Usuario.obtenerRoles((err, roles) => {
      if (err) throw err;
      res.json(roles);
    });
  },

  validarUsuarioLogin: (req, res) => {
    const correo = req.query.correo;
    const contrasena = req.query.contrasena;
    const ip_address = req.query.ip_address;
    const user_agent = req.query.user_agent;

    Usuario.validarUsuarioLogin(
      correo,
      contrasena,
      ip_address,
      user_agent,
      (err, usuarios) => {
        if (err) {
          res.status(401).json("Error: Correo o contraseña incorrectos");
        } else {
          res.json(usuarios);
        }
      }
    );
  },
};

module.exports = usuariosController;
