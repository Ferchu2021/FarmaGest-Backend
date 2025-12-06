# 🚀 FarmaGest Backend - PostgreSQL Edition

## 📋 Resumen

Este proyecto ha sido migrado a **PostgreSQL** para aprovechar:
- ✅ **Integración nativa con Power BI**
- ✅ **Soporte para IA y Machine Learning** (vectores, embeddings)
- ✅ **Mejor rendimiento** para análisis de datos
- ✅ **Sin problemas de autenticación**

## 🗂️ Archivos Principales

### Configuración
- **`db-postgresql.js`**: Clase de conexión a PostgreSQL (compatible con código existente)
- **`.env`**: Variables de entorno (ver ejemplo abajo)

### Esquema de Base de Datos
- **`database/postgresql_schema.sql`**: Script completo de creación del esquema
  - Tablas principales
  - Índices optimizados
  - Vistas para Power BI
  - Funciones para IA

### Documentación
- **`MIGRACION_POSTGRESQL.md`**: Guía completa de migración
- **`INSTALACION_POSTGRESQL.md`**: Instrucciones de instalación paso a paso
- **`POWER_BI_INTEGRACION.md`**: Guía de integración con Power BI
- **`IA_INTEGRACION.md`**: Guía de integración con IA

### Scripts
- **`scripts/test-postgresql-connection.js`**: Probar conexión
- **`scripts/crear-schema-postgresql.js`**: Crear esquema automáticamente

## ⚡ Inicio Rápido

### 1. Instalar PostgreSQL

```bash
# Windows: Descargar desde https://www.postgresql.org/download/windows/
# Linux: sudo apt install postgresql postgresql-contrib
# macOS: brew install postgresql
```

### 2. Crear Base de Datos y Usuario

```sql
CREATE DATABASE farma_gest;
CREATE USER farma_app WITH PASSWORD 'FarmaApp2024!';
GRANT ALL PRIVILEGES ON DATABASE farma_gest TO farma_app;
```

### 3. Instalar Dependencias

```bash
npm install pg
```

### 4. Configurar Variables de Entorno

Crea `.env`:

```env
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_USER=farma_app
DB_PASSWORD=FarmaApp2024!
DB_NAME=farma_gest
```

### 5. Crear Esquema

```bash
# Opción A: Usando script Node.js
node scripts/crear-schema-postgresql.js

# Opción B: Usando psql
psql -U farma_app -d farma_gest -f database/postgresql_schema.sql
```

### 6. Probar Conexión

```bash
node scripts/test-postgresql-connection.js
```

### 7. Iniciar Aplicación

```bash
npm start
```

## 📊 Integración con Power BI

1. Abre Power BI Desktop
2. **Obtener datos** → **PostgreSQL database**
3. Configura conexión:
   - Servidor: `localhost`
   - Base de datos: `farma_gest`
   - Usuario: `farma_app`
   - Contraseña: `FarmaApp2024!`
4. Selecciona las vistas optimizadas:
   - `v_ventas_completas`
   - `v_productos_mas_vendidos`
   - `v_clientes_analisis`
   - `v_ventas_por_periodo`

Ver **`POWER_BI_INTEGRACION.md`** para más detalles.

## 🤖 Integración con IA

### Búsqueda Semántica

1. Instalar extensión `pgvector`:
   ```sql
   CREATE EXTENSION vector;
   ```

2. Generar embeddings para productos:
   ```bash
   node scripts/generar-embeddings.js
   ```

3. Usar función de búsqueda:
   ```sql
   SELECT * FROM buscar_productos_similares('paracetamol', 10);
   ```

### Análisis Predictivo

```sql
-- Predecir demanda de un producto
SELECT * FROM predecir_demanda_producto(1, 30);

-- Encontrar productos frecuentemente comprados juntos
SELECT * FROM productos_frecuentes_juntos(1, 5);

-- Analizar tendencias
SELECT * FROM analizar_tendencia_ventas(30);
```

Ver **`IA_INTEGRACION.md`** para más detalles.

## 🏗️ Estructura del Esquema

### Tablas Principales
- `usuarios` - Usuarios del sistema
- `productos` - Productos con soporte para embeddings
- `clientes` - Clientes con información completa
- `ventas` - Ventas con análisis temporal
- `items_venta` - Items de cada venta
- `obras_sociales` - Obras sociales
- `categorias` - Categorías de productos
- `sesiones` - Sesiones de usuarios
- `auditoria_*` - Tablas de auditoría

### Vistas para Power BI
- `v_ventas_completas` - Ventas con todos los detalles
- `v_items_venta_detalle` - Items con detalles de productos
- `v_productos_mas_vendidos` - Análisis de productos
- `v_clientes_analisis` - Análisis de clientes
- `v_ventas_por_periodo` - Ventas agrupadas por período

### Funciones para IA
- `fn_productos_stock_bajo()` - Predecir productos con stock bajo
- `fn_productos_similares()` - Encontrar productos similares
- `buscar_productos_similares()` - Búsqueda semántica
- `predecir_demanda_producto()` - Predecir demanda
- `productos_frecuentes_juntos()` - Productos relacionados
- `analizar_tendencia_ventas()` - Análisis de tendencias

## 🔄 Migración desde MySQL/MariaDB

Si ya tienes datos en MySQL:

1. **Exportar datos:**
   ```bash
   mysqldump -u usuario -p farma_gest > backup_mysql.sql
   ```

2. **Migrar datos:**
   ```bash
   node scripts/migrar-datos-mysql-to-postgresql.js
   ```

Ver **`INSTALACION_POSTGRESQL.md`** para más detalles.

## 📚 Recursos Adicionales

- [Documentación PostgreSQL](https://www.postgresql.org/docs/)
- [Node.js PostgreSQL Driver](https://node-postgres.com/)
- [Power BI PostgreSQL Connector](https://docs.microsoft.com/power-bi/connect-data/desktop-connect-to-postgresql)
- [pgvector Documentation](https://github.com/pgvector/pgvector)

## 🐛 Troubleshooting

### Error de conexión
- Verifica que PostgreSQL esté corriendo
- Verifica credenciales en `.env`
- Verifica permisos del usuario

### Error al crear esquema
- Verifica que la base de datos exista
- Verifica permisos del usuario
- Algunos errores de "ya existe" son normales

Ver **`INSTALACION_POSTGRESQL.md`** para más soluciones.

## ✅ Checklist de Migración

- [ ] PostgreSQL instalado
- [ ] Base de datos creada
- [ ] Usuario creado con permisos
- [ ] Extensiones instaladas (pg_trgm, uuid-ossp)
- [ ] Esquema creado
- [ ] Variables de entorno configuradas
- [ ] Dependencias instaladas (`pg`)
- [ ] Conexión probada
- [ ] Aplicación funcionando
- [ ] Power BI conectado (opcional)
- [ ] IA configurada (opcional)

## 🎉 ¡Listo!

Tu aplicación FarmaGest ahora está optimizada con PostgreSQL y lista para:
- 📊 Integración con Power BI
- 🤖 Integración con IA
- 🚀 Mejor rendimiento
- ✅ Sin problemas de autenticación




