# 🔧 Solución Final: Autenticación MySQL/MariaDB

## 📋 Situación Actual

Todos los usuarios en tu base de datos tienen `mysql_native_password`, pero el error de `auth_gssapi_client` persiste.

## ✅ Solución: Crear Usuario Específico para la Aplicación

Vamos a crear un usuario nuevo específicamente para tu aplicación con autenticación correcta.

### Paso 1: En MySQL Workbench, ejecuta:

```sql
-- Crear nuevo usuario para la aplicación
CREATE USER 'farma_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'FarmaPass2024!';

-- Dar permisos completos a la base de datos
-- Reemplaza 'nombre_de_tu_base_de_datos' con el nombre real de tu base de datos
GRANT ALL PRIVILEGES ON nombre_de_tu_base_de_datos.* TO 'farma_user'@'localhost';

-- Aplicar cambios
FLUSH PRIVILEGES;

-- Verificar que se creó correctamente
SELECT user, host, plugin FROM mysql.user WHERE user = 'farma_user';
```

**Debe mostrar `mysql_native_password` en la columna `plugin`.**

### Paso 2: Identificar el nombre de tu base de datos

En MySQL Workbench, ejecuta:
```sql
SHOW DATABASES;
```

O en tu aplicación, busca en el código dónde está el nombre de la base de datos (probablemente en `db.js` o en las variables de entorno).

### Paso 3: Actualizar tu archivo `.env`

Crea o actualiza tu archivo `.env` en la raíz del proyecto con:

```
host=localhost
user=farma_user
password=FarmaPass2024!
database=nombre_de_tu_base_de_datos
port=3306
```

**Reemplaza:**
- `nombre_de_tu_base_de_datos` → El nombre real de tu base de datos

### Paso 4: Probar

1. Reinicia tu aplicación
2. Ejecuta: `node scripts/ejecutar-indices-auto.js`

## 🔍 Alternativa: Si Ya Tienes un Usuario Configurado

Si ya tienes un usuario configurado en tu aplicación pero no aparece en la lista, puede ser que:

1. **Se conecte desde otro host**: Intenta con `%` en lugar de `localhost`:
   ```sql
   CREATE USER 'farma_user'@'%' IDENTIFIED WITH mysql_native_password BY 'FarmaPass2024!';
   GRANT ALL PRIVILEGES ON nombre_de_tu_base_de_datos.* TO 'farma_user'@'%';
   FLUSH PRIVILEGES;
   ```

2. **El usuario ya existe pero con otro plugin**: Verifica con:
   ```sql
   SELECT user, host, plugin FROM mysql.user WHERE user LIKE '%farma%' OR user LIKE '%app%';
   ```

## 🆘 Si el Problema Persiste

Si después de crear el usuario nuevo sigue el error, puede ser un problema de configuración de MariaDB. Intenta:

```sql
-- Forzar el plugin en la tabla mysql.user directamente
UPDATE mysql.user SET plugin='mysql_native_password' WHERE user='farma_user' AND host='localhost';
FLUSH PRIVILEGES;
```




