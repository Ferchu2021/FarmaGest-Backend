# ⚡ Inicio Rápido - PostgreSQL

## 🚀 Configuración en 5 Minutos

### Paso 1: Instalar PostgreSQL

**Windows:**
- Descarga desde: https://www.postgresql.org/download/windows/
- Instala con configuración por defecto
- Recuerda la contraseña del usuario `postgres`

**Linux:**
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

### Paso 2: Crear Base de Datos

Abre `psql` o pgAdmin y ejecuta:

```sql
CREATE DATABASE farma_gest;
CREATE USER farma_app WITH PASSWORD 'FarmaApp2024!';
GRANT ALL PRIVILEGES ON DATABASE farma_gest TO farma_app;
\c farma_gest
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Paso 3: Instalar Dependencias

```bash
npm install pg
```

### Paso 4: Configurar .env

Crea o actualiza tu `.env`:

```env
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_USER=farma_app
DB_PASSWORD=FarmaApp2024!
DB_NAME=farma_gest
```

### Paso 5: Crear Esquema

```bash
node scripts/crear-schema-postgresql.js
```

### Paso 6: Actualizar db.js

**Opción A: Reemplazar completamente**
```bash
cp db.js db-mysql.js.backup
cp db-postgresql.js db.js
```

**Opción B: Usar según variable de entorno**
Edita `db.js` y agrega al inicio:
```javascript
const dbType = process.env.DB_TYPE || 'mysql';
module.exports = dbType === 'postgresql' 
  ? require('./db-postgresql') 
  : require('./db-mysql');
```

### Paso 7: Probar

```bash
node scripts/test-postgresql-connection.js
npm start
```

## ✅ Verificar

Si ves esto, ¡todo está funcionando!

```
✅ Successful connection pool created for PostgreSQL database
📊 Database ready for Power BI integration
🤖 Database ready for AI/ML integration
```

## 🔗 Conectar Power BI

1. Power BI Desktop → **Obtener datos** → **PostgreSQL database**
2. Servidor: `localhost`
3. Base de datos: `farma_gest`
4. Usuario: `farma_app`
5. Contraseña: `FarmaApp2024!`
6. Selecciona las vistas: `v_ventas_completas`, `v_productos_mas_vendidos`, etc.

## 🤖 Activar IA (Opcional)

```bash
# Instalar pgvector (requiere compilación)
# Ver IA_INTEGRACION.md para detalles

# Generar embeddings
node scripts/generar-embeddings.js
```

## 📚 Documentación Completa

- **Instalación detallada**: `INSTALACION_POSTGRESQL.md`
- **Integración Power BI**: `POWER_BI_INTEGRACION.md`
- **Integración IA**: `IA_INTEGRACION.md`
- **Migración completa**: `MIGRACION_POSTGRESQL.md`

## 🐛 Problemas Comunes

### Error: "No se puede conectar"
- Verifica que PostgreSQL esté corriendo
- Verifica credenciales en `.env`

### Error: "database does not exist"
- Ejecuta: `CREATE DATABASE farma_gest;`

### Error: "permission denied"
- Ejecuta: `GRANT ALL PRIVILEGES ON DATABASE farma_gest TO farma_app;`

## 🎉 ¡Listo!

Tu aplicación ahora está usando PostgreSQL y lista para:
- 📊 Power BI
- 🤖 IA
- 🚀 Mejor rendimiento




