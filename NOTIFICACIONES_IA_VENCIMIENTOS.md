# 🤖 Sistema de Notificaciones Inteligentes de Vencimientos

## 📋 Descripción General

Este sistema utiliza análisis predictivo y algoritmos de aprendizaje automático para generar notificaciones inteligentes sobre vencimientos de lotes, priorizando alertas según múltiples factores y proporcionando recomendaciones accionables.

## 🎯 Características Principales

### 1. **Análisis Inteligente Multi-Factor**
- **Proximidad al vencimiento**: Evalúa días restantes hasta la fecha de vencimiento
- **Velocidad de venta**: Analiza histórico de ventas para predecir si se podrá vender a tiempo
- **Valor económico**: Considera el valor del inventario en riesgo
- **Score de urgencia**: Calcula un score de 0-100 que combina todos los factores

### 2. **Sistema de Priorización**
Las notificaciones se categorizan en:
- **CRÍTICA**: Productos ya vencidos
- **ALTA**: Score > 70 o vencimiento en ≤7 días
- **MEDIA**: Score 50-70 o vencimiento en ≤15 días
- **BAJA**: Score 30-50 o vencimiento en ≤30 días

### 3. **Recomendaciones Automáticas**
El sistema genera recomendaciones basadas en el análisis:
- **Promociones**: Sugiere descuentos cuando hay riesgo de no vender a tiempo
- **Revisión de compras**: Identifica productos con acumulación de stock
- **Revisión de productos**: Detecta productos sin ventas recientes
- **Planificación**: Sugiere estrategias de reposición

### 4. **Predicciones Futuras**
- Identifica productos problemáticos históricamente
- Detecta productos con alto riesgo de vencimiento futuro
- Sugiere ajustes en la estrategia de compras

## 🔌 API Endpoints

### Obtener Notificaciones Inteligentes

```
GET /api/notificaciones-ia/vencimientos?dias=30
```

**Parámetros:**
- `dias` (opcional): Días de anticipación para alertas (default: 30)

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

**Cada lote incluye:**
- Información básica (producto, lote, fechas, cantidades)
- Velocidad de venta calculada
- Días estimados para vender el stock
- Score de urgencia (0-100)
- Nivel de prioridad
- Recomendaciones específicas
- Nivel de riesgo (ALTO/MEDIO/BAJO)

### Obtener Predicciones

```
GET /api/notificaciones-ia/predicciones?dias=60
```

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

## 📊 Algoritmo de Score de Urgencia

El score se calcula combinando tres factores:

1. **Proximidad al vencimiento (0-40 puntos)**
   - Ya vencido: 40 puntos
   - ≤7 días: 35 puntos
   - ≤15 días: 25 puntos
   - ≤30 días: 15 puntos
   - >30 días: 5 puntos

2. **Riesgo de no poder vender (0-30 puntos)**
   - Si `dias_para_vender > dias_restantes`: hasta 30 puntos según el ratio

3. **Valor económico (0-30 puntos)**
   - ≥$100,000: 30 puntos
   - ≥$50,000: 20 puntos
   - ≥$20,000: 15 puntos
   - ≥$10,000: 10 puntos
   - ≥$5,000: 5 puntos

**Score total**: Suma de los tres factores (máximo 100)

## 🔄 Integración con el Frontend

### Ejemplo de uso en React:

```javascript
import { useEffect, useState } from 'react';

function NotificacionesIA() {
  const [notificaciones, setNotificaciones] = useState(null);

  useEffect(() => {
    fetch('/api/notificaciones-ia/vencimientos?dias=30')
      .then(res => res.json())
      .then(data => setNotificaciones(data));
  }, []);

  if (!notificaciones) return <div>Cargando...</div>;

  return (
    <div>
      <h2>Resumen Ejecutivo</h2>
      <p>Total lotes en riesgo: {notificaciones.resumen.total_lotes_en_riesgo}</p>
      <p>Valor en riesgo: ${notificaciones.resumen.valor_total_inventario_riesgo}</p>
      <p>Tendencia: {notificaciones.resumen.tendencia}</p>

      <h3>Alertas Críticas</h3>
      {notificaciones.notificaciones.criticas.map(lote => (
        <div key={lote.lote_id}>
          <h4>{lote.producto_nombre}</h4>
          <p>Días restantes: {lote.dias_restantes}</p>
          <p>Score de urgencia: {lote.score_urgencia}/100</p>
          <p>Riesgo: {lote.riesgo_vencimiento}</p>
          <ul>
            {lote.recomendaciones.map((rec, i) => (
              <li key={i}>{rec.mensaje}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

## 🚀 Próximas Mejoras

1. **Notificaciones push en tiempo real**
2. **Integración con email/SMS**
3. **Dashboard de predicciones**
4. **Aprendizaje automático para ajustar scores**
5. **Integración con sistema de promociones automáticas**
6. **Alertas personalizables por usuario**

## 📝 Notas Técnicas

- El sistema analiza el histórico de ventas de los últimos 90 días
- Calcula velocidad de venta como unidades por día
- Compara velocidad de venta con tiempo restante para determinar riesgo
- Genera recomendaciones contextualizadas según múltiples factores

## 🔒 Seguridad

- Las notificaciones requieren autenticación
- Se pueden agregar permisos específicos para diferentes roles
- Los datos se procesan en el servidor, no se exponen cálculos internos

