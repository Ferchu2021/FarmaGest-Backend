/**
 * Script para crear 20 ventas recientes de prueba para FarmaGest
 * Las ventas se crearán con fechas recientes para que sean visibles
 */
require("dotenv").config();
const db = require("../db");

console.log("🛒 Creando 20 ventas recientes de prueba...\n");

// Función para obtener datos necesarios
function obtenerDatos(callback) {
  Promise.all([
    new Promise((resolve, reject) => {
      db.query(
        "SELECT cliente_id, nombre, apellido FROM clientes WHERE deleted_at IS NULL LIMIT 20",
        [],
        (err, result) => {
          if (err) return reject(err);
          const rows = result.rows || result || [];
          resolve(rows.map(c => ({
            cliente_id: c.cliente_id,
            nombre: c.nombre,
            apellido: c.apellido
          })));
        }
      );
    }),
    new Promise((resolve, reject) => {
      db.query(
        "SELECT usuario_id, nombre, apellido FROM usuarios WHERE estado = true LIMIT 10",
        [],
        (err, result) => {
          if (err) return reject(err);
          const rows = result.rows || result || [];
          resolve(rows.map(u => ({
            usuario_id: u.usuario_id,
            nombre: u.nombre || u.correo || 'Usuario'
          })));
        }
      );
    }),
    new Promise((resolve, reject) => {
      db.query(
        "SELECT producto_id, nombre, precio, stock FROM productos WHERE deleted_at IS NULL AND stock > 0 LIMIT 50",
        [],
        (err, result) => {
          if (err) return reject(err);
          const rows = result.rows || result || [];
          resolve(rows.map(p => ({
            producto_id: p.producto_id,
            nombre: p.nombre,
            precio: parseFloat(p.precio) || parseFloat(p.Precio) || 1000,
            stock: parseInt(p.stock) || parseInt(p.Stock) || 0
          })).filter(p => p.stock > 0));
        }
      );
    })
  ]).then(([clientes, usuarios, productos]) => {
    callback(null, { clientes, usuarios, productos });
  }).catch(err => {
    callback(err, null);
  });
}

// Función para generar número de factura único
function generarNumeroFactura(ultimoNumero) {
  const siguiente = (ultimoNumero || 0) + 1;
  return siguiente.toString().padStart(9, '0');
}

