const Producto = require("../models/productosModel");

const productosController = {
  obtenerProductos: (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 99;
    const search = req.query.search || "";
    const sesion = req.query.sesion;

    Producto.obtenerProductos(
      page,
      pageSize,
      search,
      sesion,
      (err, productos) => {
        if (err) {
          console.error("Error al obtener productos:", err);
          res.status(500).json({ mensaje: "Error al obtener productos" });
        } else {
          // PostgreSQL devuelve { rows: [...], ... }, MySQL devuelve array directamente
          const rows = productos.rows || productos;
          res.json(rows);
        }
      }
    );
  },

  agregarProducto: (req, res) => {
    const { nombre, codigo, marca, categoria_id, stock, precio, usuario_id } =
      req.body;

    const nuevoProducto = new Producto(
      nombre,
      codigo,
      marca,
      categoria_id,
      stock,
      precio
    );

    Producto.agregarProducto(nuevoProducto, usuario_id, (err, resultado) => {
      if (err) {
        console.error("Error al agregar producto:", err);
        res.status(500).json({ mensaje: "Error al agregar producto" });
      } else {
        res.status(201).json({
          mensaje: "Producto agregado correctamente",
          producto_id: resultado.id,
        });
      }
    });
  },

  actualizarProducto: (req, res) => {
    const editarProducto = req.body;
    Producto.actualizarProducto(
      req.params.id,
      editarProducto,
      (err, producto) => {
        if (err) {
          console.error("Error al actualizar producto:", err);
          res.status(500).json({ mensaje: "Error al actualizar producto" });
        } else {
          res.json(producto);
        }
      }
    );
  },

  eliminarProducto: (req, res) => {
    const productoID = req.params.id;
    const usuario_id = req.body.usuario_id;
    const productoNombre = req.body.Nombre;
    const productoCodigo = req.body.Codigo;

    Producto.eliminarProducto(
      productoID,
      usuario_id,
      productoNombre,
      productoCodigo,
      (err, resultado) => {
        if (err) {
          console.error("Error al eliminar producto:", err);
          res.status(500).json({ mensaje: "Error al eliminar producto" });
        } else {
          if (resultado.affectedRows > 0) {
            res.json({ mensaje: "Producto eliminado correctamente" });
          } else {
            res.status(404).json({ mensaje: "Producto no encontrado" });
          }
        }
      }
    );
  },

  obtenerCategorias: (req, res) => {
    Producto.obtenerCategorias((err, categorias) => {
      if (err) {
        console.error("Error al obtener categorías:", err);
        res.status(500).json({ mensaje: "Error al obtener categorías" });
      } else {
        // PostgreSQL devuelve { rows: [...], ... }, MySQL devuelve array directamente
        const rows = categorias.rows || categorias;
        res.json(rows);
      }
    });
  },

  obtenerFiltros: (req, res) => {
    Producto.obtenerFiltros((err, filtros) => {
      if (err) {
        console.error("Error al obtener filtros:", err);
        res.status(500).json({ mensaje: "Error al obtener filtros" });
      } else {
        res.json(filtros);
      }
    });
  },
};

module.exports = productosController;
