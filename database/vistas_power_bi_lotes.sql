-- =====================================================
-- VISTAS ADICIONALES PARA POWER BI - LOTES Y VENCIMIENTOS
-- =====================================================

-- Vista: Lotes completos para análisis en Power BI
CREATE OR REPLACE VIEW v_power_bi_lotes AS
SELECT 
    l.lote_id,
    l.numero_lote,
    l.fecha_vencimiento,
    l.fecha_entrada,
    l.cantidad_inicial,
    l.cantidad_actual,
    l.precio_compra,
    l.estado,
    -- Información del producto
    p.producto_id,
    p.nombre AS producto_nombre,
    p.codigo AS producto_codigo,
    p.marca AS producto_marca,
    p.precio AS precio_venta,
    cat.nombre AS categoria_nombre,
    -- Información del proveedor
    pr.proveedor_id,
    pr.razon_social AS proveedor_nombre,
    -- Cálculos temporales
    EXTRACT(YEAR FROM l.fecha_vencimiento) AS año_vencimiento,
    EXTRACT(MONTH FROM l.fecha_vencimiento) AS mes_vencimiento,
    EXTRACT(QUARTER FROM l.fecha_vencimiento) AS trimestre_vencimiento,
    DATE_TRUNC('month', l.fecha_vencimiento) AS mes_vencimiento_completo,
    -- Días hasta vencimiento
    (l.fecha_vencimiento - CURRENT_DATE) AS dias_hasta_vencimiento,
    -- Valor del inventario
    l.cantidad_actual * COALESCE(l.precio_compra, 0) AS valor_inventario_lote,
    -- Pérdida potencial si se vence
    CASE 
        WHEN l.fecha_vencimiento < CURRENT_DATE THEN l.cantidad_actual * COALESCE(l.precio_compra, 0)
        ELSE 0
    END AS perdida_vencido,
    -- Riesgo potencial (próximos 30 días)
    CASE 
        WHEN l.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days' 
             AND l.fecha_vencimiento >= CURRENT_DATE 
        THEN l.cantidad_actual * COALESCE(l.precio_compra, 0)
        ELSE 0
    END AS riesgo_potencial_30dias,
    -- Nivel de alerta
    CASE 
        WHEN l.fecha_vencimiento < CURRENT_DATE THEN 'VENCIDO'
        WHEN l.fecha_vencimiento <= CURRENT_DATE + INTERVAL '7 days' THEN 'CRÍTICO'
        WHEN l.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days' THEN 'PRÓXIMO'
        ELSE 'NORMAL'
    END AS nivel_alerta
FROM lotes l
JOIN productos p ON l.producto_id = p.producto_id
LEFT JOIN categorias cat ON p.categoria_id = cat.categoria_id
LEFT JOIN proveedores pr ON l.proveedor_id = pr.proveedor_id
WHERE l.deleted_at IS NULL AND p.deleted_at IS NULL;

-- Vista: Análisis de vencimientos por mes (para Power BI)
CREATE OR REPLACE VIEW v_power_bi_vencimientos_mensual AS
SELECT 
    DATE_TRUNC('month', l.fecha_vencimiento) AS mes_vencimiento,
    EXTRACT(YEAR FROM l.fecha_vencimiento) AS año,
    EXTRACT(MONTH FROM l.fecha_vencimiento) AS mes,
    TO_CHAR(l.fecha_vencimiento, 'YYYY-MM') AS año_mes,
    -- Estadísticas de lotes vencidos
    COUNT(CASE WHEN l.fecha_vencimiento < CURRENT_DATE AND l.cantidad_actual > 0 THEN 1 END) AS lotes_vencidos,
    SUM(CASE WHEN l.fecha_vencimiento < CURRENT_DATE THEN l.cantidad_actual ELSE 0 END) AS unidades_vencidas,
    SUM(CASE WHEN l.fecha_vencimiento < CURRENT_DATE THEN l.cantidad_actual * COALESCE(l.precio_compra, 0) ELSE 0 END) AS perdida_economica,
    -- Estadísticas de lotes por vencer
    COUNT(CASE WHEN l.fecha_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' 
               AND l.cantidad_actual > 0 THEN 1 END) AS lotes_por_vencer,
    SUM(CASE WHEN l.fecha_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' 
             THEN l.cantidad_actual ELSE 0 END) AS unidades_por_vencer,
    SUM(CASE WHEN l.fecha_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' 
             THEN l.cantidad_actual * COALESCE(l.precio_compra, 0) ELSE 0 END) AS valor_en_riesgo,
    -- Productos afectados
    COUNT(DISTINCT CASE WHEN l.fecha_vencimiento < CURRENT_DATE THEN l.producto_id END) AS productos_vencidos,
    COUNT(DISTINCT CASE WHEN l.fecha_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' 
                        THEN l.producto_id END) AS productos_por_vencer
FROM lotes l
JOIN productos p ON l.producto_id = p.producto_id
WHERE l.deleted_at IS NULL AND p.deleted_at IS NULL
GROUP BY DATE_TRUNC('month', l.fecha_vencimiento), 
         EXTRACT(YEAR FROM l.fecha_vencimiento), 
         EXTRACT(MONTH FROM l.fecha_vencimiento),
         TO_CHAR(l.fecha_vencimiento, 'YYYY-MM')
