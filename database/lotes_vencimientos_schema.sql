-- =====================================================
-- SISTEMA DE CONTROL DE VENCIMIENTOS POR LOTE
-- =====================================================

-- =====================================================
-- TABLA: lotes
-- =====================================================
CREATE TABLE IF NOT EXISTS lotes (
    lote_id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL REFERENCES productos(producto_id) ON DELETE CASCADE,
    numero_lote VARCHAR(100) NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    fecha_fabricacion DATE,
    cantidad_inicial INTEGER NOT NULL CHECK (cantidad_inicial > 0),
    cantidad_actual INTEGER NOT NULL CHECK (cantidad_actual >= 0),
    precio_compra DECIMAL(10, 2) CHECK (precio_compra >= 0),
    precio_venta DECIMAL(10, 2) CHECK (precio_venta >= 0),
    proveedor_id INTEGER REFERENCES proveedores(proveedor_id) ON DELETE SET NULL,
    fecha_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ubicacion VARCHAR(255), -- Estante, refrigerador, etc.
    observaciones TEXT,
    estado VARCHAR(50) DEFAULT 'ACTIVO', -- ACTIVO, VENCIDO, AGOTADO, DESECHADO
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Restricciones
    CONSTRAINT chk_cantidad_actual CHECK (cantidad_actual <= cantidad_inicial),
    CONSTRAINT chk_fecha_vencimiento CHECK (fecha_vencimiento IS NULL OR fecha_fabricacion IS NULL OR fecha_vencimiento >= fecha_fabricacion),
    CONSTRAINT uk_lote_producto UNIQUE (producto_id, numero_lote, deleted_at)
);

