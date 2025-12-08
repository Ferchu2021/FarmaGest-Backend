# 📊 Guía de Gráficos Power BI - FarmaGest

## 🎯 Recomendaciones por Tipo de Dashboard

---

## 📈 DASHBOARD 1: VENTAS Y RENDIMIENTO

### 1. **Gráfico de Líneas** - Tendencias de Ventas
**Vista:** `v_ventas_por_periodo`

**Configuración:**
- **Eje X:** `fecha` (o `año_mes` para agrupamiento mensual)
- **Eje Y:** `monto_total` (Valor del eje)
- **Leyenda (Opcional):** `año` para comparar años

**Caso de uso:** Ver tendencia de ventas en el tiempo

---

### 2. **Tarjeta (Card)** - Total de Ventas del Mes
**Vista:** `v_ventas_completas`

**Configuración:**
- **Campos:** Crear medida DAX
```DAX
Total Ventas MTD = 
CALCULATE(
    SUM(v_ventas_completas[total]),
    FILTER(
        ALL(v_ventas_completas),
        YEAR(v_ventas_completas[fecha]) = YEAR(TODAY()) &&
        MONTH(v_ventas_completas[fecha]) = MONTH(TODAY())
    )
)
```
- **Formato:** Moneda (AR$)

**Caso de uso:** KPI principal del dashboard

---

### 3. **Tarjeta (Card)** - Promedio de Venta
**Vista:** `v_ventas_completas`

**Configuración:**
- **Campos:** Crear medida DAX
```DAX
Promedio Venta = AVERAGE(v_ventas_completas[total])
```
- **Formato:** Moneda (AR$)

**Caso de uso:** Indicador de valor promedio por transacción

---

### 4. **Tabla** - Top 10 Productos Más Vendidos
**Vista:** `v_productos_mas_vendidos`

**Configuración:**
- **Columnas:**
  - `nombre` (Producto)
  - `total_vendido` (Cantidad vendida)
  - `ingresos_totales` (Ingresos)
  - `categoria` (Categoría)
- **Ordenar por:** `total_vendido` (Descendente)
- **Top N:** 10

**Caso de uso:** Identificar productos estrella

---

### 5. **Gráfico de Barras Apiladas** - Ventas por Categoría
**Vista:** `v_items_venta_detalle`

**Configuración:**
- **Eje X:** `categoria_nombre`
- **Eje Y:** `total_item` (Suma)
- **Leyenda (Opcional):** `producto_marca` para desglose adicional

**Caso de uso:** Ver distribución de ventas por categoría de productos

---

### 6. **Gráfico de Barras** - Ventas por Vendedor
**Vista:** `v_ventas_completas`

**Configuración:**
- **Eje X:** `usuario_nombre_completo`
- **Eje Y:** `total` (Suma)
- **Ordenar por:** Valor (Descendente)

**Caso de uso:** Comparar rendimiento de vendedores

---

### 7. **Gráfico de Área** - Ventas por Día de la Semana
**Vista:** `v_ventas_por_periodo`

**Configuración:**
- **Eje X:** `dia_semana` (crear columna calculada con nombres)
- **Eje Y:** `monto_total` (Suma)
- **Agregar columna calculada:**
```DAX
Dia Semana Nombre = 
SWITCH(
    v_ventas_por_periodo[dia_semana],
    0, "Domingo",
    1, "Lunes",
    2, "Martes",
    3, "Miércoles",
    4, "Jueves",
    5, "Viernes",
    6, "Sábado",
    "Desconocido"
)
```

**Caso de uso:** Identificar días de mayor venta

---

## 👥 DASHBOARD 2: ANÁLISIS DE CLIENTES

### 8. **Tabla** - Top 10 Clientes por Gasto Total
**Vista:** `v_clientes_analisis`

**Configuración:**
- **Columnas:**
  - `nombre_completo`
  - `total_gastado`
  - `total_compras`
  - `promedio_compra`
  - `obra_social`
  - `ultima_compra`
- **Ordenar por:** `total_gastado` (Descendente)
- **Formato:** `total_gastado` y `promedio_compra` como Moneda

