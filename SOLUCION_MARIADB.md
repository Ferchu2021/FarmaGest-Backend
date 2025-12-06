# 🔧 Solución para MariaDB - Crear Usuario

## ⚠️ Diferencia con MySQL

MariaDB tiene una sintaxis ligeramente diferente para crear usuarios. Aquí están las opciones correctas:

## ✅ Solución 1: Sintaxis Simplificada (Recomendada)

```sql
-- Crear usuario sin especificar plugin (MariaDB usará el por defecto)
CREATE USER 'farma_app'@'localhost' IDENTIFIED BY 'FarmaApp2024!';

-- Dar permisos
GRANT ALL PRIVILEGES ON farma_gest.* TO 'farma_app'@'localhost';

-- Aplicar cambios
FLUSH PRIVILEGES;

-- Verificar que se creó
SELECT user, host, plugin FROM mysql.user WHERE user = 'farma_app';
```

## ✅ Solución 2: Usar el Plugin Correcto de MariaDB

Si la primera no funciona, prueba con:

```sql
-- Crear usuario con plugin específico de MariaDB
CREATE USER 'farma_app'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('FarmaApp2024!');

-- Dar permisos
GRANT ALL PRIVILEGES ON farma_gest.* TO 'farma_app'@'localhost';

FLUSH PRIVILEGES;
```

## ✅ Solución 3: Usar Usuario Root Existente

Como ya tienes `root` con `mysql_native_password`, puedes usar directamente ese usuario en tu `.env`:

En tu archivo `.env`:
```
host=localhost
user=root
password=tu_contraseña_de_root
database=farma_gest
port=3306
```

**Reemplaza `tu_contraseña_de_root` con la contraseña real del usuario root.**

## ✅ Solución 4: Actualizar Plugin de Usuario Existente

Si el usuario ya existe pero con otro plugin:

```sql
-- Actualizar el plugin directamente
UPDATE mysql.user SET plugin='mysql_native_password' WHERE user='farma_app' AND host='localhost';
FLUSH PRIVILEGES;
```

## 🔍 Verificar Plugin Disponibles en MariaDB

Para ver qué plugins de autenticación están disponibles:

```sql
SELECT * FROM mysql.plugin WHERE name LIKE '%auth%';
```

O simplemente usar la sintaxis sin especificar plugin y MariaDB usará el correcto.