-- Índices para lotes
CREATE INDEX IF NOT EXISTS idx_lotes_producto_id ON lotes(producto_id);
CREATE INDEX IF NOT EXISTS idx_lotes_numero_lote ON lotes(numero_lote);
CREATE INDEX IF NOT EXISTS idx_lotes_fecha_vencimiento ON lotes(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_lotes_fecha_entrada ON lotes(fecha_entrada);
CREATE INDEX IF NOT EXISTS idx_lotes_estado ON lotes(estado);
CREATE INDEX IF NOT EXISTS idx_lotes_proveedor_id ON lotes(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_lotes_deleted_at ON lotes(deleted_at);

-- Índice compuesto para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_lotes_vencimiento_activo 
ON lotes(fecha_vencimiento, estado) 
WHERE deleted_at IS NULL AND estado IN ('ACTIVO', 'PRONTO_VENCER');

-- =====================================================
-- TABLA: movimientos_lotes
-- =====================================================
CREATE TABLE IF NOT EXISTS movimientos_lotes (
    movimiento_id SERIAL PRIMARY KEY,
    lote_id INTEGER NOT NULL REFERENCES lotes(lote_id) ON DELETE CASCADE,
    tipo_movimiento VARCHAR(50) NOT NULL, -- ENTRADA, SALIDA, AJUSTE, VENCIMIENTO, DESECHO
    cantidad INTEGER NOT NULL,
    cantidad_anterior INTEGER NOT NULL,
    cantidad_nueva INTEGER NOT NULL,
    motivo TEXT,
    referencia_id INTEGER, -- ID de venta, compra, ajuste, etc.
    referencia_tipo VARCHAR(50), -- VENTA, COMPRA, AJUSTE, etc.
    usuario_id INTEGER REFERENCES usuarios(usuario_id) ON DELETE SET NULL,
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observaciones TEXT
);

-- Índices para movimientos_lotes
CREATE INDEX IF NOT EXISTS idx_movimientos_lotes_lote_id ON movimientos_lotes(lote_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_lotes_tipo ON movimientos_lotes(tipo_movimiento);
CREATE INDEX IF NOT EXISTS idx_movimientos_lotes_fecha ON movimientos_lotes(fecha_movimiento DESC);
CREATE INDEX IF NOT EXISTS idx_movimientos_lotes_usuario_id ON movimientos_lotes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_lotes_referencia ON movimientos_lotes(referencia_tipo, referencia_id);

-- =====================================================
-- TABLA: items_venta (ACTUALIZACIÓN - agregar lote_id)
-- =====================================================
-- Si la tabla ya existe, solo agregar la columna
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'items_venta' AND column_name = 'lote_id'
    ) THEN
        ALTER TABLE items_venta 
        ADD COLUMN lote_id INTEGER REFERENCES lotes(lote_id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_items_venta_lote_id ON items_venta(lote_id);
    END IF;
END $$;

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar estado del lote según vencimiento
CREATE OR REPLACE FUNCTION actualizar_estado_lote()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar estado basado en fecha de vencimiento
    IF NEW.fecha_vencimiento < CURRENT_DATE THEN
        NEW.estado = 'VENCIDO';
    ELSIF NEW.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days' THEN
        NEW.estado = 'PRONTO_VENCER';
    ELSIF NEW.cantidad_actual = 0 THEN
        NEW.estado = 'AGOTADO';
    ELSE
        NEW.estado = 'ACTIVO';
    END IF;
    
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar estado automáticamente
DROP TRIGGER IF EXISTS trigger_actualizar_estado_lote ON lotes;
CREATE TRIGGER trigger_actualizar_estado_lote
BEFORE INSERT OR UPDATE ON lotes
FOR EACH ROW
EXECUTE FUNCTION actualizar_estado_lote();

-- Función para registrar movimientos automáticamente
CREATE OR REPLACE FUNCTION registrar_movimiento_lote()
RETURNS TRIGGER AS $$
BEGIN
    -- Registrar movimiento cuando cambia la cantidad
    IF OLD.cantidad_actual IS DISTINCT FROM NEW.cantidad_actual THEN
        INSERT INTO movimientos_lotes (
            lote_id,
            tipo_movimiento,
            cantidad,
            cantidad_anterior,
            cantidad_nueva,
            motivo,
            fecha_movimiento
        ) VALUES (
            NEW.lote_id,
            CASE 
                WHEN NEW.cantidad_actual > OLD.cantidad_actual THEN 'ENTRADA'
                WHEN NEW.cantidad_actual < OLD.cantidad_actual THEN 'SALIDA'
                ELSE 'AJUSTE'
            END,
            ABS(NEW.cantidad_actual - OLD.cantidad_actual),
            OLD.cantidad_actual,
            NEW.cantidad_actual,
            'Actualización automática',
            CURRENT_TIMESTAMP
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para registrar movimientos
DROP TRIGGER IF EXISTS trigger_registrar_movimiento_lote ON lotes;
CREATE TRIGGER trigger_registrar_movimiento_lote
AFTER UPDATE ON lotes
FOR EACH ROW
WHEN (OLD.cantidad_actual IS DISTINCT FROM NEW.cantidad_actual)
EXECUTE FUNCTION registrar_movimiento_lote();

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista: Lotes con información completa
CREATE OR REPLACE VIEW v_lotes_completos AS
SELECT 
    l.lote_id,
    l.numero_lote,
    l.fecha_vencimiento,
    l.fecha_fabricacion,
    l.cantidad_inicial,
    l.cantidad_actual,
    l.precio_compra,
    l.precio_venta,
    l.estado,
    l.fecha_entrada,
    l.ubicacion,
    p.producto_id,
    p.nombre AS producto_nombre,
    p.codigo AS producto_codigo,
    p.marca AS producto_marca,
    pr.proveedor_id,
    pr.razon_social AS proveedor_nombre,
    -- Cálculo de días hasta vencimiento
    (l.fecha_vencimiento - CURRENT_DATE) AS dias_hasta_vencimiento,
    -- Cálculo de pérdida potencial
    CASE 
        WHEN l.fecha_vencimiento < CURRENT_DATE THEN l.cantidad_actual * COALESCE(l.precio_compra, 0)
        ELSE 0
    END AS perdida_vencido,
    CASE 
        WHEN l.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days' THEN l.cantidad_actual * COALESCE(l.precio_compra, 0)
        ELSE 0
    END AS riesgo_potencial
FROM lotes l
JOIN productos p ON l.producto_id = p.producto_id
LEFT JOIN proveedores pr ON l.proveedor_id = pr.proveedor_id
WHERE l.deleted_at IS NULL;

-- Vista: Productos próximos a vencer (próximos 30 días)
CREATE OR REPLACE VIEW v_productos_vencer AS
SELECT 
    l.lote_id,
    l.numero_lote,
    l.producto_id,
    p.nombre AS producto_nombre,
    p.codigo AS producto_codigo,
    l.fecha_vencimiento,
    (l.fecha_vencimiento - CURRENT_DATE) AS dias_restantes,
    l.cantidad_actual,
    l.precio_compra,
    l.precio_venta,
    l.cantidad_actual * COALESCE(l.precio_compra, 0) AS valor_inventario,
    CASE 
        WHEN l.fecha_vencimiento < CURRENT_DATE THEN 'VENCIDO'
        WHEN l.fecha_vencimiento <= CURRENT_DATE + INTERVAL '7 days' THEN 'CRÍTICO'
        WHEN l.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days' THEN 'PRÓXIMO'
        ELSE 'NORMAL'
    END AS nivel_alerta
FROM lotes l
JOIN productos p ON l.producto_id = p.producto_id
WHERE l.deleted_at IS NULL
    AND l.cantidad_actual > 0
    AND l.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY l.fecha_vencimiento ASC;

-- Vista: Resumen de pérdidas por vencimiento
CREATE OR REPLACE VIEW v_resumen_perdidas_vencimientos AS
SELECT 
    DATE_TRUNC('month', fecha_vencimiento) AS mes_vencimiento,
    COUNT(*) AS cantidad_lotes_vencidos,
    SUM(cantidad_actual) AS unidades_vencidas,
    SUM(cantidad_actual * COALESCE(precio_compra, 0)) AS perdida_total,
    SUM(DISTINCT producto_id) AS productos_afectados
FROM lotes
WHERE deleted_at IS NULL
    AND fecha_vencimiento < CURRENT_DATE
    AND cantidad_actual > 0
GROUP BY DATE_TRUNC('month', fecha_vencimiento)
ORDER BY mes_vencimiento DESC;

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON TABLE lotes IS 'Control de lotes y vencimientos de productos';
COMMENT ON TABLE movimientos_lotes IS 'Auditoría de movimientos de lotes';
COMMENT ON VIEW v_lotes_completos IS 'Vista completa de lotes con información de productos y proveedores';
COMMENT ON VIEW v_productos_vencer IS 'Productos próximos a vencer en los próximos 30 días';
COMMENT ON VIEW v_resumen_perdidas_vencimientos IS 'Resumen de pérdidas económicas por vencimientos';