**Caso de uso:** Identificar clientes VIP

---

### 9. **Gráfico de Dona (Donut Chart)** - Distribución por Obra Social
**Vista:** `v_clientes_analisis`

**Configuración:**
- **Leyenda:** `obra_social`
- **Valores:** `total_compras` (Conteo) o `total_gastado` (Suma)

**Caso de uso:** Ver distribución de clientes por obra social

---

### 10. **Gráfico de Barras Horizontales** - Clientes con Más Compras
**Vista:** `v_clientes_analisis`

**Configuración:**
- **Eje Y:** `nombre_completo`
- **Eje X:** `total_compras` (Suma)
- **Ordenar por:** Valor (Ascendente)
- **Top N:** 15

**Caso de uso:** Clientes más frecuentes

---

### 11. **Gráfico de Dispersión (Scatter)** - Frecuencia vs Gasto Total
**Vista:** `v_clientes_analisis`

**Configuración:**
- **Eje X:** `total_compras`
- **Eje Y:** `total_gastado`
- **Tamaño:** `promedio_compra`
- **Leyenda:** `obra_social` (opcional)

**Caso de uso:** Segmentación de clientes (frecuentes vs grandes compradores)

---

## 📦 DASHBOARD 3: INVENTARIO Y PRODUCTOS

### 12. **Matriz (Matrix)** - Productos con Stock y Ventas
**Vista:** `v_power_bi_productos_inventario`

**Configuración:**
- **Filas:** `categoria_nombre`, `nombre`
- **Columnas:** Ninguna (o `año_mes` para temporal)
- **Valores:**
  - `stock` (Suma)
  - `stock_en_lotes` (Suma)
  - `unidades_vendidas_30d` (Suma)
  - `ingresos_30d` (Suma)
- **Formato condicional:** Rojo si `stock < 10`

**Caso de uso:** Vista completa de inventario con contexto de ventas

---

### 13. **Indicador (Gauge)** - Nivel de Stock Promedio
**Vista:** `v_power_bi_productos_inventario`

**Configuración:**
- **Valor:** `stock` (Promedio)
- **Valor objetivo:** Establecer umbral (ej: 50)
- **Valor máximo:** `stock` (Máximo)

**Caso de uso:** Indicador general de salud del inventario

---

### 14. **Gráfico de Barras** - Productos por Categoría
**Vista:** `v_productos_mas_vendidos`

**Configuración:**
- **Eje X:** `categoria`
- **Eje Y:** `nombre` (Conteo de productos distintos)
- **Leyenda (Opcional):** Colorear por rango de precio

**Caso de uso:** Ver distribución de productos en categorías

---

### 15. **Tarjeta (Card)** - Valor Total del Inventario
**Vista:** `v_power_bi_productos_inventario`

**Configuración:**
- **Campos:** Crear medida DAX
```DAX
Valor Inventario Total = 
SUM(v_power_bi_productos_inventario[valor_inventario_lotes])
```
- **Formato:** Moneda (AR$)

**Caso de uso:** KPI de valor de inventario

---

## ⚠️ DASHBOARD 4: CONTROL DE VENCIMIENTOS

### 16. **Tarjeta (Card)** - Lotes Vencidos
**Vista:** `v_power_bi_lotes`

**Configuración:**
- **Campos:** Crear medida DAX
```DAX
Lotes Vencidos = 
CALCULATE(
    COUNTROWS(v_power_bi_lotes),
    v_power_bi_lotes[nivel_alerta] = "VENCIDO"
)
```
- **Color:** Rojo (alertas críticas)

**Caso de uso:** Indicador crítico de lotes vencidos

---

### 17. **Tarjeta (Card)** - Pérdida Económica Total
**Vista:** `v_power_bi_lotes`

**Configuración:**
- **Campos:** Crear medida DAX
```DAX
Pérdida Total Vencidos = 
CALCULATE(
    SUM(v_power_bi_lotes[perdida_vencido]),
    v_power_bi_lotes[nivel_alerta] = "VENCIDO"
)
```
- **Formato:** Moneda (AR$)
- **Color:** Rojo

**Caso de uso:** Impacto financiero de vencimientos

