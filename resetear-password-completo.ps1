# Script completo para resetear contraseña de PostgreSQL
# REQUIERE EJECUTARSE COMO ADMINISTRADOR

Write-Host "=========================================="
Write-Host "  Resetear Contraseña de PostgreSQL"
Write-Host "=========================================="
Write-Host ""

# Verificar si se ejecuta como Administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: Este script debe ejecutarse como Administrador"
    Write-Host ""
    Write-Host "Por favor, haz clic derecho en PowerShell y selecciona 'Ejecutar como administrador'"
    Write-Host ""
    exit 1
}

Write-Host "OK: Ejecutandose como Administrador"
Write-Host ""

# Ruta al archivo pg_hba.conf
$pgHbaPath = "C:\Program Files\PostgreSQL\18\data\pg_hba.conf"
$timestamp = Get-Date -Format 'yyyyMMddHHmmss'
$pgHbaBackup = "$pgHbaPath.backup.$timestamp"

# Verificar que existe el archivo
if (-not (Test-Path $pgHbaPath)) {
    Write-Host "ERROR: No se encontro pg_hba.conf en: $pgHbaPath"
    Write-Host ""
    Write-Host "Buscando en otras ubicaciones..."
    $possiblePaths = @(
        "C:\Program Files\PostgreSQL\17\data\pg_hba.conf",
        "C:\Program Files\PostgreSQL\16\data\pg_hba.conf",
        "C:\Program Files\PostgreSQL\15\data\pg_hba.conf"
    )
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $pgHbaPath = $path
            Write-Host "   OK: Encontrado en: $path"
            break
        }
    }
    if (-not (Test-Path $pgHbaPath)) {
        Write-Host "   ERROR: No se encontro pg_hba.conf"
        exit 1
    }
}

Write-Host "Archivo pg_hba.conf encontrado: $pgHbaPath"
Write-Host ""

# Nombre del servicio
$serviceName = "postgresql-x64-18"
$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue

if (-not $service) {
    Write-Host "ADVERTENCIA: Servicio '$serviceName' no encontrado. Buscando otros servicios PostgreSQL..."
    $allServices = Get-Service | Where-Object { $_.Name -like "*postgres*" }
    if ($allServices) {
        Write-Host "   Servicios encontrados:"
        $allServices | ForEach-Object { Write-Host "     - $($_.Name)" }
        $serviceName = $allServices[0].Name
        Write-Host ""
        Write-Host "   Usando: $serviceName"
        $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
    } else {
        Write-Host "   ERROR: No se encontraron servicios PostgreSQL"
        exit 1
    }
}

# Paso 1: Detener el servicio
Write-Host "1. Deteniendo servicio PostgreSQL..."
if ($service.Status -eq 'Running') {
    Stop-Service -Name $serviceName -Force
    Start-Sleep -Seconds 3
    Write-Host "   OK: Servicio detenido"
} else {
    Write-Host "   INFO: Servicio ya estaba detenido"
}
Write-Host ""

# Paso 2: Hacer backup de pg_hba.conf
Write-Host "2. Creando backup de pg_hba.conf..."
Copy-Item $pgHbaPath $pgHbaBackup -Force
Write-Host "   OK: Backup creado: $pgHbaBackup"
Write-Host ""

# Paso 3: Leer y modificar pg_hba.conf
Write-Host "3. Modificando pg_hba.conf para permitir conexion sin contraseña..."
$content = Get-Content $pgHbaPath -Raw

# Reemplazar métodos de autenticación por 'trust' para localhost
$content = $content -replace '(host\s+all\s+all\s+127\.0\.0\.1/32\s+)(md5|scram-sha-256|password)', '$1trust'
$content = $content -replace '(host\s+all\s+all\s+::1/128\s+)(md5|scram-sha-256|password)', '$1trust'
$content = $content -replace '(local\s+all\s+all\s+)(md5|scram-sha-256|password)', '$1trust'

# Guardar el archivo modificado
[System.IO.File]::WriteAllText($pgHbaPath, $content, [System.Text.Encoding]::UTF8)
Write-Host "   OK: Archivo modificado"
Write-Host ""

# Paso 4: Iniciar el servicio
Write-Host "4. Iniciando servicio PostgreSQL..."
Start-Service -Name $serviceName
Start-Sleep -Seconds 5
Write-Host "   OK: Servicio iniciado"
Write-Host ""

# Paso 5: Cambiar la contraseña
Write-Host "5. Cambiando contraseña del usuario postgres..."
$newPassword = "FarmaGest2024!"
$psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

if (-not (Test-Path $psqlPath)) {
    Write-Host "   ADVERTENCIA: psql.exe no encontrado en la ruta estandar. Buscando..."
    $possiblePaths = @(
        "C:\Program Files\PostgreSQL\17\bin\psql.exe",
        "C:\Program Files\PostgreSQL\16\bin\psql.exe"
    )
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $psqlPath = $path
            break
        }
    }
}

$sqlCommand = "ALTER USER postgres WITH PASSWORD '$newPassword';"

Write-Host "   Ejecutando comando SQL..."
$result = & $psqlPath -h localhost -U postgres -d postgres -c $sqlCommand 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "   OK: Contraseña cambiada exitosamente"
} else {
    Write-Host "   ADVERTENCIA: Codigo de salida: $LASTEXITCODE"
    Write-Host "   Salida: $result"
}
Write-Host ""

# Paso 6: Restaurar pg_hba.conf
Write-Host "6. Restaurando configuracion de autenticacion..."
Copy-Item $pgHbaBackup $pgHbaPath -Force
Write-Host "   OK: Archivo restaurado"
Write-Host ""

# Paso 7: Reiniciar el servicio
Write-Host "7. Reiniciando servicio PostgreSQL..."
Restart-Service -Name $serviceName -Force
Start-Sleep -Seconds 3
Write-Host "   OK: Servicio reiniciado"
Write-Host ""

# Resumen
Write-Host "=========================================="
Write-Host "  OK: Proceso Completado"
Write-Host "=========================================="
Write-Host ""
Write-Host "Credenciales para pgAdmin4:"
Write-Host "   Usuario: postgres"
Write-Host "   Contraseña: $newPassword"
Write-Host ""
Write-Host "IMPORTANTE: Actualiza tu archivo .env con esta contraseña"
Write-Host ""
Write-Host "Backup de pg_hba.conf guardado en:"
Write-Host "   $pgHbaBackup"
Write-Host ""
