const Producto = require("../models/productosModel");

const productosController = {
  obtenerProductos: (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 99;
    const search = req.query.search || "";
    const sesion = req.query.sesion;
    const marca = req.query.marca || null;
    const proveedorId = req.query.proveedorId || null;

    Producto.obtenerProductos(
      page,
      pageSize,
      search,
      sesion,
      marca,
      proveedorId,
      (err, productos) => {
        if (err) {
          console.error("Error al obtener productos:", err);
          res.status(500).json({ mensaje: "Error al obtener productos" });
        } else {
          // PostgreSQL devuelve { rows: [...], ... }, MySQL devuelve array directamente
          const rows = productos.rows || productos;
          // Asegurarse de que rows es un array
          if (Array.isArray(rows)) {
            res.json(rows);
          } else {
            console.error("Error: productos no es un array:", typeof productos, productos);
            res.status(500).json({ mensaje: "Error: formato de respuesta inválido" });
          }
        }
      }
    );
  },

  agregarProducto: (req, res) => {
    try {
      const { 
        nombre, 
        codigo, 
        marca, 
        categoria_id, 
        stock, 
        precio, 
        usuario_id, 
        proveedor_id,
        precio_compra_base,
        es_medicamento,
        porcentaje_iva
      } = req.body;

      console.log("agregarProducto - Datos recibidos (raw):", JSON.stringify(req.body, null, 2));

      // Validar campos requeridos
      if (!nombre || nombre.trim() === "") {
        return res.status(400).json({ 
          mensaje: "El nombre del producto es requerido",
          error: "VALIDATION_ERROR"
        });
      }

      // Validar y parsear precio
      let precioParsed = 0;
      if (precio !== undefined && precio !== null && precio !== "") {
        precioParsed = parseFloat(String(precio).replace(",", "."));
        if (isNaN(precioParsed) || precioParsed < 0) {
          return res.status(400).json({ 
            mensaje: "El precio debe ser un número válido mayor o igual a 0",
            error: "VALIDATION_ERROR"
          });
        }
      } else {
        return res.status(400).json({ 
          mensaje: "El precio es requerido",
          error: "VALIDATION_ERROR"
        });
      }

      // Parsear otros campos numéricos
      const stockParsed = stock !== undefined && stock !== null ? parseInt(stock) : 0;
      const categoriaIdParsed = (categoria_id && categoria_id !== "" && categoria_id !== "0") ? parseInt(categoria_id) : null;
      const proveedorIdParsed = (proveedor_id && proveedor_id !== "" && proveedor_id !== "0") ? parseInt(proveedor_id) : null;
      const usuarioIdParsed = usuario_id ? parseInt(usuario_id) : 1; // Default a 1 si no se proporciona

      console.log("agregarProducto - Datos parseados:", {
        nombre: nombre.trim(),
        codigo: codigo || null,
        marca: marca || null,
        categoria_id: categoriaIdParsed,
        stock: stockParsed,
        precio: precioParsed,
        usuario_id: usuarioIdParsed,
        proveedor_id: proveedorIdParsed,
        precio_compra_base: precio_compra_base || null,
        es_medicamento: es_medicamento || false,
        porcentaje_iva: porcentaje_iva || 21,
      });

      const nuevoProducto = new Producto(
        nombre.trim(),
        codigo || null,
        marca || null,
        categoriaIdParsed,
        stockParsed,
        precioParsed
      );
      nuevoProducto.proveedor_id = proveedorIdParsed;
      nuevoProducto.precio_compra_base = precio_compra_base ? parseFloat(String(precio_compra_base).replace(",", ".")) : null;
      nuevoProducto.es_medicamento = es_medicamento === true || es_medicamento === "true";
      nuevoProducto.porcentaje_iva = porcentaje_iva ? parseFloat(String(porcentaje_iva).replace(",", ".")) : 21;

      Producto.agregarProducto(nuevoProducto, usuarioIdParsed, (err, resultado) => {
        if (err) {
          console.error("Error al agregar producto:", err);
          console.error("Detalles del error:", {
            message: err.message,
            code: err.code,
            detail: err.detail,
            hint: err.hint,
          });
          return res.status(500).json({ 
            mensaje: "Error al agregar producto",
            error: err.message || "INTERNAL_SERVER_ERROR"
          });
        } else {
          // PostgreSQL devuelve { id, ...nuevoProducto } desde el modelo
          res.status(201).json({
            mensaje: "Producto agregado correctamente",
            producto_id: resultado.id || resultado.producto_id,
          });
        }
      });
    } catch (error) {
      console.error("Error inesperado en agregarProducto:", error);
      res.status(500).json({ 
        mensaje: "Error interno del servidor",
        error: error.message || "INTERNAL_SERVER_ERROR"
      });
    }
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
