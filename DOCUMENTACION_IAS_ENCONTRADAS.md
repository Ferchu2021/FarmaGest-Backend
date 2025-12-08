# 🤖 Documentación de Integraciones de IA - FarmaGest

## 📋 Resumen Ejecutivo

Este documento detalla todas las integraciones de Inteligencia Artificial (IA) presentes en el sistema FarmaGest. Estas integraciones utilizan análisis predictivo, algoritmos de aprendizaje automático y procesamiento de datos para proporcionar funcionalidades inteligentes.

---

## 🎯 IA #1: Sistema de Notificaciones Inteligentes de Vencimientos

### 📍 Ubicación
- **Servicio Backend**: `services/notificacionesIA/notificacionesVencimientosIA.js`
- **Controlador**: `controllers/notificacionesIAController.js`
- **Rutas**: `routes/notificacionesIARoute.js`
- **Documentación**: `NOTIFICACIONES_IA_VENCIMIENTOS.md`, `IMPLEMENTACION_NOTIFICACIONES_IA_COMPLETA.md`

### 🎯 Propósito
Sistema inteligente que analiza lotes de productos próximos a vencer y genera notificaciones priorizadas con recomendaciones accionables basadas en análisis predictivo.

### 🔧 Funcionalidades Principales

#### 1. **Análisis Multi-Factor Inteligente**
- **Proximidad al vencimiento**: Evalúa días restantes hasta la fecha de vencimiento
- **Velocidad de venta histórica**: Analiza ventas de los últimos 90 días para calcular velocidad de venta promedio
- **Predicción de días para vender**: Calcula cuántos días se necesitarían para vender el stock actual
- **Valor económico**: Considera el valor del inventario en riesgo
- **Score de urgencia**: Calcula un score de 0-100 que combina todos los factores

#### 2. **Sistema de Priorización Automática**
Categoriza notificaciones en 5 niveles:
- **CRÍTICA**: Productos ya vencidos
- **ALTA**: Score ≥70 o vencimiento en ≤7 días
- **MEDIA**: Score 50-70 o vencimiento en ≤15 días
- **BAJA**: Score 30-50 o vencimiento en ≤30 días
- **NORMAL**: Score <30 y >30 días restantes

#### 3. **Algoritmo de Score de Urgencia**
El sistema calcula un score de 0-100 basado en:

**Factor 1: Proximidad al vencimiento (0-40 puntos)**
- Ya vencido: 40 puntos
- ≤7 días: 35 puntos
- ≤15 días: 25 puntos
- ≤30 días: 15 puntos
- >30 días: 5 puntos

**Factor 2: Riesgo de no poder vender a tiempo (0-30 puntos)**
- Si `dias_para_vender > dias_restantes`: calcula ratio y asigna hasta 30 puntos
- Ratio = `dias_para_vender / dias_restantes`
- Score = `min(30, ratio * 10)`

**Factor 3: Valor económico del inventario (0-30 puntos)**
- ≥$100,000: 30 puntos
- ≥$50,000: 20 puntos
- ≥$20,000: 15 puntos
- ≥$10,000: 10 puntos
- ≥$5,000: 5 puntos

**Score Total**: Suma de los tres factores (máximo 100)

#### 4. **Generación Automática de Recomendaciones**
El sistema genera recomendaciones contextualizadas:

- **ACCION_INMEDIATA**: Descuentos del 20-30% para productos críticos
- **PROMOCION**: Descuentos del 10-15% para productos de alta prioridad
- **GESTION_INVENTARIO**: Revisar estrategia de compras para productos con alto valor
- **PRODUCTO_LENTO**: Evaluar demanda de productos sin ventas recientes
- **OPORTUNIDAD**: Estrategias de reposición anticipada para productos con buena rotación

#### 5. **Análisis Predictivo de Vencimientos Futuros**
- Identifica productos problemáticos históricamente (que han vencido múltiples veces)
- Detecta productos con alto riesgo futuro (ratio stock/venta alto)
- Calcula pérdidas promedio históricas
- Sugiere ajustes en estrategia de compras

### 🔌 API Endpoints

#### GET `/api/notificaciones-ia/vencimientos`
Obtiene notificaciones inteligentes de vencimientos.

**Parámetros:**
- `dias` (opcional): Días de anticipación para alertas (default: 30)
- `enviarEmail` (opcional): Enviar email si hay alertas críticas (default: false)

