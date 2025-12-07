# 🚀 Guía Rápida - Integración Power BI

## 📋 Pasos Rápidos

### 1. Preparar la Base de Datos

```bash
# Desde el directorio del backend
node scripts/aplicar-vistas-power-bi.js
```

Esto creará todas las vistas optimizadas para Power BI.

### 2. Obtener Datos de Conexión

```bash
node scripts/configurar-power-bi.js
```

Esto mostrará:
- Servidor y puerto
- Nombre de la base de datos
- Usuario y contraseña
- Lista completa de vistas disponibles

### 3. Conectar Power BI

1. Abre **Power BI Desktop**
2. **Obtener datos** → **Más...**
3. Busca **"PostgreSQL database"**
4. Ingresa los datos mostrados por el script anterior
5. Selecciona las vistas recomendadas
6. Modo: **"Importar"** (recomendado)
7. Haz clic en **"Cargar"**

## 📊 Vistas Recomendadas por Dashboard

### Dashboard de Ventas
- `v_ventas_completas`
- `v_items_venta_detalle`
- `v_ventas_por_periodo`

### Dashboard de Clientes
- `v_clientes_analisis`
- `v_ventas_completas`

### Dashboard de Productos
- `v_productos_mas_vendidos`
- `v_power_bi_productos_inventario`
- `v_items_venta_detalle`

### Dashboard de Vencimientos ⭐
- `v_power_bi_lotes`
- `v_power_bi_vencimientos_mensual`
- `v_resumen_perdidas_vencimientos`
- `v_detalle_lotes_vencidos`

### Dashboard de Inventario
- `v_power_bi_productos_inventario`
- `v_power_bi_movimientos_lotes`
- `v_power_bi_lotes`

## 🔗 Relaciones Recomendadas

Crea relaciones entre las vistas usando:

- `producto_id` entre vistas de productos
- `venta_id` entre vistas de ventas
- `cliente_id` entre vistas de clientes
- `lote_id` entre vistas de lotes

## 📈 Medidas DAX Útiles

```DAX
// Ventas
Total Ventas = SUM(v_ventas_completas[total])
Total Ventas MTD = CALCULATE([Total Ventas], DATESMTD(v_ventas_completas[fecha]))
Promedio Venta = AVERAGE(v_ventas_completas[total])

// Vencimientos
Lotes Vencidos = CALCULATE(
    COUNTROWS(v_power_bi_lotes),
    v_power_bi_lotes[nivel_alerta] = "VENCIDO"
)
Pérdida Total = SUM(v_power_bi_lotes[perdida_vencido])
Valor en Riesgo = SUM(v_power_bi_lotes[riesgo_potencial_30dias])

// Inventario
Valor Inventario = SUM(v_power_bi_productos_inventario[valor_inventario_lotes])
Stock Total = SUM(v_power_bi_productos_inventario[stock_en_lotes])
```

## ✅ Checklist de Configuración

- [ ] Vistas aplicadas en la base de datos
- [ ] Power BI Desktop instalado
- [ ] Conexión a PostgreSQL configurada
- [ ] Vistas seleccionadas e importadas
- [ ] Relaciones creadas entre vistas
- [ ] Medidas DAX creadas
- [ ] Dashboards iniciales creados
- [ ] Actualización programada configurada (opcional)

## 🔄 Actualización de Datos

### En Power BI Desktop
- **Actualizar** (Ctrl + R) - Actualiza todos los datos

### En Power BI Service
1. Ve a **Configuración** → **Conjuntos de datos**
2. Selecciona tu conjunto de datos
3. Configura **actualización programada**
4. Define frecuencia (diaria, semanal, etc.)

## ⚠️ Troubleshooting Rápido

**No puedo conectar:**
- Verifica que PostgreSQL esté corriendo
- Verifica credenciales en `.env`
- Verifica que el puerto 5432 esté abierto

**Vistas no aparecen:**
- Ejecuta: `node scripts/aplicar-vistas-power-bi.js`
- Verifica permisos del usuario de base de datos

**Datos lentos:**
- Usa modo "Importar" en lugar de "DirectQuery"
- Limita el rango de fechas
- Crea índices adicionales si es necesario

## 📚 Documentación Completa

Para más detalles, consulta:
- `POWER_BI_INTEGRACION.md` - Guía completa
- `scripts/configurar-power-bi.js` - Script de configuración

## 🎯 Próximos Pasos

1. Crear tus primeros dashboards
2. Compartir reportes en Power BI Service
3. Configurar actualizaciones automáticas
4. Crear alertas en Power BI Service (requiere Pro/Premium)

---

✨ **¡Listo para crear reportes profesionales!** ✨

