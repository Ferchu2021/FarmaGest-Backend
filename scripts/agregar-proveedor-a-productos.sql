-- Script para agregar campo proveedor_id a la tabla productos
-- y actualizar productos existentes con proveedores aleatorios

-- 1. Agregar columna proveedor_id a la tabla productos (si no existe)
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS proveedor_id INTEGER REFERENCES proveedores(proveedor_id) ON DELETE SET NULL;

-- 2. Crear índice para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_productos_proveedor_id ON productos(proveedor_id);

-- 3. Agregar proveedores aleatorios a productos existentes que no tengan proveedor
UPDATE productos 
SET proveedor_id = (
    SELECT proveedor_id 
    FROM proveedores 
    ORDER BY RANDOM() 
    LIMIT 1
)
WHERE proveedor_id IS NULL AND deleted_at IS NULL;

-- 4. Verificar resultado
SELECT 
    COUNT(*) as total_productos,
    COUNT(proveedor_id) as productos_con_proveedor,
    COUNT(*) - COUNT(proveedor_id) as productos_sin_proveedor
FROM productos 
WHERE deleted_at IS NULL;








