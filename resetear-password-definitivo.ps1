# Script definitivo para resetear contraseña de PostgreSQL
# EJECUTAR COMO ADMINISTRADOR

Write-Host "=========================================="
Write-Host "  Resetear Contraseña PostgreSQL"
Write-Host "=========================================="
Write-Host ""

# Verificar permisos de administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: Este script requiere permisos de Administrador"
    Write-Host "Por favor, ejecuta PowerShell como Administrador"
    exit 1
}

# Rutas
$pgHbaPath = "C:\Program Files\PostgreSQL\18\data\pg_hba.conf"
$psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$serviceName = "postgresql-x64-18"
$newPassword = "FarmaGest2024!"

# Verificar que existan los archivos
if (-not (Test-Path $pgHbaPath)) {
    Write-Host "ERROR: No se encontro pg_hba.conf en: $pgHbaPath"
    exit 1
}

if (-not (Test-Path $psqlPath)) {
    Write-Host "ERROR: No se encontro psql.exe en: $psqlPath"
    exit 1
}

Write-Host "Paso 1: Deteniendo servicio PostgreSQL..."
$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($service -and $service.Status -eq 'Running') {
    Stop-Service -Name $serviceName -Force
    Start-Sleep -Seconds 3
    Write-Host "OK: Servicio detenido"
} else {
    Write-Host "INFO: Servicio ya estaba detenido"
}
Write-Host ""

Write-Host "Paso 2: Creando backup de pg_hba.conf..."
$timestamp = Get-Date -Format 'yyyyMMddHHmmss'
$backupPath = "$pgHbaPath.backup.$timestamp"
Copy-Item $pgHbaPath $backupPath -Force
Write-Host "OK: Backup creado: $backupPath"
Write-Host ""

Write-Host "Paso 3: Modificando pg_hba.conf para permitir conexion sin contraseña..."
$content = Get-Content $pgHbaPath -Raw
$content = $content -replace '(host\s+all\s+all\s+127\.0\.0\.1/32\s+)(md5|scram-sha-256|password)', '$1trust'
$content = $content -replace '(host\s+all\s+all\s+::1/128\s+)(md5|scram-sha-256|password)', '$1trust'
$content = $content -replace '(local\s+all\s+all\s+)(md5|scram-sha-256|password)', '$1trust'
[System.IO.File]::WriteAllText($pgHbaPath, $content, [System.Text.Encoding]::UTF8)
Write-Host "OK: Archivo modificado"
Write-Host ""

Write-Host "Paso 4: Iniciando servicio PostgreSQL..."
Start-Service -Name $serviceName
Start-Sleep -Seconds 5
Write-Host "OK: Servicio iniciado"
Write-Host ""

Write-Host "Paso 5: Cambiando contraseña del usuario postgres..."
$sqlCommand = "ALTER USER postgres WITH PASSWORD '$newPassword';"
$result = & $psqlPath -h localhost -U postgres -d postgres -c $sqlCommand 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK: Contraseña cambiada exitosamente"
} else {
    Write-Host "ERROR: No se pudo cambiar la contraseña"
    Write-Host "Salida: $result"
    Write-Host ""
    Write-Host "Restaurando backup..."
    Copy-Item $backupPath $pgHbaPath -Force
    Start-Service -Name $serviceName
    exit 1
}
Write-Host ""

Write-Host "Paso 6: Restaurando configuracion de autenticacion..."
Copy-Item $backupPath $pgHbaPath -Force
Write-Host "OK: Archivo restaurado"
Write-Host ""

Write-Host "Paso 7: Reiniciando servicio PostgreSQL..."
Restart-Service -Name $serviceName -Force
Start-Sleep -Seconds 3
Write-Host "OK: Servicio reiniciado"
Write-Host ""

Write-Host "Paso 8: Verificando conexion con la nueva contraseña..."
$env:PGPASSWORD = $newPassword
$testResult = & $psqlPath -h localhost -U postgres -d postgres -c "SELECT 'Conexion exitosa' as resultado;" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK: Conexion exitosa!"
    Write-Host ""
    Write-Host "=========================================="
    Write-Host "  PROCESO COMPLETADO EXITOSAMENTE"
    Write-Host "=========================================="
    Write-Host ""
    Write-Host "Credenciales para pgAdmin4:"
    Write-Host "   Host: localhost"
    Write-Host "   Port: 5432"
    Write-Host "   Usuario: postgres"
    Write-Host "   Contraseña: $newPassword"
    Write-Host ""
} else {
    Write-Host "ADVERTENCIA: No se pudo verificar la conexion"
    Write-Host "Salida: $testResult"
    Write-Host ""
    Write-Host "Pero la contraseña deberia estar cambiada."
    Write-Host "Intenta conectarte en pgAdmin4 con:"
    Write-Host "   Contraseña: $newPassword"
    Write-Host ""
}

Write-Host "IMPORTANTE: Actualiza tu archivo .env con esta contraseña"
Write-Host ""