**Respuesta:**
```json
{
  "resumen": {
    "total_lotes_en_riesgo": 15,
    "valor_total_inventario_riesgo": 250000.50,
    "valor_inventario_critico": 85000.00,
    "porcentaje_valor_critico": 34,
    "lotes_vencidos": 2,
    "lotes_alta_prioridad": 5,
    "acciones_recomendadas": {
      "promocion": 8,
      "revision_compras": 3,
      "revision_producto": 2,
      "planificacion": 4
    },
    "tendencia": "ALTA - Más del 30% de lotes en situación crítica"
  },
  "notificaciones": {
    "criticas": [...],
    "alta": [...],
    "media": [...],
    "baja": [...],
    "todas": [...]
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### GET `/api/notificaciones-ia/predicciones`
Obtiene predicciones de vencimientos futuros.

**Parámetros:**
- `dias` (opcional): Horizonte de predicción (default: 60)

**Respuesta:**
```json
{
  "productos_problematicos": [
    {
      "producto_id": 123,
      "nombre": "Paracetamol 500mg",
      "veces_vencido": 3,
      "perdida_promedio": 15000.00
    }
  ],
  "productos_alto_riesgo": [
    {
      "producto_id": 456,
      "nombre": "Vitamina D3",
      "stock": 200,
      "unidades_vendidas_90dias": 15,
      "ratio_stock_venta": 13.33
    }
  ],
  "recomendacion_general": "Revisar estrategia de compras para productos con historial de vencimientos"
}
```

### 📊 Métodos Principales del Servicio

#### `generarNotificacionesInteligentes(diasAnticipacion = 30)`
- Analiza lotes próximos a vencer
- Calcula velocidad de venta para cada producto
- Genera scores de urgencia
- Categoriza notificaciones
- Retorna resumen ejecutivo y notificaciones categorizadas

#### `calcularScoreUrgencia(diasRestantes, diasParaVender, valorInventario)`
- Calcula score de urgencia (0-100) basado en múltiples factores
- Combina proximidad, riesgo de venta y valor económico

#### `generarRecomendaciones(diasRestantes, diasParaVender, valorInventario, velocidadVenta)`
- Genera recomendaciones contextualizadas según el análisis
- Retorna array de recomendaciones con tipo, mensaje, acción y prioridad

#### `determinarPrioridad(scoreUrgencia, diasRestantes)`
- Determina nivel de prioridad (CRÍTICA, ALTA, MEDIA, BAJA, NORMAL)
- Basado en score y días restantes

#### `predecirVencimientosFuturos(diasFuturo = 60)`
- Identifica productos problemáticos históricamente
- Detecta productos con alto riesgo futuro
- Genera recomendaciones generales

### 🔗 Integración con Frontend
- Componente React: `src/components/Home/NotificacionesIA.js` (si existe en frontend)
- Dashboard de predicciones: `src/components/Predicciones/DashboardPredicciones.js` (si existe)
- Auto-refresh cada 5 minutos
- Notificaciones por email para alertas críticas

### 📈 Algoritmos Utilizados
1. **Cálculo de velocidad de venta**: `total_vendido / 90 días`
2. **Predicción de días para vender**: `stock_actual / velocidad_venta`
3. **Score de urgencia**: Combinación ponderada de 3 factores
4. **Análisis de tendencias**: Comparación de períodos temporales
5. **Detección de patrones**: Identificación de productos problemáticos

### 🎯 Casos de Uso
1. **Alertas proactivas**: Notificar antes de que los productos venzan
2. **Optimización de inventario**: Identificar productos con riesgo de vencimiento
3. **Planificación de compras**: Ajustar estrategias basadas en predicciones
4. **Reducción de pérdidas**: Minimizar pérdidas por vencimientos
5. **Toma de decisiones**: Proporcionar datos para decisiones informadas

---

## 🔮 IA #2: Búsqueda Semántica de Productos (Planeada/Futura)

### 📍 Ubicación
- **Documentación**: `IA_INTEGRACION.md`
- **Schema**: `database/postgresql_schema.sql` (columna `embedding` en tabla `productos`)

### 🎯 Propósito
Sistema de búsqueda semántica que permite encontrar productos usando lenguaje natural y búsqueda por significado en lugar de palabras exactas.

### 🔧 Funcionalidades Planeadas

#### 1. **Búsqueda por Embeddings**
- Generación de vectores de embeddings para cada producto
- Búsqueda por similitud semántica usando pgvector
- Soporte para búsqueda en español

#### 2. **Búsqueda Híbrida**
- Combina búsqueda semántica con búsqueda por texto tradicional
- Fallback a búsqueda por texto si no hay embeddings disponibles

### 📊 Estado Actual
- **Schema preparado**: La tabla `productos` tiene columna `embedding vector(1536)`
- **Función SQL planeada**: `buscar_productos_similares()` en `IA_INTEGRACION.md`
- **No implementado**: Requiere instalación de pgvector y generación de embeddings

### 🔌 Endpoint Planeado
```sql
SELECT * FROM buscar_productos_similares('paracetamol para dolor de cabeza', 10);
```

---

## 🔮 IA #3: Análisis Predictivo de Demanda (Planeado/Futuro)

### 📍 Ubicación
- **Documentación**: `IA_INTEGRACION.md`

### 🎯 Propósito
Predecir demanda de productos basándose en histórico de ventas y patrones temporales.

### 🔧 Funcionalidades Planeadas

#### 1. **Predicción de Demanda**
- Función SQL: `predecir_demanda_producto(producto_id, dias)`
- Calcula demanda predicha basada en histórico
- Identifica riesgo de quedarse sin stock

#### 2. **Análisis de Tendencias**
- Función SQL: `analizar_tendencia_ventas(dias)`
- Identifica tendencias crecientes, decrecientes o estables
- Calcula cambios porcentuales

#### 3. **Productos Frecuentemente Comprados Juntos**
- Función SQL: `productos_frecuentes_juntos(producto_id, limite)`
- Análisis de asociación de productos
- Recomendaciones de productos relacionados

### 📊 Estado Actual
- **Documentado**: Funciones SQL planeadas en `IA_INTEGRACION.md`
- **No implementado**: Requiere implementación de funciones SQL en la base de datos

---

## 📝 Resumen de IAs Implementadas vs Planeadas

### ✅ Implementadas y Activas
1. **Sistema de Notificaciones Inteligentes de Vencimientos**
   - ✅ Completamente implementado
   - ✅ En producción
   - ✅ Con endpoints API funcionales
   - ✅ Integrado con frontend (si existe)

### 🔮 Planeadas/Futuras
1. **Búsqueda Semántica de Productos**
   - Schema preparado pero no implementado
   - Requiere pgvector y generación de embeddings

2. **Análisis Predictivo de Demanda**
   - Documentado pero no implementado
   - Requiere implementación de funciones SQL

3. **Recomendaciones Inteligentes**
   - Documentado pero no implementado
   - Requiere análisis de asociación de productos

---

## 🔧 Dependencias y Requisitos

### Para IA Implementada (Notificaciones)
- ✅ PostgreSQL con soporte para funciones SQL
- ✅ Acceso a tablas: `lotes`, `productos`, `items_venta`, `ventas`
- ✅ Cálculos matemáticos básicos (JavaScript)

### Para IAs Planeadas
- 🔮 **pgvector**: Extensión PostgreSQL para búsqueda vectorial
- 🔮 **OpenAI API** o servicio similar: Para generar embeddings
- 🔮 **Python 3** (opcional): Para funciones avanzadas de ML

---

## 📚 Documentación Relacionada

1. `NOTIFICACIONES_IA_VENCIMIENTOS.md` - Documentación detallada del sistema de notificaciones
2. `IMPLEMENTACION_NOTIFICACIONES_IA_COMPLETA.md` - Guía de implementación completa
3. `IA_INTEGRACION.md` - Documentación de IAs planeadas
4. `services/notificacionesIA/notificacionesVencimientosIA.js` - Código fuente del servicio

---

## 🎯 Conclusión

El sistema FarmaGest cuenta con **1 integración de IA completamente implementada y funcional**:

- **Sistema de Notificaciones Inteligentes de Vencimientos**: Sistema completo que utiliza análisis predictivo, algoritmos de scoring y generación automática de recomendaciones para optimizar la gestión de inventario y reducir pérdidas por vencimientos.

Las demás integraciones de IA están documentadas pero no implementadas, requiriendo trabajo adicional para su activación.

