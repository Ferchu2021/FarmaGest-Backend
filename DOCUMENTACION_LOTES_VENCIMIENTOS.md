# 📦 Sistema de Control de Vencimientos por Lote

## 🎯 Funcionalidades Implementadas

### 1. **Gestión de Lotes**
- Creación de lotes con número de lote único
- Fecha de vencimiento y fabricación
- Control de cantidad inicial y actual
- Precio de compra y venta por lote
- Asociación con proveedores

### 2. **Control de Vencimientos**
- Seguimiento automático de fechas de vencimiento
- Estados automáticos: ACTIVO, VENCIDO, PRONTO_VENCER, AGOTADO
- Alertas por productos próximos a vencer (30, 7 días)

### 3. **Auditoría Completa**
- Registro de todos los movimientos de lotes
- Tipos de movimiento: ENTRADA, SALIDA, AJUSTE, VENCIMIENTO, DESECHO
- Trazabilidad completa con usuario y fecha

### 4. **Reportes y Análisis**
- Productos próximos a vencer (próximos 30 días)
- Resumen de pérdidas económicas por vencimientos
- Cálculo de valor de inventario en riesgo

### 5. **Cálculo de Pérdidas Económicas**
- Identificación automática de productos vencidos
- Cálculo de pérdidas por lote y por mes
- Valor de inventario en riesgo

## 📊 Estructura de Base de Datos

### Tabla: `lotes`
```sql
- lote_id (PK)
- producto_id (FK)
- numero_lote (único por producto)
- fecha_vencimiento
- fecha_fabricacion
- cantidad_inicial
- cantidad_actual
- precio_compra
- precio_venta
- proveedor_id (FK)
- estado (ACTIVO, VENCIDO, PRONTO_VENCER, AGOTADO)
- ubicacion
- observaciones
```

### Tabla: `movimientos_lotes`
```sql
- movimiento_id (PK)
- lote_id (FK)
- tipo_movimiento
- cantidad
- cantidad_anterior
- cantidad_nueva
- motivo
- referencia_id
- referencia_tipo
- usuario_id (FK)
- fecha_movimiento
```

## 🔌 Endpoints API

### GET `/api/lotes`
Obtener todos los lotes con filtros
- Parámetros: `page`, `pageSize`, `search`, `productoId`, `estado`, `diasVencimiento`

### GET `/api/lotes/por-vencer`
Obtener productos próximos a vencer
- Parámetros: `dias` (default: 30)

### GET `/api/lotes/perdidas`
Obtener resumen de pérdidas por vencimientos
- Parámetros: `fechaDesde`, `fechaHasta`

### GET `/api/lotes/:id/movimientos`
Obtener historial de movimientos de un lote

### POST `/api/lotes`
Crear un nuevo lote

### PUT `/api/lotes/:id/cantidad`
Actualizar cantidad de un lote

## 📋 Próximos Pasos (Frontend)

1. **Componente de Gestión de Lotes**
   - Formulario para crear/editar lotes
   - Lista de lotes por producto
   - Filtros y búsqueda

2. **Componente de Vencimientos**
   - Vista de productos próximos a vencer
   - Alertas visuales por nivel de urgencia
   - Acciones rápidas (descuentos, devoluciones)

3. **Componente de Reportes**
   - Reporte de vencimientos
   - Gráficos de pérdidas económicas
   - Exportación a PDF/Excel

4. **Integración con Ventas**
   - Selección de lote al vender
   - Control FIFO (First In, First Out)
   - Actualización automática de stock por lote

## 🚀 Para usar el sistema

1. Las tablas ya están creadas en la base de datos
2. Los endpoints del backend están disponibles
3. Falta implementar el frontend (componentes React)

¿Quieres que continúe implementando el frontend ahora?

