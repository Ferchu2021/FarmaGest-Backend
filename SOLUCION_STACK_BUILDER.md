# 🔧 Solución: Error Stack Builder (Java Requerido)

## 📋 Situación

Estás viendo un error de Stack Builder que dice:
> "Java 1.8 (or later) is not installed on your system"

## ✅ Solución: Stack Builder es Opcional

**¡Buenas noticias!** Stack Builder NO es necesario para usar PostgreSQL. Es solo una herramienta opcional para instalar componentes adicionales.

**Puedes cerrar Stack Builder sin problemas.** No necesitas instalarlo.

## 🚀 Verificar PostgreSQL

PostgreSQL 18 está instalado en tu sistema. Ahora necesitamos verificar que esté corriendo.

### Paso 1: Verificar el Servicio de PostgreSQL

Abre PowerShell como Administrador y ejecuta:

```powershell
# Buscar el servicio de PostgreSQL
Get-Service | Where-Object {$_.DisplayName -match "PostgreSQL"}

# Si encuentras el servicio, verifica su estado
# Si dice "Stopped", inícialo:
Start-Service postgresql-x64-18

# O busca el nombre exacto del servicio:
Get-Service | Where-Object {$_.DisplayName -match "PostgreSQL"} | Start-Service
```

### Paso 2: Verificar que PostgreSQL Esté Corriendo

```powershell
# Verificar procesos
Get-Process | Where-Object {$_.ProcessName -like "*postgres*"}
```

Si ves procesos como `postgres.exe`, PostgreSQL está corriendo.

### Paso 3: Probar Conexión

Puedes probar la conexión directamente desde la línea de comandos:

```powershell
# Conectar a PostgreSQL (te pedirá la contraseña del usuario postgres)
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres
```

O si prefieres usar pgAdmin:

1. Busca **pgAdmin 4** en el menú de inicio
2. Abre pgAdmin
3. Debería conectarse automáticamente al servidor local

## 🔧 Si el Servicio No Está Corriendo

Si el servicio de PostgreSQL no está corriendo, puedes iniciarlo:

### Opción A: Desde Servicios de Windows

1. Presiona `Win + R`
2. Escribe: `services.msc`
3. Busca servicios que contengan "PostgreSQL"
4. Click derecho → **Iniciar**

### Opción B: Desde PowerShell (como Administrador)

```powershell
# Listar todos los servicios relacionados con PostgreSQL
Get-Service | Where-Object {$_.DisplayName -match "PostgreSQL"}

# Iniciar el servicio (reemplaza con el nombre exacto que encuentres)
# Ejemplo común:
Start-Service postgresql-x64-18
```

## 📝 Próximos Pasos

Una vez que PostgreSQL esté corriendo:

1. **Crear el archivo `.env`** (si no lo has hecho)
   ```powershell
   Copy-Item .env.example .env
   ```

2. **Crear la base de datos** (desde pgAdmin o psql):
   ```sql
   CREATE DATABASE farma_gest;
   CREATE USER farma_app WITH PASSWORD 'FarmaApp2024!';
   GRANT ALL PRIVILEGES ON DATABASE farma_gest TO farma_app;
   ```

3. **Crear el esquema**:
   ```bash
   node scripts/crear-schema-postgresql.js
   ```

4. **Probar la conexión**:
   ```bash
   node scripts/test-postgresql-connection.js
   ```

## ❓ ¿Necesitas Java para Algo Específico?

Si realmente necesitas Stack Builder (por ejemplo, para instalar extensiones específicas), puedes instalar Java:

1. **Descargar Java**: https://www.java.com/download/
2. Instalar Java 8 o superior
3. Asegurarte de que Java esté en el PATH del sistema
4. Reiniciar el equipo
5. Ejecutar Stack Builder nuevamente

Pero recuerda: **Stack Builder es completamente opcional** para usar PostgreSQL básico.

## 🎯 Resumen

1. ✅ **Cierra Stack Builder** - No es necesario
2. ✅ **Verifica que PostgreSQL esté corriendo** - Usa el método de arriba
3. ✅ **Continúa con la configuración** - Sigue los pasos de `PROXIMOS_PASOS_POSTGRESQL.md`