---

### 18. **Tarjeta (Card)** - Valor en Riesgo (30 días)
**Vista:** `v_power_bi_lotes`

**Configuración:**
- **Campos:** Crear medida DAX
```DAX
Valor en Riesgo = 
SUM(v_power_bi_lotes[riesgo_potencial_30dias])
```
- **Formato:** Moneda (AR$)
- **Color:** Naranja (alerta)

**Caso de uso:** Prevenir futuras pérdidas

---

### 19. **Gráfico de Barras** - Pérdidas por Mes
**Vista:** `v_power_bi_vencimientos_mensual`

**Configuración:**
- **Eje X:** `año_mes`
- **Eje Y:** `perdida_economica` (Suma)
- **Formato:** Moneda en el eje Y
- **Color:** Rojo

**Caso de uso:** Tendencias de pérdidas mensuales

---

### 20. **Matriz (Matrix)** - Lotes por Nivel de Alerta
**Vista:** `v_power_bi_lotes`

**Configuración:**
- **Filas:** `nivel_alerta`
- **Columnas:** `categoria_nombre`
- **Valores:**
  - `lote_id` (Conteo)
  - `cantidad_actual` (Suma)
  - `perdida_vencido` (Suma)
- **Formato condicional:** Por nivel de alerta
  - VENCIDO: Rojo
  - CRÍTICO: Naranja
  - PRÓXIMO: Amarillo
  - NORMAL: Verde

**Caso de uso:** Vista general del estado de lotes

---

### 21. **Gráfico de Dispersión (Scatter)** - Valor vs Días hasta Vencimiento
**Vista:** `v_power_bi_lotes`

**Configuración:**
- **Eje X:** `dias_hasta_vencimiento`
- **Eje Y:** `valor_inventario_lote`
- **Leyenda:** `nivel_alerta`
- **Tamaño:** `cantidad_actual`
- **Líneas de referencia:**
  - X = 0 (vencido)
  - X = 30 (30 días)

**Caso de uso:** Visualizar urgencia vs valor de los lotes

---

### 22. **Tabla** - Top 10 Productos con Más Lotes Vencidos
**Vista:** `v_power_bi_lotes`

**Configuración:**
- **Columnas:**
  - `producto_nombre`
  - `numero_lote`
  - `fecha_vencimiento`
  - `dias_hasta_vencimiento` (para vencidos será negativo)
  - `cantidad_actual`
  - `perdida_vencido`
- **Filtros:**
  - `nivel_alerta` = "VENCIDO"
- **Ordenar por:** `perdida_vencido` (Descendente)
- **Top N:** 10

**Caso de uso:** Priorizar acciones correctivas

---

### 23. **Gráfico de Área Apilada** - Evolución de Vencimientos
**Vista:** `v_power_bi_vencimientos_mensual`

**Configuración:**
- **Eje X:** `mes_vencimiento`
- **Eje Y:** `perdida_economica` (Suma)
- **Leyenda:** Crear categoría de alerta basada en mes

**Caso de uso:** Ver tendencia de pérdidas a lo largo del tiempo

---

## 📊 DASHBOARD 5: ANÁLISIS DE MOVIMIENTOS

### 24. **Gráfico de Líneas** - Movimientos de Lotes por Tipo
**Vista:** `v_power_bi_movimientos_lotes`

**Configuración:**
- **Eje X:** `fecha`
- **Eje Y:** `cantidad` (Suma)
- **Leyenda:** `tipo_movimiento`
- **Múltiples líneas:** Una por cada tipo (ENTRADA, SALIDA, AJUSTE)

**Caso de uso:** Ver flujo de inventario en el tiempo

---

### 25. **Gráfico de Barras Apiladas** - Movimientos por Usuario
**Vista:** `v_power_bi_movimientos_lotes`

**Configuración:**
- **Eje X:** `usuario_nombre`
- **Eje Y:** `cantidad` (Suma)
- **Leyenda:** `tipo_movimiento`

**Caso de uso:** Auditoría de movimientos por usuario

---

### 26. **Gráfico de Embudo (Funnel)** - Flujo de Movimientos
**Vista:** `v_power_bi_movimientos_lotes`

