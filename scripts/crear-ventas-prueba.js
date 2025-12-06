const db = require("../db.js");

console.log("🔧 Creando 30 ventas de prueba...\n");

// Obtener datos necesarios
Promise.all([
  db.query("SELECT cliente_id, nombre, apellido FROM clientes WHERE deleted_at IS NULL LIMIT 10", []),
  db.query("SELECT usuario_id, nombre FROM usuarios LIMIT 5", []),
  db.query("SELECT producto_id, nombre, precio, stock FROM productos WHERE deleted_at IS NULL AND stock > 0 LIMIT 20", [])
]).then(([clientesResult, usuariosResult, productosResult]) => {
  const clientes = (clientesResult.rows || clientesResult || []).map(c => ({
    cliente_id: c.cliente_id,
    nombre: c.nombre,
    apellido: c.apellido
  }));
  
  const usuarios = (usuariosResult.rows || usuariosResult || []).map(u => ({
    usuario_id: u.usuario_id,
    nombre: u.nombre
  }));
  
  const productos = (productosResult.rows || productosResult || []).map(p => ({
    producto_id: p.producto_id,
    nombre: p.nombre,
    precio: parseFloat(p.precio) || 0,
    stock: parseInt(p.stock) || 0
  }));

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

  // Generar 30 ventas
  const ventas = [];
  const fechaBase = new Date();
  fechaBase.setMonth(fechaBase.getMonth() - 2); // Hace 2 meses

  for (let i = 0; i < 30; i++) {
    const cliente = clientes[Math.floor(Math.random() * clientes.length)];
    const usuario = usuarios[Math.floor(Math.random() * usuarios.length)];
    
    // Fecha aleatoria en los últimos 2 meses
    const diasAtras = Math.floor(Math.random() * 60);
    const fecha = new Date(fechaBase);
    fecha.setDate(fecha.getDate() + diasAtras);
    fecha.setHours(Math.floor(Math.random() * 12) + 8); // Entre 8 y 20 horas
    fecha.setMinutes(Math.floor(Math.random() * 60));

    // Crear items aleatorios (1 a 5 productos por venta)
    const numItems = Math.floor(Math.random() * 5) + 1;
    const itemsVenta = [];
    let totalSinDescuento = 0;

    const productosUsados = new Set();
    for (let j = 0; j < numItems && productosUsados.size < productos.length; j++) {
      let producto;
      do {
        producto = productos[Math.floor(Math.random() * productos.length)];
      } while (productosUsados.has(producto.producto_id) && productosUsados.size < productos.length);

      if (!productosUsados.has(producto.producto_id)) {
        productosUsados.add(producto.producto_id);
        const cantidad = Math.min(Math.floor(Math.random() * 5) + 1, producto.stock);
        const precioUnitario = producto.precio;
        const totalItem = precioUnitario * cantidad;
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

    // Descuento aleatorio (0% a 30%)
    const descuentoPorcentaje = Math.floor(Math.random() * 31);
    const descuento = (totalSinDescuento * descuentoPorcentaje) / 100;
    const total = totalSinDescuento - descuento;

    // Número de factura (formato: 000000001, 000000002, etc.)
    const numeroFactura = (i + 1).toString().padStart(9, '0');

    ventas.push({
      cliente_id: cliente.cliente_id,
      usuario_id: usuario.usuario_id,
      fecha_hora: fecha.toISOString().replace('T', ' ').substring(0, 19),
      numero_factura: numeroFactura,
      total: parseFloat(total.toFixed(2)),
      total_sin_descuento: parseFloat(totalSinDescuento.toFixed(2)),
      descuento: parseFloat(descuento.toFixed(2)),
      items: itemsVenta
    });
  }

  // Crear ventas en la base de datos
  let creadas = 0;
  let index = 0;

  function crearVenta() {
    if (index >= ventas.length) {
      console.log(`\n✅ ${creadas} ventas creadas exitosamente\n`);
      console.log("=".repeat(60));
      console.log("✅ VENTAS DE PRUEBA CREADAS EXITOSAMENTE");
      console.log("=".repeat(60));
      process.exit(0);
    }

    const venta = ventas[index];

    // Usar método de transacción del db
    db.transaction(async (client) => {
      try {
        // Insertar venta
        const ventaResult = await client.query(
          `INSERT INTO ventas (cliente_id, usuario_id, fecha_hora, numero_factura, total, total_sin_descuento, descuento)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING venta_id`,
          [
            venta.cliente_id,
            venta.usuario_id,
            venta.fecha_hora,
            venta.numero_factura,
            venta.total,
            venta.total_sin_descuento,
            venta.descuento
          ]
        );

        const ventaId = ventaResult.rows[0].venta_id;

        // Insertar items de venta
        if (venta.items.length > 0) {
          for (const item of venta.items) {
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
          }
        }

        console.log(`✅ Venta ${index + 1} creada: Factura ${venta.numero_factura} - $${venta.total.toFixed(2)} (${venta.items.length} items)`);
        creadas++;
        index++;
        crearVenta();
      } catch (err) {
        console.error(`❌ Error al crear venta ${index + 1}:`, err.message);
        index++;
        crearVenta();
      }
    });
  }

  console.log("📦 Creando ventas...\n");
  crearVenta();
}).catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});

