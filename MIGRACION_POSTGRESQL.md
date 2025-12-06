# 🚀 Migración a PostgreSQL - FarmaGest Backend

## 📋 ¿Por qué PostgreSQL?

### ✅ Ventajas para FarmaGest

1. **Integración con Power BI**
   - Conectividad nativa excelente
   - Mejor rendimiento para análisis de datos
   - Soporte para funciones avanzadas de análisis

2. **Soporte para IA**
   - Extensiones para vectores (pgvector) para embeddings
   - Funciones de análisis predictivo
   - Integración con ML/AI frameworks

3. **Mejor rendimiento**
   - Índices avanzados (GIN, GiST, BRIN)
   - Mejor optimización de queries complejas
   - Soporte para JSON nativo

4. **Sin problemas de autenticación**
   - Configuración más simple
   - Mejor compatibilidad con Node.js

## 📦 Instalación

### Windows:

1. **Descargar PostgreSQL:**
   - https://www.postgresql.org/download/windows/
   - Instalar PostgreSQL 15 o superior

2. **Instalar pgAdmin (interfaz gráfica):**
   - Viene incluido con PostgreSQL
   - O usar DBeaver, DataGrip, etc.

### Verificar instalación:

```bash
psql --version
```

## 🔧 Configuración del Proyecto

### Paso 1: Instalar dependencias

```bash
npm install pg pg-pool
```

### Paso 2: Crear archivo `.env`

```
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_USER=farma_app
DB_PASSWORD=FarmaApp2024!
DB_NAME=farma_gest
```

## 📊 Estructura de la Base de Datos

El esquema completo se creará con el script SQL que se generará a continuación.

## 🔗 Integración con Power BI

PostgreSQL se conecta fácilmente a Power BI:
- Usar el conector nativo de PostgreSQL
- Configurar con las credenciales del `.env`
- Crear vistas optimizadas para análisis

## 🤖 Integración con IA

PostgreSQL soporta:
- **pgvector**: Para embeddings y búsquedas semánticas
- **Análisis predictivo**: Para predecir tendencias de ventas
- **Recomendaciones**: Para sugerir productos similares

## 📝 Próximos Pasos

1. Crear el esquema completo de PostgreSQL
2. Actualizar `db.js` para usar PostgreSQL
3. Crear vistas para Power BI
4. Configurar extensiones para IA




