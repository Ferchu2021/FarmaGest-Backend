# 🗄️ Crear Base de Datos Completa - FarmaGest

## 📋 Situación

No hay base de datos de aplicación visible. Necesitamos crear la base de datos y configurar todo.

## ✅ Solución Completa

### Paso 1: Crear la Base de Datos

En MySQL Workbench, ejecuta:

```sql
-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS farma_gest CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE farma_gest;
```

### Paso 2: Crear Usuario para la Aplicación

```sql
-- Crear usuario con autenticación correcta
CREATE USER 'farma_app'@'localhost' IDENTIFIED WITH mysql_native_password BY 'FarmaApp2024!';

-- Dar permisos completos
GRANT ALL PRIVILEGES ON farma_gest.* TO 'farma_app'@'localhost';

-- Aplicar cambios
FLUSH PRIVILEGES;

-- Verificar que se creó correctamente
SELECT user, host, plugin FROM mysql.user WHERE user = 'farma_app';
```

**Debe mostrar `mysql_native_password` en la columna `plugin`.**

### Paso 3: Crear el Archivo .env

En la raíz del proyecto, crea un archivo `.env` con:

```
host=localhost
user=farma_app
password=FarmaApp2024!
database=farma_gest
port=3306
```

### Paso 4: Crear las Tablas

Necesitas ejecutar el script SQL que crea todas las tablas. ¿Tienes un script de creación de esquema o migraciones?

Si no lo tienes, necesitaremos crear las tablas basándonos en el código de los modelos.

## 🔍 Verificar Tablas Existentes

Si ya tienes tablas creadas en otra base de datos, puedes:

1. **Ver qué tablas hay en otra base de datos:**
   ```sql
   SHOW TABLES FROM otra_base_de_datos;
   ```

2. **Exportar las tablas:**
   ```sql
   -- Exportar estructura y datos
   mysqldump -u root -p otra_base_de_datos > backup.sql
   ```

3. **Importar en la nueva base de datos:**
   ```sql
   -- En MySQL Workbench, ejecutar el archivo backup.sql
   ```

## ⚠️ Si Ya Tienes una Base de Datos con Datos

Si ya tienes datos en una base de datos existente pero no la ves en la lista, puede ser que:

1. **Esté en otro servidor MySQL**
2. **Tenga un nombre diferente**
3. **Necesites permisos para verla**

Ejecuta esto para ver TODAS las bases de datos (incluyendo las que no tienes permisos para ver):
```sql
SHOW DATABASES;
```

Si ves una base de datos que parece ser tu aplicación (por ejemplo, `farma`, `farmagest`, `farma_db`, etc.), usa ese nombre en lugar de `farma_gest`.




