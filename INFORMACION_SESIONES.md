# 📋 Módulo de Sesiones - Información que debe mostrar

## Propósito
El módulo de **Sesiones** muestra un registro histórico y en tiempo real de todas las sesiones de usuario en el sistema. Proporciona información de auditoría y seguridad sobre quién accedió al sistema, cuándo, desde dónde y por cuánto tiempo.

## 📊 Información que debe mostrar

### Columnas principales:

1. **Usuario / Correo** (correo_usuario)
   - Correo electrónico del usuario que inició sesión
   - Ejemplo: "admin@farmagest.com"

2. **Navegador** (navegador)
   - Información del navegador y versión utilizado
   - Ejemplo: "Microsoft Edge 143.0.0.0", "Chrome 120.0.0.0"

3. **Dirección IP** (ip)
   - IP desde la cual se conectó el usuario
   - Ejemplo: "200.80.180.11"
   - Útil para identificar ubicaciones o detectar accesos inusuales

4. **Hora de inicio** (hora_logueo)
   - Timestamp de cuándo el usuario inició sesión
   - Formato: "2025-12-06 19:09:21"

5. **Última actividad** (ultima_actividad)
   - Timestamp de la última acción realizada por el usuario
   - Se actualiza automáticamente mientras el usuario está activo
   - Útil para identificar sesiones inactivas

6. **Hora de cierre** (hora_logout)
   - Timestamp de cuándo el usuario cerró sesión
   - **NULL** si la sesión sigue activa
   - Muestra "-" o "Activa" cuando no hay cierre

7. **Estado de sesión** (campo calculado - recomendado)
   - **"Activa"** si `hora_logout` es NULL
   - **"Cerrada"** si `hora_logout` tiene valor
   - Útil para identificar rápidamente sesiones actualmente activas

8. **Duración** (campo calculado - recomendado)
   - Tiempo transcurrido desde inicio hasta cierre
   - Para sesiones activas: tiempo desde inicio hasta ahora
   - Formato: "2h 15m" o "45 minutos"

9. **ID de Sesión** (sesion_id)
   - Identificador único de la sesión (UUID)
   - Útil para depuración y seguimiento técnico

## 🎯 Funcionalidades recomendadas:

### Búsqueda
- Por correo de usuario
- Por dirección IP
- Por navegador
- Por ID de sesión

### Filtros
- **Solo sesiones activas**: Ver quién está conectado ahora
- **Solo sesiones cerradas**: Historial de sesiones finalizadas
- **Por rango de fechas**: Sesiones en un período específico
- **Por usuario específico**: Historial de un usuario
- **Sesiones inactivas**: Sesiones sin actividad reciente (útil para detectar sesiones abandonadas)

### Ordenamiento
- Por fecha de inicio (más recientes primero) - **Predeterminado**
- Por última actividad
- Por usuario

### Paginación
- Manejar grandes volúmenes de datos
- Mostrar 8-10 sesiones por página (configurable)

## 🔍 Casos de uso:

1. **Auditoría de seguridad**
   - Ver quién accedió al sistema y cuándo
   - Identificar accesos inusuales o sospechosos
   - Rastrear intentos de acceso

2. **Monitoreo en tiempo real**
   - Ver sesiones activas actualmente
   - Identificar usuarios conectados
   - Detectar sesiones inactivas que deberían cerrarse

3. **Solución de problemas**
   - Investigar problemas de acceso
   - Verificar si un usuario está conectado
   - Analizar patrones de uso

4. **Análisis de uso**
   - Entender patrones de acceso al sistema
   - Ver qué navegadores se utilizan más
   - Analizar duración promedio de sesiones

5. **Gestión de sesiones**
   - Identificar sesiones huérfanas (sin cierre)
   - Cerrar sesiones inactivas manualmente (futura funcionalidad)
   - Limpiar sesiones antiguas

## 📋 Estructura de la tabla en PostgreSQL:

```sql
CREATE TABLE sesiones (
    sesion_id UUID PRIMARY KEY,
    correo_usuario VARCHAR(255) NOT NULL,
    navegador VARCHAR(255),
    ip INET,
    hora_logueo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultima_actividad TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    hora_logout TIMESTAMP NULL
);
```

## 💡 Mejoras futuras recomendadas:

1. **Join con tabla usuarios**: Mostrar nombre completo además del correo
2. **Duración calculada**: Agregar columna con duración de sesión
3. **Estado visual**: Badge de "Activa" o "Cerrada" con colores
4. **Geolocalización**: Mapa con ubicaciones de IP (si aplica)
5. **Alertas**: Notificar accesos desde IPs nuevas
6. **Exportación**: Permitir exportar reportes de sesiones
7. **Gráficos**: Visualizar estadísticas de sesiones (accesos por día, horas pico, etc.)

## 📝 Notas técnicas:

- Las sesiones se crean automáticamente al hacer login
- La `ultima_actividad` se actualiza con cada solicitud al servidor
- El `hora_logout` se establece al cerrar sesión explícitamente
- Sesiones sin `hora_logout` se consideran activas