// Función para crear una venta con sus items
function crearVenta(venta, callback) {
  db.transaction(async (client) => {
    try {
      // 1. Insertar la venta
      const ventaResult = await client.query(
        `INSERT INTO ventas (cliente_id, usuario_id, fecha_hora, total, total_sin_descuento, descuento, numero_factura, metodo_pago)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING venta_id`,
        [
          venta.cliente_id,
          venta.usuario_id,
          venta.fecha_hora,
          venta.total,
          venta.total_sin_descuento,
          venta.descuento || 0,
          venta.numero_factura,
          venta.metodo_pago || 'Efectivo'
        ]
      );

      const ventaId = ventaResult.rows[0].venta_id;

      // 2. Insertar items y actualizar stock
      for (const item of venta.items) {
        // Verificar stock
        const stockResult = await client.query(
          "SELECT stock FROM productos WHERE producto_id = $1",
          [item.producto_id]
        );

        if (stockResult.rows.length === 0) {
          throw new Error(`Producto ID ${item.producto_id} no encontrado`);
        }

        const stockDisponible = parseInt(stockResult.rows[0].stock);
        if (stockDisponible < item.cantidad) {
          throw new Error(`Stock insuficiente para producto ID ${item.producto_id}. Disponible: ${stockDisponible}, Solicitado: ${item.cantidad}`);
        }

        // Insertar item de venta
        await client.query(
          `INSERT INTO items_venta (venta_id, producto_id, cantidad, precio_unitario, total_item)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            ventaId,
            item.producto_id,
            item.cantidad,
            item.precio_unitario,
            item.total_item
          ]
        );

        // Actualizar stock
        await client.query(
          `UPDATE productos SET stock = stock - $1 WHERE producto_id = $2`,
          [item.cantidad, item.producto_id]
        );
      }

      callback(null, ventaId);
    } catch (err) {
      callback(err, null);
      throw err;
    }
  });
}

// Función principal
function main() {
  obtenerDatos((err, datos) => {
    if (err) {
      console.error("❌ Error al obtener datos:", err.message);
      process.exit(1);
    }

    const { clientes, usuarios, productos } = datos;

    if (clientes.length === 0) {
      console.error("❌ No hay clientes en la base de datos. Crea clientes primero.");
      process.exit(1);
    }

    if (usuarios.length === 0) {
      console.error("❌ No hay usuarios en la base de datos. Crea usuarios primero.");
      process.exit(1);
    }

    if (productos.length === 0) {
      console.error("❌ No hay productos con stock en la base de datos. Crea productos primero.");
      process.exit(1);
    }

    console.log(`✅ Datos disponibles:`);
    console.log(`   - Clientes: ${clientes.length}`);
    console.log(`   - Usuarios: ${usuarios.length}`);
    console.log(`   - Productos: ${productos.length}\n`);

    // Obtener último número de factura
    db.query(
      "SELECT numero_factura FROM ventas WHERE numero_factura IS NOT NULL ORDER BY CAST(numero_factura AS INTEGER) DESC LIMIT 1",
      [],
      (err, result) => {
        let ultimoNumero = 0;
        if (!err && result.rows && result.rows.length > 0) {
          ultimoNumero = parseInt(result.rows[0].numero_factura) || 0;
        }

        // Generar 20 ventas con fechas RECIENTES (últimos 7 días)
        const ventas = [];
        const hoy = new Date();
        
        const metodosPago = ['Efectivo', 'Tarjeta de Débito', 'Tarjeta de Crédito', 'Transferencia'];

        for (let i = 0; i < 20; i++) {
          const cliente = clientes[Math.floor(Math.random() * clientes.length)];
          const usuario = usuarios[Math.floor(Math.random() * usuarios.length)];

          // Fecha aleatoria en los últimos 7 días
          const diasAtras = Math.floor(Math.random() * 7);
          const fecha = new Date(hoy);
          fecha.setDate(fecha.getDate() - diasAtras);
          fecha.setHours(Math.floor(Math.random() * 12) + 8); // Entre 8 y 20 horas
          fecha.setMinutes(Math.floor(Math.random() * 60));
          fecha.setSeconds(Math.floor(Math.random() * 60));

          // Crear items aleatorios (1 a 4 productos por venta)
          const numItems = Math.floor(Math.random() * 4) + 1;
          const itemsVenta = [];
          let totalSinDescuento = 0;

          const productosUsados = new Set();
          for (let j = 0; j < numItems; j++) {
            let producto;
            let intentos = 0;
            do {
              producto = productos[Math.floor(Math.random() * productos.length)];
              intentos++;
            } while (productosUsados.has(producto.producto_id) && intentos < productos.length * 2);

            if (!productosUsados.has(producto.producto_id) && producto.stock > 0 && producto.precio > 0) {
              productosUsados.add(producto.producto_id);
              const cantidad = Math.min(Math.floor(Math.random() * 3) + 1, Math.min(producto.stock, 5));
              const precioUnitario = producto.precio;
              const totalItem = parseFloat((precioUnitario * cantidad).toFixed(2));
              totalSinDescuento += totalItem;

              itemsVenta.push({
                producto_id: producto.producto_id,
                cantidad: cantidad,
                precio_unitario: precioUnitario,
                total_item: totalItem,
                producto_nombre: producto.nombre
              });
            }
          }

          if (itemsVenta.length === 0) {
            continue; // Saltar esta venta si no hay items
          }

          // Descuento aleatorio (0% a 20%)
          const descuentoPorcentaje = Math.floor(Math.random() * 21);
          const descuento = parseFloat(((totalSinDescuento * descuentoPorcentaje) / 100).toFixed(2));
          const total = parseFloat((totalSinDescuento - descuento).toFixed(2));

          // Número de factura
          ultimoNumero++;
          const numeroFactura = generarNumeroFactura(ultimoNumero - 1);

          ventas.push({
            cliente_id: cliente.cliente_id,
            usuario_id: usuario.usuario_id,
            fecha_hora: fecha.toISOString().replace('T', ' ').substring(0, 19),
            numero_factura: numeroFactura,
            total: total,
            total_sin_descuento: parseFloat(totalSinDescuento.toFixed(2)),
            descuento: descuento,
            metodo_pago: metodosPago[Math.floor(Math.random() * metodosPago.length)],
            items: itemsVenta
          });
        }

        if (ventas.length === 0) {
          console.error("❌ No se pudieron generar ventas. Verifica que haya productos con stock disponible.");
          process.exit(1);
        }

        console.log(`📦 Creando ${ventas.length} ventas con fechas recientes...\n`);

        // Crear ventas una por una
        let creadas = 0;
        let index = 0;

        function procesarSiguiente() {
          if (index >= ventas.length) {
            console.log(`\n${"=".repeat(60)}`);
            console.log(`✅ PROCESO COMPLETADO`);
            console.log(`${"=".repeat(60)}`);
            console.log(`   - Ventas creadas: ${creadas}`);
            console.log(`   - Ventas fallidas: ${ventas.length - creadas}`);
            console.log(`\n💡 Las ventas tienen fechas de los últimos 7 días para mayor visibilidad\n`);
            process.exit(0);
          }

          const venta = ventas[index];
          index++;

          crearVenta(venta, (err, ventaId) => {
            if (err) {
              console.error(`❌ [${index}/${ventas.length}] Error al crear venta Factura ${venta.numero_factura}:`, err.message);
            } else {
              const fechaFormateada = new Date(venta.fecha_hora).toLocaleDateString('es-AR');
              console.log(`✅ [${index}/${ventas.length}] Venta creada: Factura ${venta.numero_factura} - $${venta.total.toFixed(2)} (${venta.items.length} items) - ${fechaFormateada}`);
              creadas++;
            }
            procesarSiguiente();
          });
        }

        procesarSiguiente();
      }
    );
  });
}

// Iniciar
main();

