# Script final para resetear contraseña PostgreSQL
# EJECUTAR COMO ADMINISTRADOR

Write-Host "=========================================="
Write-Host "  Resetear Contraseña PostgreSQL - FINAL"
Write-Host "=========================================="
Write-Host ""

# Verificar permisos
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: Ejecuta PowerShell como Administrador"
    Write-Host "Clic derecho en PowerShell -> Ejecutar como administrador"
    pause
    exit 1
}

Write-Host "OK: Permisos de Administrador verificados"
Write-Host ""

# Rutas
$pgHbaPath = "C:\Program Files\PostgreSQL\18\data\pg_hba.conf"
$psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$pgCtlPath = "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe"
$dataDir = "C:\Program Files\PostgreSQL\18\data"
$serviceName = "postgresql-x64-18"
$newPassword = "FarmaGest2024!"

# Verificar archivos
if (-not (Test-Path $pgHbaPath)) {
    Write-Host "ERROR: No se encontro pg_hba.conf"
    pause
    exit 1
}

if (-not (Test-Path $psqlPath)) {
    Write-Host "ERROR: No se encontro psql.exe"
    pause
    exit 1
}

Write-Host "Paso 1: Deteniendo cualquier proceso de PostgreSQL..."
# Detener servicio si existe
$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($service -and $service.Status -eq 'Running') {
    Write-Host "   Deteniendo servicio Windows..."
    Stop-Service -Name $serviceName -Force
    Start-Sleep -Seconds 2
}

# Detener proceso manual si existe
$connection = Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue
if ($connection) {
    $processId = $connection.OwningProcess
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    if ($process -and $process.ProcessName -like "*postgres*") {
        Write-Host "   Deteniendo proceso manual (PID: $processId)..."
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
}

# Usar pg_ctl para detener si está disponible
if (Test-Path $pgCtlPath) {
    Write-Host "   Usando pg_ctl para detener..."
    & $pgCtlPath stop -D $dataDir -m fast 2>&1 | Out-Null
    Start-Sleep -Seconds 2
}

Write-Host "OK: PostgreSQL detenido"
Write-Host ""

Write-Host "Paso 2: Creando backup de pg_hba.conf..."
$timestamp = Get-Date -Format 'yyyyMMddHHmmss'
$backupPath = "$pgHbaPath.backup.$timestamp"
Copy-Item $pgHbaPath $backupPath -Force
Write-Host "OK: Backup creado: $backupPath"
Write-Host ""

Write-Host "Paso 3: Modificando pg_hba.conf..."
$content = Get-Content $pgHbaPath -Raw -Encoding UTF8

# Reemplazar todas las instancias
$content = $content -replace '(host\s+all\s+all\s+127\.0\.0\.1/32\s+)(md5|scram-sha-256|password)', '$1trust'
$content = $content -replace '(host\s+all\s+all\s+::1/128\s+)(md5|scram-sha-256|password)', '$1trust'
$content = $content -replace '(local\s+all\s+all\s+)(md5|scram-sha-256|password)', '$1trust'

# Guardar con UTF8 sin BOM
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($pgHbaPath, $content, $utf8NoBom)
Write-Host "OK: Archivo modificado"
Write-Host ""

Write-Host "Paso 4: Iniciando PostgreSQL..."
# Intentar iniciar servicio
if ($service) {
    Start-Service -Name $serviceName -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
}

# Si el servicio no funciona, iniciar manualmente
$connection = Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue
if (-not $connection) {
    Write-Host "   Iniciando manualmente con pg_ctl..."
    if (Test-Path $pgCtlPath) {
        Start-Process -FilePath $pgCtlPath -ArgumentList "start", "-D", "`"$dataDir`"", "-l", "`"$dataDir\postgresql.log`"" -WindowStyle Hidden
        Start-Sleep -Seconds 5
    }
}

# Verificar que esté corriendo
$connection = Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue
if ($connection) {
    Write-Host "OK: PostgreSQL iniciado"
} else {
    Write-Host "ERROR: No se pudo iniciar PostgreSQL"
    Write-Host "Restaurando backup..."
    Copy-Item $backupPath $pgHbaPath -Force
    pause
    exit 1
}
Write-Host ""

Write-Host "Paso 5: Cambiando contraseña..."
Start-Sleep -Seconds 2
$sqlCommand = "ALTER USER postgres WITH PASSWORD '$newPassword';"
$result = & $psqlPath -h localhost -U postgres -d postgres -c $sqlCommand 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK: Contraseña cambiada exitosamente!"
} else {
    Write-Host "ERROR: No se pudo cambiar la contraseña"
    Write-Host "Salida: $result"
    Write-Host ""
    Write-Host "Restaurando backup..."
    Copy-Item $backupPath $pgHbaPath -Force
    pause
    exit 1
}
Write-Host ""

Write-Host "Paso 6: Restaurando pg_hba.conf..."
Copy-Item $backupPath $pgHbaPath -Force
Write-Host "OK: Archivo restaurado"
Write-Host ""

Write-Host "Paso 7: Reiniciando PostgreSQL..."
# Detener
if ($service -and (Get-Service -Name $serviceName).Status -eq 'Running') {
    Restart-Service -Name $serviceName -Force
} else {
    # Reiniciar manualmente
    $connection = Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue
    if ($connection) {
        $processId = $connection.OwningProcess
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
    if (Test-Path $pgCtlPath) {
        Start-Process -FilePath $pgCtlPath -ArgumentList "start", "-D", "`"$dataDir`"", "-l", "`"$dataDir\postgresql.log`"" -WindowStyle Hidden
        Start-Sleep -Seconds 5
    }
}
Write-Host "OK: PostgreSQL reiniciado"
Write-Host ""

Write-Host "Paso 8: Verificando conexion..."
Start-Sleep -Seconds 2
$env:PGPASSWORD = $newPassword
$testResult = & $psqlPath -h localhost -U postgres -d postgres -c "SELECT 'OK' as resultado;" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK: Conexion verificada exitosamente!"
    Write-Host ""
    Write-Host "=========================================="
    Write-Host "  PROCESO COMPLETADO EXITOSAMENTE"
    Write-Host "=========================================="
    Write-Host ""
    Write-Host "Credenciales para pgAdmin4:"
    Write-Host "   Host: localhost"
    Write-Host "   Port: 5432"
    Write-Host "   Maintenance database: postgres"
    Write-Host "   Username: postgres"
    Write-Host "   Password: $newPassword"
    Write-Host ""
    Write-Host "IMPORTANTE: Escribe la contraseña manualmente"
    Write-Host "sin copiar/pegar para evitar caracteres ocultos"
    Write-Host ""
} else {
    Write-Host "ADVERTENCIA: No se pudo verificar la conexion"
    Write-Host "Pero la contraseña deberia estar cambiada."
    Write-Host "Intenta conectarte en pgAdmin4 con:"
    Write-Host "   Password: $newPassword"
    Write-Host ""
}

Write-Host "Presiona cualquier tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

