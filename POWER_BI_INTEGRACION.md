# 📊 Integración con Power BI - FarmaGest

## 🔗 Conectar Power BI a PostgreSQL

### Paso 1: Instalar el Conector de PostgreSQL

1. Abre Power BI Desktop
2. Ve a **Obtener datos** → **Más...**
3. Busca "**PostgreSQL database**"
4. Selecciona y haz clic en **Conectar**

### Paso 2: Configurar la Conexión

```
Servidor: localhost (o tu IP del servidor)
Base de datos: farma_gest
Usuario: farma_app
Contraseña: FarmaApp2024!
```

**Opciones avanzadas:**
- Modo de conectividad: **Importar** (recomendado para mejor rendimiento)
- Nivel de compatibilidad: **PostgreSQL 12+**

### Paso 3: Seleccionar Vistas

Para mejor rendimiento, usa las **vistas optimizadas** creadas específicamente para Power BI:

#### ✅ Vistas Recomendadas:

1. **`v_ventas_completas`**
   - Todas las ventas con detalles completos
   - Incluye cliente, usuario, fechas descompuestas
   - Optimizada para análisis temporal

2. **`v_items_venta_detalle`**
   - Items de venta con detalles de productos
   - Incluye categorías y información del cliente

3. **`v_productos_mas_vendidos`**
   - Análisis de productos más vendidos
   - Incluye totales, promedios y estadísticas

4. **`v_clientes_analisis`**
   - Análisis completo de clientes
   - Incluye totales de compras y promedios

5. **`v_ventas_por_periodo`**
   - Ventas agrupadas por período
   - Optimizada para análisis temporal y dashboards

### Paso 4: Crear Modelo de Datos

1. **Importar todas las vistas recomendadas**
2. **Crear relaciones** entre tablas si es necesario
3. **Definir medidas** para cálculos comunes

#### 📊 Medidas Recomendadas:

```DAX
Total Ventas = SUM(v_ventas_completas[total])

Total Ventas MTD = 
CALCULATE(
    [Total Ventas],
    FILTER(
        ALL(v_ventas_completas[fecha]),
        v_ventas_completas[fecha] >= EOMONTH(TODAY(), -1) + 1
    )
)

Promedio Venta = AVERAGE(v_ventas_completas[total])

Cantidad Ventas = COUNTROWS(v_ventas_completas)

Productos Más Vendidos = 
CALCULATE(
    SUM(v_productos_mas_vendidos[total_vendido]),
    TOPN(10, v_productos_mas_vendidos, v_productos_mas_vendidos[total_vendido])
)
```

### Paso 5: Crear Dashboards

#### 📈 Dashboard 1: Ventas

**Visualizaciones sugeridas:**
- **Gráfico de líneas**: Ventas por fecha (día/mes)
- **Tarjeta**: Total ventas del mes
- **Tarjeta**: Promedio de venta
- **Tabla**: Top 10 productos más vendidos
- **Gráfico de barras**: Ventas por vendedor

#### 📊 Dashboard 2: Análisis de Clientes

**Visualizaciones sugeridas:**
- **Tabla**: Clientes con más compras
- **Gráfico de dona**: Distribución por obra social
- **Gráfico de barras**: Top 10 clientes por gasto total
- **Mapa**: Distribución geográfica (si tienes datos de ciudades)

#### 📦 Dashboard 3: Inventario

**Visualizaciones sugeridas:**
- **Tarjeta**: Productos con stock bajo
- **Tabla**: Productos más vendidos
- **Gráfico de barras**: Productos por categoría
- **Indicador**: Nivel de stock promedio

## 🔄 Actualización de Datos

### Configurar Actualización Automática

1. En Power BI Desktop: **Archivo** → **Opciones y configuración** → **Configuración del origen de datos**
2. Selecciona tu conexión PostgreSQL
3. Configura la actualización automática (requiere Power BI Pro/Premium)

### Programar Actualización

1. En Power BI Service
2. Ve a **Configuración** → **Conjuntos de datos**
3. Selecciona tu conjunto de datos
4. Configura la **actualización programada**

## 📝 Mejores Prácticas

### 1. Usar Vistas en lugar de Tablas Directas
- Las vistas están optimizadas para análisis
- Incluyen cálculos pre-agregados
- Mejor rendimiento

### 2. Importar Solo lo Necesario
- No importes todas las tablas
- Usa las vistas específicas para tu análisis
- Filtra datos históricos si es necesario

### 3. Optimizar Consultas
- Usa filtros en las vistas
- Crea medidas en lugar de columnas calculadas cuando sea posible
- Usa relaciones bien definidas

### 4. Actualización Incremental
- Configura actualización incremental para grandes volúmenes
- Define rangos de fechas para actualizar solo datos recientes

## 🚀 Ejemplos de Consultas Avanzadas

### Query para Análisis de Tendencias

```sql
SELECT 
    DATE_TRUNC('month', fecha_hora) AS mes,
    COUNT(*) AS cantidad_ventas,
    SUM(total) AS monto_total,
    AVG(total) AS promedio_venta,
    COUNT(DISTINCT cliente_id) AS clientes_unicos
FROM v_ventas_completas
WHERE fecha_hora >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', fecha_hora)
ORDER BY mes DESC;
```

### Query para Análisis de Productos

```sql
SELECT 
    categoria_nombre,
    COUNT(DISTINCT producto_id) AS cantidad_productos,
    SUM(total_vendido) AS unidades_vendidas,
    SUM(ingresos_totales) AS ingresos_totales
FROM v_productos_mas_vendidos
GROUP BY categoria_nombre
ORDER BY ingresos_totales DESC;
```

## ⚠️ Troubleshooting

### Error: "No se puede conectar al servidor"

**Solución:**
1. Verifica que PostgreSQL esté corriendo
2. Verifica la configuración de firewall
3. Verifica las credenciales en `.env`

### Error: "Timeout al conectar"

**Solución:**
1. Aumenta el timeout en la configuración de Power BI
2. Verifica la carga del servidor PostgreSQL
3. Usa modo de importación en lugar de DirectQuery

### Rendimiento Lento

**Solución:**
1. Usa vistas en lugar de tablas directas
2. Limita el rango de fechas
3. Crea índices adicionales si es necesario
4. Usa modo de importación en lugar de DirectQuery

## 📚 Recursos Adicionales

- [Documentación oficial de Power BI](https://docs.microsoft.com/power-bi/)
- [Conector PostgreSQL para Power BI](https://docs.microsoft.com/power-bi/connect-data/desktop-connect-to-postgresql)
- [Mejores prácticas de Power BI](https://docs.microsoft.com/power-bi/guidance/)




