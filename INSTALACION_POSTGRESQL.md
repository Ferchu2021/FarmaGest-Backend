# 🚀 Guía de Instalación y Configuración - PostgreSQL

## 📦 Paso 1: Instalar PostgreSQL

### Windows:

1. **Descargar PostgreSQL:**
   - Visita: https://www.postgresql.org/download/windows/
   - Descarga el instalador para Windows
   - Ejecuta el instalador y sigue las instrucciones

2. **Durante la instalación:**
   - **Puerto**: 5432 (por defecto)
   - **Usuario**: `postgres` (o el que prefieras)
   - **Contraseña**: Guarda bien esta contraseña, la necesitarás
   - **Base de datos**: `postgres` (se crea por defecto)

3. **Verificar instalación:**
   ```bash
   psql --version
   ```

### Linux (Ubuntu/Debian):

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### macOS:

```bash
brew install postgresql
brew services start postgresql
```

## 🔧 Paso 2: Configurar PostgreSQL

### 1. Acceder a PostgreSQL

**Windows (pgAdmin):**
- Abre pgAdmin (instalado con PostgreSQL)
- O usa la línea de comandos: `psql -U postgres`

**Linux/macOS:**
```bash
sudo -u postgres psql
```

### 2. Crear Base de Datos y Usuario

```sql
-- Crear base de datos
CREATE DATABASE farma_gest 
WITH ENCODING 'UTF8' 
LC_COLLATE='es_ES.UTF-8' 
LC_CTYPE='es_ES.UTF-8'
TEMPLATE template0;

-- Crear usuario
CREATE USER farma_app WITH PASSWORD 'FarmaApp2024!';

-- Dar permisos
GRANT ALL PRIVILEGES ON DATABASE farma_gest TO farma_app;

-- Conectar a la base de datos
\c farma_gest

-- Dar permisos en el esquema público
GRANT ALL PRIVILEGES ON SCHEMA public TO farma_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO farma_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO farma_app;

-- Dar permisos para futuras tablas
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO farma_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO farma_app;
```

### 3. Instalar Extensiones

```sql
-- Conectar a la base de datos farma_gest
\c farma_gest

-- Instalar extensiones
CREATE EXTENSION IF NOT EXISTS pg_trgm;      -- Para búsquedas de texto
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- Para UUIDs
-- CREATE EXTENSION IF NOT EXISTS vector;    -- Para IA (requiere instalación adicional)
```

## 📝 Paso 3: Crear el Esquema

### Opción A: Usando psql (Recomendado)

```bash
# Desde la terminal
psql -U farma_app -d farma_gest -f database/postgresql_schema.sql
```

### Opción B: Usando pgAdmin

1. Abre pgAdmin
2. Conecta a tu servidor PostgreSQL
3. Expande la base de datos `farma_gest`
4. Click derecho en la base de datos → **Query Tool**
5. Abre el archivo `database/postgresql_schema.sql`
6. Ejecuta el script (F5)

### Opción C: Usando Node.js

```bash
node scripts/crear-schema-postgresql.js
```

## 📦 Paso 4: Instalar Dependencias de Node.js

```bash
npm install pg
```

**O si quieres mantener ambas bases de datos (MySQL y PostgreSQL):**

```bash
npm install pg mysql2
```

## ⚙️ Paso 5: Configurar Variables de Entorno

Crea o actualiza tu archivo `.env`:

```env
# Tipo de base de datos (postgresql o mysql)
DB_TYPE=postgresql

# Configuración PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=farma_app
DB_PASSWORD=FarmaApp2024!
DB_NAME=farma_gest

# Configuración MySQL (si quieres mantener ambas)
# host=localhost
# port=3306
# user=farma_app
# password=FarmaApp2024!
# database=farma_gest
```

## 🔄 Paso 6: Actualizar db.js

Tienes dos opciones:

### Opción A: Reemplazar completamente

```bash
# Respaldar db.js actual
cp db.js db-mysql.js

# Usar PostgreSQL
cp db-postgresql.js db.js
```

### Opción B: Usar según variable de entorno

Modifica tu `db.js` para detectar el tipo de base de datos:

```javascript
const dbType = process.env.DB_TYPE || 'mysql';

if (dbType === 'postgresql') {
  module.exports = require('./db-postgresql');
} else {
  module.exports = require('./db-mysql');
}
```

## ✅ Paso 7: Verificar Instalación

### 1. Probar conexión

```bash
node scripts/test-postgresql-connection.js
```

### 2. Verificar tablas

```sql
-- En psql o pgAdmin
\c farma_gest
\dt  -- Listar tablas
\d productos  -- Ver estructura de tabla productos
```

### 3. Probar la aplicación

```bash
npm start
```

Deberías ver:
```
✅ Successful connection pool created for PostgreSQL database
📊 Database ready for Power BI integration
🤖 Database ready for AI/ML integration
```

## 🔄 Migración de Datos (Opcional)

Si ya tienes datos en MySQL/MariaDB y quieres migrarlos:

### Opción A: Exportar desde MySQL e Importar a PostgreSQL

1. **Exportar desde MySQL:**
   ```bash
   mysqldump -u usuario -p farma_gest > backup_mysql.sql
   ```

2. **Convertir formato** (requiere herramientas como `pgloader` o scripts de conversión)

3. **Importar a PostgreSQL:**
   ```bash
   psql -U farma_app -d farma_gest -f backup_postgresql.sql
   ```

### Opción B: Script de migración personalizado

```bash
node scripts/migrar-datos-mysql-to-postgresql.js
```

## 🐛 Troubleshooting

### Error: "No se puede conectar al servidor"

**Solución:**
1. Verifica que PostgreSQL esté corriendo:
   ```bash
   # Windows
   net start postgresql-x64-15  # o el nombre de tu servicio
   
   # Linux
   sudo systemctl status postgresql
   
   # macOS
   brew services list
   ```

2. Verifica la configuración en `pg_hba.conf`:
   - Ubicación: `C:\Program Files\PostgreSQL\15\data\pg_hba.conf` (Windows)
   - Asegúrate de tener: `host all all 127.0.0.1/32 md5`

### Error: "password authentication failed"

**Solución:**
1. Verifica las credenciales en `.env`
2. Reinicia el servicio PostgreSQL
3. Si es necesario, cambia la contraseña:
   ```sql
   ALTER USER farma_app WITH PASSWORD 'nueva_contraseña';
   ```

### Error: "database does not exist"

**Solución:**
1. Crea la base de datos:
   ```sql
   CREATE DATABASE farma_gest;
   ```

### Error: "permission denied"

**Solución:**
1. Verifica que el usuario tenga permisos:
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE farma_gest TO farma_app;
   \c farma_gest
   GRANT ALL PRIVILEGES ON SCHEMA public TO farma_app;
   ```

## 📚 Recursos Adicionales

- [Documentación oficial de PostgreSQL](https://www.postgresql.org/docs/)
- [pgAdmin Documentation](https://www.pgadmin.org/docs/)
- [Node.js PostgreSQL Driver](https://node-postgres.com/)

## 🎉 ¡Listo!

Tu aplicación FarmaGest ahora está configurada con PostgreSQL y lista para:
- ✅ Integración con Power BI
- ✅ Integración con IA
- ✅ Mejor rendimiento
- ✅ Sin problemas de autenticación




