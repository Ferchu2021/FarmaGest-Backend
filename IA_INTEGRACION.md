# 🤖 Integración con IA - FarmaGest

## 🎯 Casos de Uso para IA en FarmaGest

### 1. **Búsqueda Semántica de Productos**
   - Buscar productos por descripción natural
   - Encontrar productos similares basados en significado
   - Recomendaciones inteligentes

### 2. **Análisis Predictivo**
   - Predecir demanda de productos
   - Identificar productos con riesgo de quedarse sin stock
   - Predecir tendencias de ventas

### 3. **Recomendaciones Inteligentes**
   - Productos similares
   - Productos frecuentemente comprados juntos
   - Recomendaciones personalizadas para clientes

### 4. **Análisis de Sentimiento** (Futuro)
   - Analizar comentarios de clientes
   - Detectar problemas comunes

## 📦 Instalación de Extensiones

### Paso 1: Instalar pgvector (Para Búsqueda Semántica)

```bash
# En Ubuntu/Debian
sudo apt-get install postgresql-15-pgvector

# O compilar desde fuente
git clone --branch v0.5.1 https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install
```

Luego en PostgreSQL:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Paso 2: Instalar Otras Extensiones Útiles

```sql
-- Para análisis estadístico
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Para funciones matemáticas avanzadas
CREATE EXTENSION IF NOT EXISTS plpython3u; -- Requiere Python 3
```

## 🔍 Implementación: Búsqueda Semántica

### Configuración Inicial

1. **Generar Embeddings** (usando OpenAI, Cohere, o modelo local)

```javascript
// scripts/generar-embeddings.js
const { Pool } = require('pg');
const OpenAI = require('openai'); // O tu servicio de embeddings

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function generarEmbeddings() {
  const client = await pool.connect();
  
  try {
    // Obtener productos sin embeddings
    const result = await client.query(`
      SELECT producto_id, nombre, descripcion 
      FROM productos 
      WHERE embedding IS NULL AND deleted_at IS NULL
    `);
    
    for (const producto of result.rows) {
      const texto = `${producto.nombre} ${producto.descripcion || ''}`;
      
      // Generar embedding (ejemplo con OpenAI)
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: texto,
      });
      
      const embedding = response.data[0].embedding;
      
      // Guardar en PostgreSQL
      await client.query(`
        UPDATE productos 
        SET embedding = $1::vector 
        WHERE producto_id = $2
      `, [JSON.stringify(embedding), producto.producto_id]);
      
      console.log(`Embedding generado para: ${producto.nombre}`);
    }
  } finally {
    client.release();
  }
}

generarEmbeddings();
```

### Búsqueda Semántica

```sql
-- Función para buscar productos similares usando embeddings
CREATE OR REPLACE FUNCTION buscar_productos_similares(
    p_busqueda TEXT,
    p_limite INTEGER DEFAULT 10
)
RETURNS TABLE (
    producto_id INTEGER,
    nombre VARCHAR,
    codigo VARCHAR,
    marca VARCHAR,
    precio DECIMAL,
    similitud FLOAT
) AS $$
DECLARE
    v_embedding vector(1536);
BEGIN
    -- Aquí deberías generar el embedding del texto de búsqueda
    -- Por ahora, usamos una búsqueda por texto como fallback
    
    RETURN QUERY
    SELECT 
        p.producto_id,
        p.nombre,
        p.codigo,
        p.marca,
        p.precio,
        -- Similitud usando cosine distance (1 - cosine similarity)
        CASE 
            WHEN p.embedding IS NOT NULL THEN 
                1 - (p.embedding <=> v_embedding) -- <=> es el operador de distancia
            ELSE 
                ts_rank_cd(to_tsvector('spanish', p.nombre), plainto_tsquery('spanish', p_busqueda))
        END AS similitud
    FROM productos p
    WHERE p.deleted_at IS NULL
        AND (
            p.embedding IS NOT NULL 
            OR to_tsvector('spanish', p.nombre) @@ plainto_tsquery('spanish', p_busqueda)
        )
    ORDER BY similitud DESC
    LIMIT p_limite;
END;
$$ LANGUAGE plpgsql;
```

## 📊 Implementación: Análisis Predictivo

### Predecir Demanda de Productos

```sql
-- Función para predecir demanda basada en histórico
CREATE OR REPLACE FUNCTION predecir_demanda_producto(
    p_producto_id INTEGER,
    p_dias INTEGER DEFAULT 30
)
RETURNS TABLE (
    producto_id INTEGER,
    nombre VARCHAR,
    stock_actual INTEGER,
    demanda_predicha DECIMAL,
    dias_restantes INTEGER,
    riesgo_stock BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH ventas_historico AS (
        SELECT 
            DATE(iv.created_at) AS fecha,
            SUM(iv.cantidad) AS cantidad_vendida
        FROM items_venta iv
        JOIN ventas v ON iv.venta_id = v.venta_id
        WHERE iv.producto_id = p_producto_id
            AND iv.created_at >= CURRENT_DATE - INTERVAL '90 days'
        GROUP BY DATE(iv.created_at)
    ),
    estadisticas AS (
        SELECT 
            AVG(cantidad_vendida) AS promedio_diario,
            STDDEV(cantidad_vendida) AS desviacion_estandar
        FROM ventas_historico
    )
    SELECT 
        p.producto_id,
        p.nombre,
        p.stock AS stock_actual,
        (s.promedio_diario * p_dias)::DECIMAL AS demanda_predicha,
        CASE 
            WHEN s.promedio_diario > 0 THEN 
                (p.stock / s.promedio_diario)::INTEGER
            ELSE NULL
        END AS dias_restantes,
        (p.stock < (s.promedio_diario * 7)) AS riesgo_stock -- Menos de 7 días de stock
    FROM productos p
    CROSS JOIN estadisticas s
    WHERE p.producto_id = p_producto_id
        AND p.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;
```

