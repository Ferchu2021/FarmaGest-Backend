-- =====================================================
-- Script para corregir vista de pérdidas y agregar sistema de ganancias
-- =====================================================

-- 1. Corregir vista de pérdidas para mostrar información detallada de lotes vencidos
DROP VIEW IF EXISTS v_resumen_perdidas_vencimientos CASCADE;

CREATE OR REPLACE VIEW v_resumen_perdidas_vencimientos AS
SELECT 
    DATE_TRUNC('month', l.fecha_vencimiento)::DATE AS mes_vencimiento,
    COUNT(DISTINCT l.lote_id) AS cantidad_lotes_vencidos,
    SUM(l.cantidad_actual) AS unidades_vencidas,
    SUM(l.cantidad_actual * COALESCE(l.precio_compra, 0)) AS perdida_total,
    COUNT(DISTINCT l.producto_id) AS productos_afectados,
    STRING_AGG(DISTINCT p.nombre, ', ' ORDER BY p.nombre) AS productos_lista
FROM lotes l
JOIN productos p ON l.producto_id = p.producto_id
WHERE l.deleted_at IS NULL
    AND l.fecha_vencimiento < CURRENT_DATE
    AND l.cantidad_actual > 0
    AND l.estado = 'VENCIDO'
GROUP BY DATE_TRUNC('month', l.fecha_vencimiento)
ORDER BY mes_vencimiento DESC;

-- Vista adicional: Detalle de lotes vencidos
DROP VIEW IF EXISTS v_detalle_lotes_vencidos CASCADE;

CREATE OR REPLACE VIEW v_detalle_lotes_vencidos AS
SELECT 
    l.lote_id,
    l.numero_lote,
    l.producto_id,
    p.nombre AS producto_nombre,
    p.codigo AS producto_codigo,
    l.fecha_vencimiento,
    (CURRENT_DATE - l.fecha_vencimiento) AS dias_vencido,
    l.cantidad_actual AS unidades_vencidas,
    l.precio_compra,
    l.cantidad_actual * COALESCE(l.precio_compra, 0) AS perdida_economica,
    pr.razon_social AS proveedor_nombre
FROM lotes l
JOIN productos p ON l.producto_id = p.producto_id
LEFT JOIN proveedores pr ON l.proveedor_id = pr.proveedor_id
WHERE l.deleted_at IS NULL
    AND l.fecha_vencimiento < CURRENT_DATE
    AND l.cantidad_actual > 0
    AND l.estado = 'VENCIDO'
ORDER BY l.fecha_vencimiento ASC, perdida_economica DESC;

-- 2. Agregar campo es_medicamento a productos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'productos' AND column_name = 'es_medicamento'
    ) THEN
        ALTER TABLE productos 
        ADD COLUMN es_medicamento BOOLEAN DEFAULT false;
        
        -- Crear índice
        CREATE INDEX IF NOT EXISTS idx_productos_es_medicamento ON productos(es_medicamento);
        
        -- Actualizar productos existentes basándose en categorías comunes de medicamentos
        UPDATE productos 
        SET es_medicamento = true
        WHERE LOWER(nombre) LIKE '%paracetamol%'
           OR LOWER(nombre) LIKE '%ibuprofeno%'
           OR LOWER(nombre) LIKE '%aspirina%'
           OR LOWER(nombre) LIKE '%omeprazol%'
           OR LOWER(nombre) LIKE '%amoxicilina%'
           OR LOWER(nombre) LIKE '%diclofenaco%'
           OR LOWER(nombre) LIKE '%loratadina%'
           OR LOWER(nombre) LIKE '%ranitidina%'
           OR LOWER(nombre) LIKE '%metformina%'
           OR LOWER(nombre) LIKE '%clorfenamina%'
           OR LOWER(nombre) LIKE '%dexametasona%'
           OR LOWER(nombre) LIKE '%hierro%'
           OR LOWER(nombre) LIKE '%ácido fólico%'
           OR LOWER(nombre) LIKE '%acetaminofén%';
    END IF;
END
$$;

-- 3. Agregar campo precio_compra_base a productos (precio de compra sin ganancias)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'productos' AND column_name = 'precio_compra_base'
    ) THEN
        ALTER TABLE productos 
        ADD COLUMN precio_compra_base DECIMAL(10, 2);
        
        CREATE INDEX IF NOT EXISTS idx_productos_precio_compra_base ON productos(precio_compra_base);
    END IF;
END
$$;

-- 4. Agregar campo porcentaje_iva a productos (por defecto 21% en Argentina)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'productos' AND column_name = 'porcentaje_iva'
    ) THEN
        ALTER TABLE productos 
        ADD COLUMN porcentaje_iva DECIMAL(5, 2) DEFAULT 21.00;
        
        CREATE INDEX IF NOT EXISTS idx_productos_porcentaje_iva ON productos(porcentaje_iva);
    END IF;
END
$$;

-- Función para calcular precio de venta con ganancias e IVA
CREATE OR REPLACE FUNCTION calcular_precio_venta(
    precio_compra_base DECIMAL,
    es_medicamento BOOLEAN,
    porcentaje_iva DECIMAL DEFAULT 21.00
)
RETURNS DECIMAL AS $$
DECLARE
    porcentaje_ganancia DECIMAL;
    precio_con_ganancia DECIMAL;
    precio_final DECIMAL;
BEGIN
    -- Determinar porcentaje de ganancia
    IF es_medicamento THEN
        porcentaje_ganancia := 25.00; -- 25% para medicamentos
    ELSE
        porcentaje_ganancia := 30.00; -- 30% para otros productos
    END IF;
    
    -- Calcular precio con ganancia
    precio_con_ganancia := precio_compra_base * (1 + porcentaje_ganancia / 100);
    
    -- Aplicar IVA
    precio_final := precio_con_ganancia * (1 + porcentaje_iva / 100);
    
    RETURN ROUND(precio_final, 2);
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar precio de venta basado en precio_compra_base
CREATE OR REPLACE FUNCTION actualizar_precio_venta()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se actualiza precio_compra_base, recalcular precio de venta
    IF NEW.precio_compra_base IS NOT NULL AND 
       (OLD.precio_compra_base IS NULL OR OLD.precio_compra_base != NEW.precio_compra_base) THEN
        NEW.precio := calcular_precio_venta(
            NEW.precio_compra_base,
            COALESCE(NEW.es_medicamento, false),
            COALESCE(NEW.porcentaje_iva, 21.00)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar precio automáticamente
DROP TRIGGER IF EXISTS trigger_actualizar_precio_venta ON productos;
CREATE TRIGGER trigger_actualizar_precio_venta
BEFORE INSERT OR UPDATE ON productos
FOR EACH ROW
EXECUTE FUNCTION actualizar_precio_venta();

COMMENT ON COLUMN productos.es_medicamento IS 'Indica si el producto es un medicamento (true) para aplicar 25% de ganancia, o no (false) para aplicar 30%';
COMMENT ON COLUMN productos.precio_compra_base IS 'Precio de compra sin ganancias ni IVA';
COMMENT ON COLUMN productos.porcentaje_iva IS 'Porcentaje de IVA a aplicar (por defecto 21%)';
COMMENT ON FUNCTION calcular_precio_venta IS 'Calcula el precio de venta: (precio_compra * (1 + ganancia%)) * (1 + IVA%)';

