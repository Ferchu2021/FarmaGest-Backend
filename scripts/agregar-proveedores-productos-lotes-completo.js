/**
 * Script completo para agregar proveedores, productos con precios calculados y lotes
 */
require("dotenv").config();
const db = require("../db");

console.log("🏢 Creando proveedores, productos y lotes...\n");

// Función auxiliar para calcular precio de venta
function calcularPrecioVenta(precioCompraBase, esMedicamento, porcentajeIVA = 21) {
  const porcentajeGanancia = esMedicamento ? 25 : 30;
  const precioConGanancia = precioCompraBase * (1 + porcentajeGanancia / 100);
  const precioFinal = precioConGanancia * (1 + porcentajeIVA / 100);
  return Math.round(precioFinal * 100) / 100;
}

// Función auxiliar para generar número de lote
function generarNumeroLote() {
  const prefijo = ['LOT', 'BATCH', 'LOTE', 'PROD'][Math.floor(Math.random() * 4)];
  const numero = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
  return `${prefijo}-${numero}`;
}

// Nuevos proveedores
const proveedores = [
  // Laboratorios farmacéuticos
  {
    razon_social: "Laboratorios Bago S.A.",
    direccion: "Av. Corrientes 3835, C1193AAE CABA, Buenos Aires",
    telefono: "011-4864-2000",
    email: "ventas@bago.com.ar",
  },
  {
    razon_social: "Laboratorios Elea Phoenix S.A.",
    direccion: "Av. Rivadavia 5599, C1406GEN CABA, Buenos Aires",
    telefono: "011-4633-8000",
    email: "contacto@elea.com",
  },
  {
    razon_social: "Laboratorios Roemmers S.A.",
    direccion: "Av. Gral. Paz 5445, C1430BFN CABA, Buenos Aires",
    telefono: "011-4521-8400",
    email: "info@roemmers.com.ar",
  },
  {
    razon_social: "GlaxoSmithKline Argentina S.A.",
    direccion: "Av. Dr. Honorio Pueyrredón 344, C1414ARO CABA",
    telefono: "011-4857-7000",
    email: "argentina@gsk.com",
  },
  {
    razon_social: "Pfizer S.R.L.",
    direccion: "Av. del Libertador 6390, C1428ART CABA",
    telefono: "011-4704-2000",
    email: "argentina@pfizer.com",
  },
  // Suplementos y vitaminas
  {
    razon_social: "Bagovit Suplementos S.A.",
    direccion: "Av. Córdoba 4567, C1425BGQ CABA",
    telefono: "011-4823-1500",
    email: "suplementos@bagovit.com.ar",
  },
  {
    razon_social: "Omnilife Argentina S.A.",
    direccion: "Av. Santa Fe 2450, C1425BFG CABA",
    telefono: "011-4772-8000",
    email: "argentina@omnilife.com",
  },
  // Cosmética y cuidado personal
  {
    razon_social: "Natura Cosméticos S.A.",
    direccion: "Av. del Libertador 1850, C1112AAP CABA",
    telefono: "011-4780-5000",
    email: "argentina@natura.net",
  },
  {
    razon_social: "L'Oréal Argentina S.A.",
    direccion: "Av. Leandro N. Alem 1050, C1001AAS CABA",
    telefono: "011-4314-5000",
    email: "argentina@loreal.com",
  },
  {
    razon_social: "Unilever Argentina S.A.",
    direccion: "Ruta Panamericana Km 37.5, 1619 Garín, Buenos Aires",
    telefono: "011-4349-0000",
    email: "argentina@unilever.com",
  },
  // Material médico y primeros auxilios
  {
    razon_social: "Tyco Healthcare Argentina S.A.",
    direccion: "Av. del Libertador 1250, C1012AAV CABA",
    telefono: "011-4787-8000",
    email: "argentina@tycohealthcare.com",
  },
  {
    razon_social: "3M Argentina S.A.",
    direccion: "Av. del Libertador 1050, C1012AAU CABA",
    telefono: "011-4788-3000",
    email: "argentina@3m.com",
  },
];

