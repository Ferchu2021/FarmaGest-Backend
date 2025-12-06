# 📝 Comando SQL Listo para Ejecutar

## 🔍 Paso 1: Verifica qué usuario usa tu aplicación

En MySQL Workbench, ejecuta:

```sql
SELECT user, host, plugin FROM mysql.user;
```

Busca todos los usuarios que veas en la lista.

## 🔧 Paso 2: Si usas el usuario `root`

Si tu aplicación usa `root`, ya tiene `mysql_native_password`, así que **NO necesitas cambiar nada**. 

En ese caso, el problema puede ser diferente. Prueba ejecutar directamente:

```bash
node scripts/ejecutar-indices-auto.js
```

## 🔧 Paso 3: Si usas OTRO usuario (diferente a root)

Si ves que tu aplicación usa un usuario diferente (por ejemplo: `admin`, `farma_user`, etc.), ejecuta este comando:

```sql
-- REEMPLAZA 'tu_usuario' y 'tu_contraseña' con valores REALES
ALTER USER 'tu_usuario'@'localhost' IDENTIFIED WITH mysql_native_password BY 'tu_contraseña';
FLUSH PRIVILEGES;
```

### Ejemplos:

**Si tu usuario es `admin` y tu contraseña es `password123`:**
```sql
ALTER USER 'admin'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password123';
FLUSH PRIVILEGES;
```

**Si tu usuario es `farma_user` y tu contraseña es `mipass`:**
```sql
ALTER USER 'farma_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'mipass';
FLUSH PRIVILEGES;
```

## 🔍 Paso 4: Verificar que funcionó

```sql
SELECT user, host, plugin FROM mysql.user WHERE user = 'tu_usuario';
```

Debe mostrar `mysql_native_password` en la columna `plugin`.

## ⚠️ Nota sobre MariaDB

Veo que estás usando MariaDB. Si el comando ALTER USER no funciona, intenta:

```sql
-- Para MariaDB, a veces necesitas usar:
SET PASSWORD FOR 'tu_usuario'@'localhost' = PASSWORD('tu_contraseña');
FLUSH PRIVILEGES;
```

O si quieres cambiar solo el plugin:
```sql
UPDATE mysql.user SET plugin='mysql_native_password' WHERE user='tu_usuario' AND host='localhost';
FLUSH PRIVILEGES;
```




