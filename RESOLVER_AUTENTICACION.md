# 🔧 Resolver Autenticación MySQL - Guía Paso a Paso

## 📋 Paso 1: Identificar tu Usuario MySQL

Abre tu archivo `.env` y busca estas líneas:
```
user=tu_usuario_aqui
password=tu_contraseña_aqui
```

Anota estos valores.

## 📋 Paso 2: Abrir MySQL Workbench

1. Abre MySQL Workbench
2. Conéctate como administrador (root o usuario con privilegios ADMIN)

## 📋 Paso 3: Ejecutar el Comando

En una nueva query, ejecuta este comando:

```sql
ALTER USER 'TU_USUARIO'@'localhost' IDENTIFIED WITH mysql_native_password BY 'TU_CONTRASEÑA';
FLUSH PRIVILEGES;
```

**Reemplaza:**
- `TU_USUARIO` → El valor de `user` en tu `.env`
- `TU_CONTRASEÑA` → El valor de `password` en tu `.env`

## 📋 Paso 4: Verificar que Funcionó

Ejecuta:
```sql
SELECT user, host, plugin FROM mysql.user WHERE user = 'TU_USUARIO';
```

Debe mostrar `mysql_native_password` en la columna `plugin`.

## 📋 Paso 5: Probar la Solución

1. Cierra y reinicia tu aplicación si estaba corriendo
2. Ejecuta: `node scripts/ejecutar-indices-auto.js`
3. Debería crear los índices sin errores

## 🆘 Si Tu Usuario Es Remoto

Si tu MySQL está en otro servidor (no localhost), usa `%` en lugar de `localhost`:

```sql
ALTER USER 'TU_USUARIO'@'%' IDENTIFIED WITH mysql_native_password BY 'TU_CONTRASEÑA';
FLUSH PRIVILEGES;
```

## 🆘 Si No Sabes Tu Usuario

Ejecuta esto en MySQL Workbench para ver todos los usuarios:
```sql
SELECT user, host, plugin FROM mysql.user;
```

Busca el que coincida con tu configuración.

## ⚠️ Si No Tienes Privilegios

Si no puedes modificar usuarios, contacta a tu administrador de base de datos o usa una cuenta con privilegios de administrador.

## ✅ Ejemplo Completo

Si en tu `.env` tienes:
```
user=admin
password=miPassword123
```

Ejecutarías:
```sql
ALTER USER 'admin'@'localhost' IDENTIFIED WITH mysql_native_password BY 'miPassword123';
FLUSH PRIVILEGES;
```