// Productos a crear
const productos = [
  // Medicamentos
  { nombre: "Ibuprofeno 600mg", codigo: "IBU-600-30", marca: "Bago", categoria: "Medicamentos", esMedicamento: true, precioCompraBase: 850.00, porcentajeIVA: 21, stock: 150, proveedor: "Laboratorios Bago S.A." },
  { nombre: "Paracetamol 500mg", codigo: "PAR-500-30", marca: "Bago", categoria: "Medicamentos", esMedicamento: true, precioCompraBase: 520.00, porcentajeIVA: 21, stock: 200, proveedor: "Laboratorios Bago S.A." },
  { nombre: "Omeprazol 20mg", codigo: "OME-20-28", marca: "Elea", categoria: "Medicamentos", esMedicamento: true, precioCompraBase: 1200.00, porcentajeIVA: 21, stock: 120, proveedor: "Laboratorios Elea Phoenix S.A." },
  { nombre: "Amoxicilina 500mg", codigo: "AMO-500-21", marca: "Roemmers", categoria: "Medicamentos", esMedicamento: true, precioCompraBase: 1850.00, porcentajeIVA: 21, stock: 80, proveedor: "Laboratorios Roemmers S.A." },
  { nombre: "Loratadina 10mg", codigo: "LOR-10-12", marca: "GSK", categoria: "Medicamentos", esMedicamento: true, precioCompraBase: 980.00, porcentajeIVA: 21, stock: 100, proveedor: "GlaxoSmithKline Argentina S.A." },
  { nombre: "Aspirina 100mg", codigo: "ASP-100-30", marca: "Bayer", categoria: "Medicamentos", esMedicamento: true, precioCompraBase: 650.00, porcentajeIVA: 21, stock: 180, proveedor: "Laboratorios Bago S.A." },
  { nombre: "Diclofenac 50mg", codigo: "DIC-50-20", marca: "Elea", categoria: "Medicamentos", esMedicamento: true, precioCompraBase: 950.00, porcentajeIVA: 21, stock: 90, proveedor: "Laboratorios Elea Phoenix S.A." },
  { nombre: "Metformina 850mg", codigo: "MET-850-30", marca: "Bago", categoria: "Medicamentos", esMedicamento: true, precioCompraBase: 1420.00, porcentajeIVA: 21, stock: 75, proveedor: "Laboratorios Bago S.A." },
  { nombre: "Azitromicina 500mg", codigo: "AZI-500-6", marca: "Pfizer", categoria: "Medicamentos", esMedicamento: true, precioCompraBase: 2100.00, porcentajeIVA: 21, stock: 60, proveedor: "Pfizer S.R.L." },
  { nombre: "Losartán 50mg", codigo: "LOS-50-30", marca: "Roemmers", categoria: "Medicamentos", esMedicamento: true, precioCompraBase: 1650.00, porcentajeIVA: 21, stock: 85, proveedor: "Laboratorios Roemmers S.A." },
  
  // Suplementos
  { nombre: "Vitamina D3 2000 UI", codigo: "VIT-D3-60", marca: "Bagovit", categoria: "Suplementos", esMedicamento: false, precioCompraBase: 2800.00, porcentajeIVA: 21, stock: 120, proveedor: "Bagovit Suplementos S.A." },
  { nombre: "Vitamina C 1000mg", codigo: "VIT-C-60", marca: "Bagovit", categoria: "Suplementos", esMedicamento: false, precioCompraBase: 1900.00, porcentajeIVA: 21, stock: 150, proveedor: "Bagovit Suplementos S.A." },
  { nombre: "Omega 3 1000mg", codigo: "OMG-3-60", marca: "Omnilife", categoria: "Suplementos", esMedicamento: false, precioCompraBase: 3200.00, porcentajeIVA: 21, stock: 100, proveedor: "Omnilife Argentina S.A." },
  { nombre: "Hierro + Ácido Fólico", codigo: "HIER-FOL-30", marca: "Bagovit", categoria: "Suplementos", esMedicamento: false, precioCompraBase: 1450.00, porcentajeIVA: 21, stock: 130, proveedor: "Bagovit Suplementos S.A." },
  { nombre: "Calcio + Vitamina D", codigo: "CAL-D-60", marca: "Omnilife", categoria: "Suplementos", esMedicamento: false, precioCompraBase: 2450.00, porcentajeIVA: 21, stock: 95, proveedor: "Omnilife Argentina S.A." },
  { nombre: "Magnesio 400mg", codigo: "MAG-400-60", marca: "Bagovit", categoria: "Suplementos", esMedicamento: false, precioCompraBase: 1650.00, porcentajeIVA: 21, stock: 110, proveedor: "Bagovit Suplementos S.A." },
  { nombre: "Probióticos 10 billones UFC", codigo: "PROB-10-30", marca: "Omnilife", categoria: "Suplementos", esMedicamento: false, precioCompraBase: 3800.00, porcentajeIVA: 21, stock: 70, proveedor: "Omnilife Argentina S.A." },
  { nombre: "Colágeno Hidrolizado", codigo: "COL-HID-60", marca: "Bagovit", categoria: "Suplementos", esMedicamento: false, precioCompraBase: 4200.00, porcentajeIVA: 21, stock: 80, proveedor: "Bagovit Suplementos S.A." },
  
  // Cosmética y cuidado personal
  { nombre: "Crema Hidratante Facial", codigo: "CREM-HID-50", marca: "Natura", categoria: "Cosmética", esMedicamento: false, precioCompraBase: 2800.00, porcentajeIVA: 21, stock: 60, proveedor: "Natura Cosméticos S.A." },
  { nombre: "Protector Solar FPS 50", codigo: "SOL-FPS50-200", marca: "Natura", categoria: "Cosmética", esMedicamento: false, precioCompraBase: 3200.00, porcentajeIVA: 21, stock: 75, proveedor: "Natura Cosméticos S.A." },
  { nombre: "Shampoo Anticaspa", codigo: "SHAM-AC-400", marca: "L'Oréal", categoria: "Cuidado Personal", esMedicamento: false, precioCompraBase: 1850.00, porcentajeIVA: 21, stock: 90, proveedor: "L'Oréal Argentina S.A." },
  { nombre: "Jabón Líquido Antibacterial", codigo: "JAB-ANTI-500", marca: "Unilever", categoria: "Cuidado Personal", esMedicamento: false, precioCompraBase: 950.00, porcentajeIVA: 21, stock: 150, proveedor: "Unilever Argentina S.A." },
  { nombre: "Desodorante Roll-on", codigo: "DES-ROL-50", marca: "Natura", categoria: "Cuidado Personal", esMedicamento: false, precioCompraBase: 1200.00, porcentajeIVA: 21, stock: 110, proveedor: "Natura Cosméticos S.A." },
  { nombre: "Crema Corporal", codigo: "CREM-CORP-400", marca: "L'Oréal", categoria: "Cosmética", esMedicamento: false, precioCompraBase: 2150.00, porcentajeIVA: 21, stock: 85, proveedor: "L'Oréal Argentina S.A." },
  
  // Material médico y primeros auxilios
  { nombre: "Vendas Elásticas 10cm", codigo: "VEN-ELAS-10", marca: "Tyco", categoria: "Primeros Auxilios", esMedicamento: false, precioCompraBase: 850.00, porcentajeIVA: 21, stock: 120, proveedor: "Tyco Healthcare Argentina S.A." },
  { nombre: "Gasas Estériles 10x10", codigo: "GAS-EST-10", marca: "Tyco", categoria: "Primeros Auxilios", esMedicamento: false, precioCompraBase: 650.00, porcentajeIVA: 21, stock: 200, proveedor: "Tyco Healthcare Argentina S.A." },
  { nombre: "Alcohol en Gel 500ml", codigo: "ALC-GEL-500", marca: "3M", categoria: "Primeros Auxilios", esMedicamento: false, precioCompraBase: 980.00, porcentajeIVA: 21, stock: 140, proveedor: "3M Argentina S.A." },
  { nombre: "Guantes de Látex Talla M", codigo: "GUA-LAT-M-100", marca: "Tyco", categoria: "Primeros Auxilios", esMedicamento: false, precioCompraBase: 1450.00, porcentajeIVA: 21, stock: 100, proveedor: "Tyco Healthcare Argentina S.A." },
  { nombre: "Tensoplast 5cm x 5m", codigo: "TEN-5-5M", marca: "3M", categoria: "Primeros Auxilios", esMedicamento: false, precioCompraBase: 1650.00, porcentajeIVA: 21, stock: 90, proveedor: "3M Argentina S.A." },
];