**Configuración:**
- **Categoría:** `tipo_movimiento`
- **Valores:** `cantidad` (Suma)
- **Orden:** ENTRADA → SALIDA → AJUSTE

**Caso de uso:** Ver proporción de tipos de movimientos

---

## 🎨 RECOMENDACIONES GENERALES

### Colores Sugeridos:
- **Éxito/Ventas:** Verde (#10B981)
- **Alertas/Críticas:** Rojo (#EF4444)
- **Advertencias:** Naranja (#F59E0B)
- **Información:** Azul (#3B82F6)
- **Neutro:** Gris (#6B7280)

### Formato de Números:
- **Moneda:** `AR$ #,##0.00`
- **Porcentajes:** `0.00%`
- **Números grandes:** `#,##0` o `#,##0.0K`

### Interacciones:
- Configura **Interacciones visuales** para que los gráficos se filtren entre sí
- Usa **Segmentadores (Slicers)** para:
  - Rango de fechas
  - Categorías
  - Nivel de alerta (para vencimientos)

### Medidas DAX Comunes:

```DAX
// Total Ventas
Total Ventas = SUM(v_ventas_completas[total])

// Total Ventas Mes Actual
Total Ventas MTD = 
CALCULATE(
    [Total Ventas],
    FILTER(
        ALL(v_ventas_completas),
        YEAR(v_ventas_completas[fecha]) = YEAR(TODAY()) &&
        MONTH(v_ventas_completas[fecha]) = MONTH(TODAY())
    )
)

// Crecimiento Mes a Mes
Crecimiento MoM = 
VAR VentasMesActual = [Total Ventas MTD]
VAR VentasMesAnterior = 
    CALCULATE(
        [Total Ventas],
        DATEADD(v_ventas_completas[fecha], -1, MONTH)
    )
RETURN
    DIVIDE(
        VentasMesActual - VentasMesAnterior,
        VentasMesAnterior,
        0
    )

// Lotes Vencidos
Lotes Vencidos = 
CALCULATE(
    COUNTROWS(v_power_bi_lotes),
    v_power_bi_lotes[nivel_alerta] = "VENCIDO"
)

// Pérdida Total
Pérdida Total = 
SUM(v_power_bi_lotes[perdida_vencido])

// Valor en Riesgo (30 días)
Valor en Riesgo = 
SUM(v_power_bi_lotes[riesgo_potencial_30dias])

// Stock Bajo (< 10 unidades)
Productos Stock Bajo = 
CALCULATE(
    COUNTROWS(v_power_bi_productos_inventario),
    v_power_bi_productos_inventario[stock] < 10
)
```

---

## 📋 CHECKLIST POR DASHBOARD

### Dashboard de Ventas:
- [ ] Gráfico de líneas: Tendencias de ventas
- [ ] Tarjeta: Total ventas MTD
- [ ] Tarjeta: Promedio de venta
- [ ] Tabla: Top 10 productos
- [ ] Gráfico de barras: Ventas por categoría
- [ ] Gráfico de barras: Ventas por vendedor
- [ ] Segmentador de fecha

### Dashboard de Clientes:
- [ ] Tabla: Top 10 clientes
- [ ] Gráfico de dona: Distribución por obra social
- [ ] Gráfico de barras: Clientes más frecuentes
- [ ] Gráfico de dispersión: Frecuencia vs Gasto

### Dashboard de Inventario:
- [ ] Matriz: Productos con stock
- [ ] Indicador: Nivel de stock
- [ ] Tarjeta: Valor inventario total
- [ ] Gráfico de barras: Productos por categoría

### Dashboard de Vencimientos:
- [ ] Tarjeta: Lotes vencidos
- [ ] Tarjeta: Pérdida económica
- [ ] Tarjeta: Valor en riesgo
- [ ] Gráfico de barras: Pérdidas por mes
- [ ] Matriz: Lotes por nivel de alerta
- [ ] Tabla: Top productos vencidos
- [ ] Gráfico de dispersión: Valor vs Días

---

✨ **¡Con estos gráficos tendrás dashboards profesionales y completos!** ✨