### Endpoint API para Predicciones

```javascript
// routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db-postgresql');

// Endpoint: Predecir demanda de un producto
router.get('/prediccion/demanda/:productoId', async (req, res) => {
  try {
    const { productoId } = req.params;
    const { dias = 30 } = req.query;
    
    const result = await db.query(
      'SELECT * FROM predecir_demanda_producto($1, $2)',
      [productoId, dias]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error en predicción:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint: Búsqueda semántica de productos
router.post('/busqueda/semantica', async (req, res) => {
  try {
    const { busqueda, limite = 10 } = req.body;
    
    const result = await db.query(
      'SELECT * FROM buscar_productos_similares($1, $2)',
      [busqueda, limite]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error en búsqueda semántica:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
```

## 🎯 Recomendaciones Inteligentes

### Productos Frecuentemente Comprados Juntos

```sql
-- Función para encontrar productos frecuentemente comprados juntos
CREATE OR REPLACE FUNCTION productos_frecuentes_juntos(
    p_producto_id INTEGER,
    p_limite INTEGER DEFAULT 5
)
RETURNS TABLE (
    producto_id INTEGER,
    nombre VARCHAR,
    veces_comprados_juntos INTEGER,
    porcentaje_coincidencia DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH ventas_con_producto AS (
        SELECT DISTINCT v.venta_id
        FROM items_venta iv
        JOIN ventas v ON iv.venta_id = v.venta_id
        WHERE iv.producto_id = p_producto_id
    ),
    productos_juntos AS (
        SELECT 
            iv2.producto_id,
            COUNT(*) AS veces_comprados_juntos
        FROM ventas_con_producto vcp
        JOIN items_venta iv2 ON vcp.venta_id = iv2.venta_id
        WHERE iv2.producto_id != p_producto_id
        GROUP BY iv2.producto_id
    ),
    total_ventas_producto AS (
        SELECT COUNT(*)::DECIMAL AS total
        FROM ventas_con_producto
    )
    SELECT 
        p.producto_id,
        p.nombre,
        pj.veces_comprados_juntos,
        (pj.veces_comprados_juntos / t.total * 100)::DECIMAL AS porcentaje_coincidencia
    FROM productos_juntos pj
    JOIN productos p ON pj.producto_id = p.producto_id
    CROSS JOIN total_ventas_producto t
    WHERE p.deleted_at IS NULL
    ORDER BY pj.veces_comprados_juntos DESC
    LIMIT p_limite;
END;
$$ LANGUAGE plpgsql;
```

## 📈 Análisis de Tendencias

### Detectar Tendencias de Ventas

```sql
-- Función para detectar tendencias (creciente/decreciente)
CREATE OR REPLACE FUNCTION analizar_tendencia_ventas(
    p_dias INTEGER DEFAULT 30
)
RETURNS TABLE (
    producto_id INTEGER,
    nombre VARCHAR,
    ventas_actuales DECIMAL,
    ventas_anteriores DECIMAL,
    cambio_porcentual DECIMAL,
    tendencia VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    WITH ventas_actuales AS (
        SELECT 
            iv.producto_id,
            AVG(iv.cantidad) AS promedio_ventas
        FROM items_venta iv
        JOIN ventas v ON iv.venta_id = v.venta_id
        WHERE v.fecha_hora >= CURRENT_DATE - (p_dias || ' days')::INTERVAL
            AND v.fecha_hora < CURRENT_DATE - (p_dias / 2 || ' days')::INTERVAL
        GROUP BY iv.producto_id
    ),
    ventas_anteriores AS (
        SELECT 
            iv.producto_id,
            AVG(iv.cantidad) AS promedio_ventas
        FROM items_venta iv
        JOIN ventas v ON iv.venta_id = v.venta_id
        WHERE v.fecha_hora >= CURRENT_DATE - (p_dias / 2 || ' days')::INTERVAL
            AND v.fecha_hora < CURRENT_DATE
        GROUP BY iv.producto_id
    )
    SELECT 
        va.producto_id,
        p.nombre,
        va.promedio_ventas AS ventas_actuales,
        van.promedio_ventas AS ventas_anteriores,
        CASE 
            WHEN van.promedio_ventas > 0 THEN 
                ((va.promedio_ventas - van.promedio_ventas) / van.promedio_ventas * 100)::DECIMAL
            ELSE 0
        END AS cambio_porcentual,
        CASE 
            WHEN va.promedio_ventas > van.promedio_ventas * 1.1 THEN 'CRECIENTE'
            WHEN va.promedio_ventas < van.promedio_ventas * 0.9 THEN 'DECRECIENTE'
            ELSE 'ESTABLE'
        END AS tendencia
    FROM ventas_actuales va
    JOIN ventas_anteriores van ON va.producto_id = van.producto_id
    JOIN productos p ON va.producto_id = p.producto_id
    WHERE p.deleted_at IS NULL
    ORDER BY ABS(va.promedio_ventas - van.promedio_ventas) DESC;
END;
$$ LANGUAGE plpgsql;
```

## 🚀 Próximos Pasos

1. **Instalar pgvector** en tu servidor PostgreSQL
2. **Configurar servicio de embeddings** (OpenAI, Cohere, o modelo local)
3. **Ejecutar script de generación de embeddings** para productos existentes
4. **Integrar endpoints de IA** en tu aplicación
5. **Crear dashboards** con análisis predictivo

## 📚 Recursos Adicionales

- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [PostgreSQL Machine Learning](https://www.postgresql.org/docs/current/plpython.html)