ORDER BY mes_vencimiento DESC;

-- Vista: Análisis de productos por categoría y proveedor
CREATE OR REPLACE VIEW v_power_bi_productos_inventario AS
SELECT 
    p.producto_id,
    p.nombre,
    p.codigo,
    p.marca,
    p.stock,
    p.precio,
    p.precio_compra_base,
    p.es_medicamento,
    p.porcentaje_iva,
    -- Categoría
    cat.categoria_id,
    cat.nombre AS categoria_nombre,
    -- Proveedor
    pr.proveedor_id,
    pr.razon_social AS proveedor_nombre,
    pr.telefono AS proveedor_telefono,
    -- Estadísticas de lotes
    COUNT(DISTINCT l.lote_id) AS total_lotes,
    COUNT(DISTINCT CASE WHEN l.fecha_vencimiento < CURRENT_DATE AND l.cantidad_actual > 0 THEN l.lote_id END) AS lotes_vencidos,
    COUNT(DISTINCT CASE WHEN l.fecha_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' 
                        AND l.cantidad_actual > 0 THEN l.lote_id END) AS lotes_por_vencer,
    SUM(COALESCE(l.cantidad_actual, 0)) AS stock_en_lotes,
    SUM(COALESCE(l.cantidad_actual * l.precio_compra, 0)) AS valor_inventario_lotes,
    -- Estadísticas de ventas (últimos 30 días)
    SUM(COALESCE(iv_30d.cantidad, 0)) AS unidades_vendidas_30d,
    SUM(COALESCE(iv_30d.total_item, 0)) AS ingresos_30d
FROM productos p
LEFT JOIN categorias cat ON p.categoria_id = cat.categoria_id
LEFT JOIN proveedores pr ON p.proveedor_id = pr.proveedor_id
LEFT JOIN lotes l ON p.producto_id = l.producto_id AND l.deleted_at IS NULL
LEFT JOIN items_venta iv_30d ON p.producto_id = iv_30d.producto_id
    AND iv_30d.venta_id IN (
        SELECT venta_id FROM ventas 
        WHERE fecha_hora >= CURRENT_DATE - INTERVAL '30 days'
    )
WHERE p.deleted_at IS NULL
GROUP BY p.producto_id, p.nombre, p.codigo, p.marca, p.stock, p.precio, 
         p.precio_compra_base, p.es_medicamento, p.porcentaje_iva,
         cat.categoria_id, cat.nombre,
         pr.proveedor_id, pr.razon_social, pr.telefono;

-- Vista: Movimientos de lotes para análisis temporal
CREATE OR REPLACE VIEW v_power_bi_movimientos_lotes AS
SELECT 
    ml.movimiento_id,
    ml.lote_id,
    ml.tipo_movimiento,
    ml.cantidad,
    ml.motivo,
    ml.fecha_movimiento,
    ml.usuario_id,
    u.nombre || ' ' || u.apellido AS usuario_nombre,
    -- Información del lote
    l.numero_lote,
    l.fecha_vencimiento,
    -- Información del producto
    p.producto_id,
    p.nombre AS producto_nombre,
    p.codigo AS producto_codigo,
    -- Desglose temporal
    DATE(ml.fecha_movimiento) AS fecha,
    EXTRACT(YEAR FROM ml.fecha_movimiento) AS año,
    EXTRACT(MONTH FROM ml.fecha_movimiento) AS mes,
    EXTRACT(DAY FROM ml.fecha_movimiento) AS dia,
    TO_CHAR(ml.fecha_movimiento, 'YYYY-MM') AS año_mes,
    EXTRACT(HOUR FROM ml.fecha_movimiento) AS hora,
    -- Valor del movimiento
    CASE 
        WHEN ml.tipo_movimiento = 'ENTRADA' THEN ml.cantidad * COALESCE(l.precio_compra, 0)
        WHEN ml.tipo_movimiento = 'SALIDA' THEN ml.cantidad * COALESCE(l.precio_compra, 0) * -1
        ELSE 0
    END AS valor_movimiento
FROM movimientos_lotes ml
JOIN lotes l ON ml.lote_id = l.lote_id
JOIN productos p ON l.producto_id = p.producto_id
LEFT JOIN usuarios u ON ml.usuario_id = u.usuario_id
WHERE l.deleted_at IS NULL AND p.deleted_at IS NULL
ORDER BY ml.fecha_movimiento DESC;

-- Comentarios
COMMENT ON VIEW v_power_bi_lotes IS 'Vista completa de lotes optimizada para Power BI con cálculos temporales y de riesgo';
COMMENT ON VIEW v_power_bi_vencimientos_mensual IS 'Análisis mensual de vencimientos optimizado para Power BI';
COMMENT ON VIEW v_power_bi_productos_inventario IS 'Análisis de productos con inventario y estadísticas de lotes';
COMMENT ON VIEW v_power_bi_movimientos_lotes IS 'Movimientos de lotes con desglose temporal para Power BI';

