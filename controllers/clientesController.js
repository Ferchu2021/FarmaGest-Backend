const Cliente = require("../models/clientesModel");

const clientesController = {
  obtenerClientes: (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 99;
    const search = req.query.search || "";
    const sesion = req.query.sesion;

    Cliente.obtenerClientes(page, pageSize, search, sesion, (err, clientes) => {
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
    const { nombre, apellido, dni, obra_social_id, ciudad_id, usuario_id } =
      req.body;
    const nuevoCliente = new Cliente(
      nombre,
      apellido,
      dni,
      obra_social_id,
      ciudad_id
    );

    Cliente.agregarCliente(nuevoCliente, usuario_id, (err, resultado) => {
      if (err) {
        console.error("Error al agregar cliente:", err);
        res.status(500).json({ mensaje: "Error al agregar cliente" });
      } else {
        res.status(201).json({
          mensaje: "Cliente agregado correctamente",
          cliente_id: resultado.insertId,
        });
      }
    });
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
