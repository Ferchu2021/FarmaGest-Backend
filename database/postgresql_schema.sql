-- =====================================================
-- Esquema Completo PostgreSQL para FarmaGest
-- =====================================================
-- Este script crea todas las tablas necesarias para la aplicación
-- Optimizado para PostgreSQL con soporte para Power BI e IA
-- =====================================================

-- Crear base de datos (ejecutar como superusuario)
-- CREATE DATABASE farma_gest WITH ENCODING 'UTF8' LC_COLLATE='es_ES.UTF-8' LC_CTYPE='es_ES.UTF-8';
-- \c farma_gest

-- =====================================================
-- EXTENSIONES ÚTILES
-- =====================================================
-- Para búsquedas de texto mejoradas
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Para vectores (embeddings) - útil para IA
-- CREATE EXTENSION IF NOT EXISTS vector;

-- Para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA: roles
-- =====================================================
CREATE TABLE IF NOT EXISTS roles (
    rol_id SERIAL PRIMARY KEY,
    rol VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA: permisos
-- =====================================================
CREATE TABLE IF NOT EXISTS permisos (
    permiso_id SERIAL PRIMARY KEY,
    permiso VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA: roles_permisos (relación muchos a muchos)
-- =====================================================
CREATE TABLE IF NOT EXISTS roles_permisos (
    rol_id INTEGER REFERENCES roles(rol_id) ON DELETE CASCADE,
    permiso_id INTEGER REFERENCES permisos(permiso_id) ON DELETE CASCADE,
    PRIMARY KEY (rol_id, permiso_id)
);

-- =====================================================
-- TABLA: usuarios
-- =====================================================
CREATE TABLE IF NOT EXISTS usuarios (
    usuario_id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(255) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    rol_id INTEGER REFERENCES roles(rol_id) ON DELETE SET NULL,
    estado BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Índices para usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_correo ON usuarios(correo);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol_id ON usuarios(rol_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_deleted_at ON usuarios(deleted_at);
CREATE INDEX IF NOT EXISTS idx_usuarios_busqueda ON usuarios USING GIN(to_tsvector('spanish', nombre || ' ' || apellido || ' ' || correo));

-- =====================================================
-- TABLA: categorias
-- =====================================================
CREATE TABLE IF NOT EXISTS categorias (
    categoria_id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA: productos
-- =====================================================
CREATE TABLE IF NOT EXISTS productos (
    producto_id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    codigo VARCHAR(100) UNIQUE,
    marca VARCHAR(100),
    categoria_id INTEGER REFERENCES categorias(categoria_id) ON DELETE SET NULL,
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    precio DECIMAL(10, 2) NOT NULL CHECK (precio >= 0),
    -- Campos para IA/Análisis
    descripcion TEXT,
    tags TEXT[], -- Array de tags para búsqueda
    embedding vector(1536), -- Para búsqueda semántica (requiere pgvector)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Índices para productos
CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos(nombre);
CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo);
CREATE INDEX IF NOT EXISTS idx_productos_marca ON productos(marca);
CREATE INDEX IF NOT EXISTS idx_productos_categoria_id ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_deleted_at ON productos(deleted_at);
CREATE INDEX IF NOT EXISTS idx_productos_stock ON productos(stock);
CREATE INDEX IF NOT EXISTS idx_productos_busqueda ON productos USING GIN(to_tsvector('spanish', nombre || ' ' || COALESCE(codigo, '') || ' ' || COALESCE(marca, '')));
-- Índice para búsqueda por tags
CREATE INDEX IF NOT EXISTS idx_productos_tags ON productos USING GIN(tags);
-- Índice para búsqueda vectorial (si se usa pgvector)
-- CREATE INDEX IF NOT EXISTS idx_productos_embedding ON productos USING ivfflat(embedding vector_cosine_ops);

-- =====================================================
-- TABLA: ciudades
-- =====================================================
CREATE TABLE IF NOT EXISTS ciudades (
    ciudad_id SERIAL PRIMARY KEY,
    ciudad VARCHAR(100) NOT NULL,
    codigo_postal VARCHAR(20),
    provincia_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ciudades_provincia_id ON ciudades(provincia_id);

-- =====================================================
-- TABLA: obras_sociales
-- =====================================================
CREATE TABLE IF NOT EXISTS obras_sociales (
    obra_social_id SERIAL PRIMARY KEY,
    obra_social VARCHAR(255) NOT NULL,
    plan VARCHAR(100),
    descuento DECIMAL(5, 2) DEFAULT 0 CHECK (descuento >= 0 AND descuento <= 100),
    codigo VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Índices para obras_sociales
CREATE INDEX IF NOT EXISTS idx_obras_sociales_obra_social ON obras_sociales(obra_social);
CREATE INDEX IF NOT EXISTS idx_obras_sociales_plan ON obras_sociales(plan);
CREATE INDEX IF NOT EXISTS idx_obras_sociales_codigo ON obras_sociales(codigo);
CREATE INDEX IF NOT EXISTS idx_obras_sociales_deleted_at ON obras_sociales(deleted_at);

-- =====================================================
-- TABLA: clientes
-- =====================================================
CREATE TABLE IF NOT EXISTS clientes (
    cliente_id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    dni VARCHAR(20) UNIQUE,
    obra_social_id INTEGER REFERENCES obras_sociales(obra_social_id) ON DELETE SET NULL,
    ciudad_id INTEGER REFERENCES ciudades(ciudad_id) ON DELETE SET NULL,
    -- Campos adicionales para análisis
    fecha_nacimiento DATE,
    telefono VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Índices para clientes
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre);
CREATE INDEX IF NOT EXISTS idx_clientes_apellido ON clientes(apellido);
CREATE INDEX IF NOT EXISTS idx_clientes_dni ON clientes(dni);
CREATE INDEX IF NOT EXISTS idx_clientes_obra_social_id ON clientes(obra_social_id);
CREATE INDEX IF NOT EXISTS idx_clientes_ciudad_id ON clientes(ciudad_id);
CREATE INDEX IF NOT EXISTS idx_clientes_deleted_at ON clientes(deleted_at);
CREATE INDEX IF NOT EXISTS idx_clientes_busqueda ON clientes USING GIN(to_tsvector('spanish', nombre || ' ' || apellido || ' ' || COALESCE(dni, '')));

-- =====================================================
-- TABLA: ventas
-- =====================================================
CREATE TABLE IF NOT EXISTS ventas (
    venta_id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(cliente_id) ON DELETE RESTRICT,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(usuario_id) ON DELETE RESTRICT,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
    total_sin_descuento DECIMAL(10, 2) NOT NULL CHECK (total_sin_descuento >= 0),
    descuento DECIMAL(10, 2) DEFAULT 0 CHECK (descuento >= 0),
    numero_factura VARCHAR(20) UNIQUE,
    -- Campos para análisis
    metodo_pago VARCHAR(50),
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para ventas
CREATE INDEX IF NOT EXISTS idx_ventas_fecha_hora ON ventas(fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente_id ON ventas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ventas_usuario_id ON ventas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ventas_numero_factura ON ventas(numero_factura);
-- Índice compuesto para análisis frecuentes
CREATE INDEX IF NOT EXISTS idx_ventas_listado ON ventas(fecha_hora DESC, cliente_id, usuario_id);
-- Índice para análisis por fecha
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(DATE(fecha_hora));

-- =====================================================
-- TABLA: items_venta
-- =====================================================
CREATE TABLE IF NOT EXISTS items_venta (
    item_id SERIAL PRIMARY KEY,
    venta_id INTEGER NOT NULL REFERENCES ventas(venta_id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(producto_id) ON DELETE RESTRICT,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    total_item DECIMAL(10, 2) NOT NULL CHECK (total_item >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para items_venta
CREATE INDEX IF NOT EXISTS idx_items_venta_venta_id ON items_venta(venta_id);
CREATE INDEX IF NOT EXISTS idx_items_venta_producto_id ON items_venta(producto_id);

-- =====================================================
-- TABLA: proveedores
-- =====================================================
CREATE TABLE IF NOT EXISTS proveedores (
    proveedor_id SERIAL PRIMARY KEY,
    razon_social VARCHAR(255) NOT NULL,
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_proveedores_razon_social ON proveedores(razon_social);

-- =====================================================
-- TABLA: sesiones
-- =====================================================
CREATE TABLE IF NOT EXISTS sesiones (
    sesion_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    correo_usuario VARCHAR(255) NOT NULL,
    navegador VARCHAR(255),
    ip INET,
    hora_logueo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultima_actividad TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    hora_logout TIMESTAMP NULL
);

-- Índices para sesiones
CREATE INDEX IF NOT EXISTS idx_sesiones_sesion_id ON sesiones(sesion_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_correo_usuario ON sesiones(correo_usuario);
CREATE INDEX IF NOT EXISTS idx_sesiones_ultima_actividad ON sesiones(ultima_actividad);
CREATE INDEX IF NOT EXISTS idx_sesiones_hora_logueo ON sesiones(hora_logueo);

-- =====================================================
-- TABLAS DE AUDITORÍA
-- =====================================================

-- Auditoría de productos
CREATE TABLE IF NOT EXISTS auditoria_productos (
    auditoria_id SERIAL PRIMARY KEY,
    producto_id INTEGER REFERENCES productos(producto_id) ON DELETE SET NULL,
    accion VARCHAR(50) NOT NULL, -- CREAR, ACTUALIZAR, ELIMINAR
    detalle_cambio TEXT,
    fecha_movimiento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuario_id INTEGER REFERENCES usuarios(usuario_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_auditoria_productos_producto_id ON auditoria_productos(producto_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_productos_usuario_id ON auditoria_productos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_productos_fecha ON auditoria_productos(fecha_movimiento DESC);

-- Auditoría de clientes
CREATE TABLE IF NOT EXISTS auditoria_clientes (
    auditoria_id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(cliente_id) ON DELETE SET NULL,
    accion VARCHAR(50) NOT NULL,
    detalle_cambio TEXT,
    fecha_movimiento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuario_id INTEGER REFERENCES usuarios(usuario_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_auditoria_clientes_cliente_id ON auditoria_clientes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_clientes_usuario_id ON auditoria_clientes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_clientes_fecha ON auditoria_clientes(fecha_movimiento DESC);

-- Auditoría de obras sociales
CREATE TABLE IF NOT EXISTS auditoria_obras_sociales (
    auditoria_id SERIAL PRIMARY KEY,
    obra_social_id INTEGER REFERENCES obras_sociales(obra_social_id) ON DELETE SET NULL,
    accion VARCHAR(50) NOT NULL,
    detalle_cambio TEXT,
    fecha_movimiento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuario_id INTEGER REFERENCES usuarios(usuario_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_auditoria_obras_sociales_obra_social_id ON auditoria_obras_sociales(obra_social_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_obras_sociales_usuario_id ON auditoria_obras_sociales(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_obras_sociales_fecha ON auditoria_obras_sociales(fecha_movimiento DESC);

-- =====================================================
-- VISTAS PARA POWER BI
-- =====================================================

-- Vista: Ventas con detalles completos
CREATE OR REPLACE VIEW v_ventas_completas AS
SELECT 
    v.venta_id,
    v.fecha_hora,
    v.numero_factura,
    v.total,
    v.total_sin_descuento,
    v.descuento,
    v.metodo_pago,
    c.cliente_id,
    c.nombre || ' ' || c.apellido AS cliente_nombre_completo,
    c.dni AS cliente_dni,
    o.obra_social,
    o.descuento AS descuento_obra_social,
    u.usuario_id,
    u.nombre || ' ' || u.apellido AS usuario_nombre_completo,
    u.correo AS usuario_correo,
    DATE(v.fecha_hora) AS fecha,
    EXTRACT(YEAR FROM v.fecha_hora) AS año,
    EXTRACT(MONTH FROM v.fecha_hora) AS mes,
    EXTRACT(DAY FROM v.fecha_hora) AS dia,
    EXTRACT(DOW FROM v.fecha_hora) AS dia_semana,
    EXTRACT(HOUR FROM v.fecha_hora) AS hora
FROM ventas v
JOIN clientes c ON v.cliente_id = c.cliente_id
JOIN usuarios u ON v.usuario_id = u.usuario_id
LEFT JOIN obras_sociales o ON c.obra_social_id = o.obra_social_id
WHERE c.deleted_at IS NULL;

-- Vista: Items de venta con detalles
CREATE OR REPLACE VIEW v_items_venta_detalle AS
SELECT 
    iv.item_id,
    iv.venta_id,
    iv.cantidad,
    iv.precio_unitario,
    iv.total_item,
    p.producto_id,
    p.nombre AS producto_nombre,
    p.codigo AS producto_codigo,
    p.marca AS producto_marca,
    cat.nombre AS categoria_nombre,
    v.fecha_hora,
    v.total AS venta_total,
    c.cliente_id,
    c.nombre || ' ' || c.apellido AS cliente_nombre
FROM items_venta iv
JOIN productos p ON iv.producto_id = p.producto_id
JOIN ventas v ON iv.venta_id = v.venta_id
JOIN clientes c ON v.cliente_id = c.cliente_id
LEFT JOIN categorias cat ON p.categoria_id = cat.categoria_id
WHERE p.deleted_at IS NULL AND c.deleted_at IS NULL;

-- Vista: Análisis de productos más vendidos
CREATE OR REPLACE VIEW v_productos_mas_vendidos AS
SELECT 
    p.producto_id,
    p.nombre,
    p.codigo,
    p.marca,
    cat.nombre AS categoria,
    SUM(iv.cantidad) AS total_vendido,
    SUM(iv.total_item) AS ingresos_totales,
    COUNT(DISTINCT iv.venta_id) AS cantidad_ventas,
    AVG(iv.precio_unitario) AS precio_promedio,
    p.stock,
    p.precio
FROM productos p
LEFT JOIN items_venta iv ON p.producto_id = iv.producto_id
LEFT JOIN categorias cat ON p.categoria_id = cat.categoria_id
WHERE p.deleted_at IS NULL
GROUP BY p.producto_id, p.nombre, p.codigo, p.marca, cat.nombre, p.stock, p.precio
ORDER BY total_vendido DESC NULLS LAST;

-- Vista: Análisis de clientes
CREATE OR REPLACE VIEW v_clientes_analisis AS
SELECT 
    c.cliente_id,
    c.nombre || ' ' || c.apellido AS nombre_completo,
    c.dni,
    o.obra_social,
    ci.ciudad,
    COUNT(v.venta_id) AS total_compras,
    SUM(v.total) AS total_gastado,
    AVG(v.total) AS promedio_compra,
    MAX(v.fecha_hora) AS ultima_compra,
    MIN(v.fecha_hora) AS primera_compra
FROM clientes c
LEFT JOIN ventas v ON c.cliente_id = v.cliente_id
LEFT JOIN obras_sociales o ON c.obra_social_id = o.obra_social_id
LEFT JOIN ciudades ci ON c.ciudad_id = ci.ciudad_id
WHERE c.deleted_at IS NULL
GROUP BY c.cliente_id, c.nombre, c.apellido, c.dni, o.obra_social, ci.ciudad;

-- Vista: Ventas por período (optimizada para Power BI)
CREATE OR REPLACE VIEW v_ventas_por_periodo AS
SELECT 
    DATE(v.fecha_hora) AS fecha,
    EXTRACT(YEAR FROM v.fecha_hora) AS año,
    EXTRACT(MONTH FROM v.fecha_hora) AS mes,
    EXTRACT(QUARTER FROM v.fecha_hora) AS trimestre,
    EXTRACT(DOW FROM v.fecha_hora) AS dia_semana,
    TO_CHAR(v.fecha_hora, 'YYYY-MM') AS año_mes,
    COUNT(*) AS cantidad_ventas,
    SUM(v.total) AS monto_total,
    SUM(v.total_sin_descuento) AS monto_sin_descuento,
    SUM(v.descuento) AS total_descuentos,
    AVG(v.total) AS promedio_venta,
    COUNT(DISTINCT v.cliente_id) AS clientes_unicos,
    COUNT(DISTINCT v.usuario_id) AS vendedores_activos
FROM ventas v
JOIN clientes c ON v.cliente_id = c.cliente_id
WHERE c.deleted_at IS NULL
GROUP BY DATE(v.fecha_hora), EXTRACT(YEAR FROM v.fecha_hora), EXTRACT(MONTH FROM v.fecha_hora), 
         EXTRACT(QUARTER FROM v.fecha_hora), EXTRACT(DOW FROM v.fecha_hora), TO_CHAR(v.fecha_hora, 'YYYY-MM')
ORDER BY fecha DESC;

-- =====================================================
-- FUNCIONES ÚTILES PARA IA Y ANÁLISIS
-- =====================================================

-- Función: Predecir stock bajo (análisis predictivo básico)
CREATE OR REPLACE FUNCTION fn_productos_stock_bajo(umbral INTEGER DEFAULT 10)
RETURNS TABLE (
    producto_id INTEGER,
    nombre VARCHAR,
    stock_actual INTEGER,
    promedio_ventas_dia DECIMAL,
    dias_restantes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.producto_id,
        p.nombre,
        p.stock AS stock_actual,
        COALESCE(AVG(iv.cantidad)::DECIMAL, 0) AS promedio_ventas_dia,
        CASE 
            WHEN AVG(iv.cantidad) > 0 THEN (p.stock / AVG(iv.cantidad))::INTEGER
            ELSE NULL
        END AS dias_restantes
    FROM productos p
    LEFT JOIN items_venta iv ON p.producto_id = iv.producto_id
        AND iv.created_at >= CURRENT_DATE - INTERVAL '30 days'
    WHERE p.deleted_at IS NULL
        AND p.stock <= umbral
    GROUP BY p.producto_id, p.nombre, p.stock
    ORDER BY dias_restantes NULLS LAST, p.stock;
END;
$$ LANGUAGE plpgsql;

-- Función: Productos similares (para recomendaciones)
CREATE OR REPLACE FUNCTION fn_productos_similares(p_producto_id INTEGER, limite INTEGER DEFAULT 5)
RETURNS TABLE (
    producto_id INTEGER,
    nombre VARCHAR,
    marca VARCHAR,
    categoria VARCHAR,
    precio DECIMAL,
    similitud DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p2.producto_id,
        p2.nombre,
        p2.marca,
        cat.nombre AS categoria,
        p2.precio,
        CASE 
            WHEN p1.marca = p2.marca THEN 0.5
            WHEN p1.categoria_id = p2.categoria_id THEN 0.3
            ELSE 0.1
        END AS similitud
    FROM productos p1
    JOIN productos p2 ON p1.producto_id != p2.producto_id
    LEFT JOIN categorias cat ON p2.categoria_id = cat.categoria_id
    WHERE p1.producto_id = p_producto_id
        AND p2.deleted_at IS NULL
    ORDER BY similitud DESC, p2.nombre
    LIMIT limite;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS PARA ACTUALIZAR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_productos_updated_at BEFORE UPDATE ON productos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_obras_sociales_updated_at BEFORE UPDATE ON obras_sociales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Insertar roles básicos
INSERT INTO roles (rol) VALUES 
    ('Administrador'),
    ('Vendedor'),
    ('Farmacéutico')
ON CONFLICT (rol) DO NOTHING;

-- Insertar categoría por defecto
INSERT INTO categorias (nombre) VALUES 
    ('Sin categoría')
ON CONFLICT DO NOTHING;

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE productos IS 'Tabla de productos con soporte para búsqueda vectorial y tags';
COMMENT ON COLUMN productos.embedding IS 'Vector de embeddings para búsqueda semántica (requiere extensión pgvector)';
COMMENT ON COLUMN productos.tags IS 'Array de tags para búsqueda flexible';
COMMENT ON VIEW v_ventas_completas IS 'Vista optimizada para Power BI con todos los detalles de ventas';
COMMENT ON VIEW v_productos_mas_vendidos IS 'Vista para análisis de productos más vendidos';
COMMENT ON FUNCTION fn_productos_stock_bajo IS 'Función para predecir productos con stock bajo basado en histórico';




