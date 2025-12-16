const Cliente = require("../models/clientesModel");

const clientesController = {
  obtenerClientes: (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 99;
    const search = req.query.search || "";
    const sesion = req.query.sesion;
    const obraSocialID = req.query.obraSocialID ? parseInt(req.query.obraSocialID) : 0;
    const ciudadID = req.query.ciudadID ? parseInt(req.query.ciudadID) : 0;

    Cliente.obtenerClientes(page, pageSize, search, sesion, obraSocialID, ciudadID, (err, clientes) => {
      if (err) {
        console.error("Error al obtener clientes:", err);
        res.status(500).json({ mensaje: "Error al obtener clientes" });
      } else {
        // PostgreSQL devuelve { rows: [...], ... }, MySQL devuelve array directamente
        const rows = clientes.rows || clientes;
        // Asegurarse de que rows es un array
        if (Array.isArray(rows)) {
          res.json(rows);
        } else {
          console.error("Error: clientes no es un array:", typeof clientes, clientes);
          res.status(500).json({ mensaje: "Error: formato de respuesta inválido" });
        }
      }
    });
  },

  agregarCliente: (req, res) => {
    try {
      const { nombre, apellido, dni, obra_social_id, ciudad_id, usuario_id } =
        req.body;

      console.log("agregarCliente - Datos recibidos:", {
        nombre,
        apellido,
        dni,
        obra_social_id,
        ciudad_id,
        usuario_id,
      });

      // Validar campos requeridos
      if (!nombre || nombre.trim() === "") {
        return res.status(400).json({ 
          mensaje: "El nombre es requerido",
          error: "VALIDATION_ERROR"
        });
      }

      if (!apellido || apellido.trim() === "") {
        return res.status(400).json({ 
          mensaje: "El apellido es requerido",
          error: "VALIDATION_ERROR"
        });
      }

      if (!dni || dni.trim() === "") {
        return res.status(400).json({ 
          mensaje: "El DNI es requerido",
          error: "VALIDATION_ERROR"
        });
      }

      // Parsear valores
      const obraSocialIdParsed = (obra_social_id && obra_social_id !== "" && obra_social_id !== "0") ? parseInt(obra_social_id) : null;
      const ciudadIdParsed = (ciudad_id && ciudad_id !== "" && ciudad_id !== "0") ? parseInt(ciudad_id) : null;
      const usuarioIdParsed = usuario_id ? parseInt(usuario_id) : 1;

      console.log("agregarCliente - Datos parseados:", {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        dni: dni.trim(),
        obra_social_id: obraSocialIdParsed,
        ciudad_id: ciudadIdParsed,
        usuario_id: usuarioIdParsed,
      });

      const nuevoCliente = new Cliente(
        nombre.trim(),
        apellido.trim(),
        dni.trim(),
        obraSocialIdParsed,
        ciudadIdParsed
      );

      Cliente.agregarCliente(nuevoCliente, usuarioIdParsed, (err, resultado) => {
        if (err) {
          console.error("Error al agregar cliente:", err);
          console.error("Detalles del error:", {
            message: err.message,
            code: err.code,
            detail: err.detail,
            hint: err.hint,
            constraint: err.constraint,
          });
          
          // Manejar errores específicos
          if (err.code === '23505') {
            // Violación de restricción única (DNI duplicado)
            return res.status(409).json({ 
              mensaje: "El DNI ya está registrado",
              error: "DUPLICATE_DNI"
            });
          }
          
          return res.status(500).json({ 
            mensaje: err.detail || err.message || "Error al agregar cliente",
            error: err.code || "INTERNAL_SERVER_ERROR"
          });
        } else {
          console.log("Cliente agregado exitosamente:", resultado);
          res.status(201).json({
            mensaje: "Cliente agregado correctamente",
            cliente_id: resultado.id || resultado.cliente_id || resultado.insertId,
          });
        }
      });
    } catch (error) {
      console.error("Error inesperado en agregarCliente:", error);
      res.status(500).json({ 
        mensaje: "Error interno del servidor",
        error: error.message || "INTERNAL_SERVER_ERROR"
      });
    }
  },

  actualizarCliente: (req, res) => {
    const editarCliente = req.body;
    Cliente.actualizarCliente(req.params.id, editarCliente, (err, cliente) => {
      if (err) throw err;
      res.json(cliente);
    });
  },

  eliminarCliente: (req, res) => {
    const clienteID = req.params.id;
    const usuario_id = req.body.usuario_id;
    const clienteNombre = req.body.Nombre;
    const clienteApellido = req.body.Apellido;

    Cliente.eliminarCliente(
      clienteID,
      usuario_id,
      clienteNombre,
      clienteApellido,
      (err, resultado) => {
        if (err) {
          console.error("Error al eliminar cliente:", err);
          res.status(500).json({ mensaje: "Error al eliminar cliente" });
        } else {
          if (resultado.affectedRows > 0) {
            res.json({ mensaje: "Cliente eliminado correctamente" });
          } else {
            res.status(404).json({ mensaje: "Cliente no encontrado" });
          }
        }
      }
    );
  },

  obtenerObrasSociales: (req, res) => {
    Cliente.obtenerObrasSociales((err, obrasSociales) => {
      if (err) {
        console.error("Error al obtener obras sociales:", err);
        res.status(500).json({ mensaje: "Error al obtener obras sociales" });
      } else {
        // PostgreSQL devuelve { rows: [...], ... }, MySQL devuelve array directamente
        const rows = obrasSociales.rows || obrasSociales;
        res.json(rows);
      }
    });
  },

  obtenerCiudades: (req, res) => {
    Cliente.obtenerCiudades((err, ciudades) => {
      if (err) {
        console.error("Error al obtener ciudades:", err);
        res.status(500).json({ mensaje: "Error al obtener ciudades" });
      } else {
        // PostgreSQL devuelve { rows: [...], ... }, MySQL devuelve array directamente
        const rows = ciudades.rows || ciudades;
        res.json(rows);
      }
    });
  },
};

module.exports = clientesController;
