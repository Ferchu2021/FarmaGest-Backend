# 🚀 Próximos Pasos - Configuración PostgreSQL

## ✅ Completado

- ✅ Backup de `db.js` guardado como `db-mysql.js.backup`
- ✅ `db.js` actualizado para usar PostgreSQL
- ✅ Dependencia `pg` ya instalada en `package.json`

## 📋 Pasos Siguientes

### Paso 1: Crear archivo `.env`

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
# Configuración de Base de Datos PostgreSQL
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_USER=farma_app
DB_PASSWORD=FarmaApp2024!
DB_NAME=farma_gest

# Puerto del servidor
PORT=3000
```

**Nota:** Puedes copiar el archivo `.env.example` como `.env` y ajustar los valores según tu configuración de PostgreSQL.

### Paso 2: Crear Base de Datos y Usuario en PostgreSQL

Abre **pgAdmin** o el **Shell de PostgreSQL (psql)** y ejecuta los siguientes comandos:

#### Opción A: Usando pgAdmin

1. Abre pgAdmin
2. Conecta a tu servidor PostgreSQL (usando el usuario `postgres` y la contraseña que configuraste durante la instalación)
3. Click derecho en **Databases** → **Create** → **Database**
4. Nombre: `farma_gest`
5. Click en **Save**

Luego, ejecuta estos comandos en la **Query Tool**:

```sql
-- Crear usuario
CREATE USER farma_app WITH PASSWORD 'FarmaApp2024!';

-- Dar permisos completos
GRANT ALL PRIVILEGES ON DATABASE farma_gest TO farma_app;

-- Conectar a la base de datos
\c farma_gest

-- Instalar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

#### Opción B: Usando psql (línea de comandos)

1. Abre PowerShell como Administrador
2. Navega a la carpeta de PostgreSQL (normalmente `C:\Program Files\PostgreSQL\{version}\bin`)
3. O usa el comando completo:

```powershell
# Conectar a PostgreSQL
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres

# O si está en tu PATH:
psql -U postgres
```

4. Ingresa la contraseña del usuario `postgres`
5. Ejecuta los comandos SQL:

```sql
CREATE DATABASE farma_gest;
CREATE USER farma_app WITH PASSWORD 'FarmaApp2024!';
GRANT ALL PRIVILEGES ON DATABASE farma_gest TO farma_app;
\c farma_gest
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
\q
```

### Paso 3: Crear el Esquema de Base de Datos

Una vez creada la base de datos, ejecuta el script para crear todas las tablas, índices y vistas:

```bash
node scripts/crear-schema-postgresql.js
```

Este script:
- ✅ Crea todas las tablas necesarias
- ✅ Crea índices para optimizar las consultas
- ✅ Crea vistas para Power BI
- ✅ Muestra el progreso y cualquier error

### Paso 4: Probar la Conexión

Verifica que la conexión funcione correctamente:

```bash
node scripts/test-postgresql-connection.js
```

Deberías ver:
```
✅ Conexión exitosa!
📅 Hora del servidor: ...
📦 Versión: PostgreSQL X.X
✅ Extensiones instaladas: ...
✅ Tablas encontradas: ...
```

### Paso 5: Iniciar la Aplicación

Una vez que todo esté configurado, inicia tu aplicación:

```bash
npm start
```

Deberías ver en la consola:
```
✅ Successful connection pool created for PostgreSQL database
📊 Database ready for Power BI integration
🤖 Database ready for AI/ML integration
```

## 🔧 Solución de Problemas

### Error: "No se puede conectar"

**Solución:**
1. Verifica que PostgreSQL esté corriendo:
   - Abre **Services** (servicios) en Windows
   - Busca `postgresql-x64-16` (o tu versión)
   - Asegúrate de que esté **Running**

2. Verifica las credenciales en `.env`:
   - Usuario: `farma_app` (o el que configuraste)
   - Contraseña: `FarmaApp2024!` (o la que configuraste)
   - Base de datos: `farma_gest`

### Error: "database does not exist"

**Solución:**
Ejecuta: `CREATE DATABASE farma_gest;` en PostgreSQL

### Error: "permission denied"

**Solución:**
Ejecuta en PostgreSQL:
```sql
GRANT ALL PRIVILEGES ON DATABASE farma_gest TO farma_app;
```

### Error: "password authentication failed"

**Solución:**
1. Verifica que el usuario y contraseña en `.env` coincidan con los creados en PostgreSQL
2. Si es necesario, recrea el usuario:
```sql
DROP USER IF EXISTS farma_app;
CREATE USER farma_app WITH PASSWORD 'FarmaApp2024!';
GRANT ALL PRIVILEGES ON DATABASE farma_gest TO farma_app;
```

## 📚 Documentación Adicional

- **Guía rápida**: `QUICKSTART_POSTGRESQL.md`
- **Instalación detallada**: `INSTALACION_POSTGRESQL.md`
- **Integración Power BI**: `POWER_BI_INTEGRACION.md`
- **Migración completa**: `MIGRACION_POSTGRESQL.md`

## 🎉 ¡Listo!

Una vez completados estos pasos, tu aplicación estará usando PostgreSQL y lista para:
- 📊 Integración con Power BI
- 🤖 Integración con IA/ML
- 🚀 Mejor rendimiento y escalabilidad