async function crearProveedoresProductosYLotes() {
  const client = await db.pool.connect();
  
  try {
    await client.query("BEGIN");

    console.log("=".repeat(70));
    console.log("PASO 1: CREAR PROVEEDORES");
    console.log("=".repeat(70));

    // 1. Crear proveedores
    const proveedoresMap = new Map();
    let proveedoresCreados = 0;
    let proveedoresExistentes = 0;

    for (const proveedor of proveedores) {
      // Verificar si ya existe
      const existe = await client.query(
        `SELECT proveedor_id FROM proveedores WHERE razon_social = $1`,
        [proveedor.razon_social]
      );

      if (existe.rows.length > 0) {
        proveedoresMap.set(proveedor.razon_social, existe.rows[0].proveedor_id);
        proveedoresExistentes++;
      } else {
        const result = await client.query(
          `INSERT INTO proveedores (razon_social, direccion, telefono, email)
           VALUES ($1, $2, $3, $4)
           RETURNING proveedor_id`,
          [proveedor.razon_social, proveedor.direccion, proveedor.telefono, proveedor.email]
        );
        proveedoresMap.set(proveedor.razon_social, result.rows[0].proveedor_id);
        proveedoresCreados++;
        console.log(`   ✅ Proveedor creado: ${proveedor.razon_social}`);
      }
    }

    console.log(`\n   📊 Resumen: ${proveedoresCreados} creados, ${proveedoresExistentes} ya existían\n`);

    // 2. Obtener categorías existentes o crear si no existen
    console.log("=".repeat(70));
    console.log("PASO 2: VERIFICAR CATEGORÍAS");
    console.log("=".repeat(70));

    const categoriasMap = new Map();
    const categoriasUnicas = [...new Set(productos.map(p => p.categoria))];

    for (const categoriaNombre of categoriasUnicas) {
      const existe = await client.query(
        `SELECT categoria_id FROM categorias WHERE nombre = $1`,
        [categoriaNombre]
      );

      if (existe.rows.length > 0) {
        categoriasMap.set(categoriaNombre, existe.rows[0].categoria_id);
      } else {
        const result = await client.query(
          `INSERT INTO categorias (nombre) VALUES ($1) RETURNING categoria_id`,
          [categoriaNombre]
        );
        categoriasMap.set(categoriaNombre, result.rows[0].categoria_id);
        console.log(`   ✅ Categoría creada: ${categoriaNombre}`);
      }
    }

    console.log(`\n   📊 Total de categorías: ${categoriasMap.size}\n`);

    // 3. Crear productos
    console.log("=".repeat(70));
    console.log("PASO 3: CREAR PRODUCTOS");
    console.log("=".repeat(70));

    let productosCreados = 0;
    let productosExistentes = 0;
    const productosMap = new Map();

    for (const producto of productos) {
      // Verificar si ya existe por código
      const existe = await client.query(
        `SELECT producto_id FROM productos WHERE codigo = $1 AND deleted_at IS NULL`,
        [producto.codigo]
      );

      if (existe.rows.length > 0) {
        productosMap.set(producto.codigo, existe.rows[0].producto_id);
        productosExistentes++;
        continue;
      }

      // Calcular precio de venta
      const precioVenta = calcularPrecioVenta(
        producto.precioCompraBase,
        producto.esMedicamento,
        producto.porcentajeIVA
      );

      const proveedorId = proveedoresMap.get(producto.proveedor);
      const categoriaId = categoriasMap.get(producto.categoria);

      const result = await client.query(
        `INSERT INTO productos (
          nombre, codigo, marca, categoria_id, stock, precio,
          proveedor_id, precio_compra_base, es_medicamento, porcentaje_iva
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING producto_id`,
        [
          producto.nombre,
          producto.codigo,
          producto.marca,
          categoriaId,
          producto.stock,
          precioVenta,
          proveedorId,
          producto.precioCompraBase,
          producto.esMedicamento,
          producto.porcentajeIVA,
        ]
      );

      const productoId = result.rows[0].producto_id;
      productosMap.set(producto.codigo, productoId);
      productosCreados++;

      console.log(`   ✅ Producto creado: ${producto.nombre} (ID: ${productoId})`);
      console.log(`      Precio Compra: $${producto.precioCompraBase.toFixed(2)} → Precio Venta: $${precioVenta.toFixed(2)}`);
    }

    console.log(`\n   📊 Resumen: ${productosCreados} creados, ${productosExistentes} ya existían\n`);

    // 4. Crear lotes para los productos
    console.log("=".repeat(70));
    console.log("PASO 4: CREAR LOTES");
    console.log("=".repeat(70));

    let lotesCreados = 0;

    for (const producto of productos) {
      const productoId = productosMap.get(producto.codigo);
      
      if (!productoId) continue; // Si no se creó, saltar

      // Verificar si ya tiene lotes
      const lotesExistentes = await client.query(
        `SELECT COUNT(*) as count FROM lotes WHERE producto_id = $1`,
        [productoId]
      );

      if (parseInt(lotesExistentes.rows[0].count) > 0) {
        console.log(`   ⏭️  ${producto.nombre} ya tiene lotes, omitiendo...`);
        continue;
      }

      // Crear 1-3 lotes por producto
      const cantidadLotes = Math.floor(Math.random() * 3) + 1;
      let stockRestante = producto.stock;
      const cantidadPorLote = Math.floor(producto.stock / cantidadLotes);

      for (let i = 0; i < cantidadLotes; i++) {
        const cantidadLote = i === cantidadLotes - 1 ? stockRestante : cantidadPorLote;
        stockRestante -= cantidadPorLote;

        // Generar fechas de vencimiento variadas
        const hoy = new Date();
        const diasVencimiento = [
          -60, -30, -15, // Vencidos
          10, 20, 30, 45, // Por vencer pronto
          90, 180, 270, 365, 540 // Lejanos
        ];
        const dias = diasVencimiento[Math.floor(Math.random() * diasVencimiento.length)];
        const fechaVencimiento = new Date(hoy);
        fechaVencimiento.setDate(hoy.getDate() + dias);

        const fechaEntrada = new Date(fechaVencimiento);
        fechaEntrada.setDate(fechaVencimiento.getDate() - (365 + Math.floor(Math.random() * 365)));

        const numeroLote = generarNumeroLote();
        
        // Usar precio_compra_base como precio_compra del lote
        const precioCompra = producto.precioCompraBase;
        const precioVenta = calcularPrecioVenta(
          producto.precioCompraBase,
          producto.esMedicamento,
          producto.porcentajeIVA
        );

        await client.query(
          `INSERT INTO lotes (
            producto_id, numero_lote, fecha_vencimiento, fecha_fabricacion,
            cantidad_inicial, cantidad_actual, precio_compra, precio_venta,
            proveedor_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            productoId,
            numeroLote,
            fechaVencimiento.toISOString().split('T')[0],
            fechaEntrada.toISOString().split('T')[0],
            cantidadLote,
            cantidadLote,
            precioCompra,
            precioVenta,
            proveedoresMap.get(producto.proveedor),
          ]
        );

        lotesCreados++;
      }

      console.log(`   ✅ ${cantidadLotes} lotes creados para: ${producto.nombre}`);
    }

    await client.query("COMMIT");

    console.log("\n" + "=".repeat(70));
    console.log("✅ PROCESO COMPLETADO");
    console.log("=".repeat(70));
    console.log(`📊 Resumen Final:`);
    console.log(`   • Proveedores: ${proveedoresCreados} creados, ${proveedoresExistentes} existentes`);
    console.log(`   • Productos: ${productosCreados} creados, ${productosExistentes} existentes`);
    console.log(`   • Lotes: ${lotesCreados} creados`);
    console.log("=".repeat(70) + "\n");

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

crearProveedoresProductosYLotes();

