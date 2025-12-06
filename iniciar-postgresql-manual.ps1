# Script para iniciar PostgreSQL manualmente y ver errores
# Ejecutar como Administrador

Write-Host "=== Iniciando PostgreSQL manualmente ===" -ForegroundColor Cyan
Write-Host ""

$dataPath = "C:\Program Files\PostgreSQL\18\data"
$binPath = "C:\Program Files\PostgreSQL\18\bin"

# Verificar rutas
if (-not (Test-Path $dataPath)) {
    Write-Host "❌ Directorio de datos no encontrado: $dataPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $binPath)) {
    Write-Host "❌ Directorio bin no encontrado: $binPath" -ForegroundColor Red
    exit 1
}

$pgctlPath = Join-Path $binPath "pg_ctl.exe"

if (-not (Test-Path $pgctlPath)) {
    Write-Host "❌ pg_ctl.exe no encontrado" -ForegroundColor Red
    exit 1
}

Write-Host "Intentando iniciar PostgreSQL manualmente..." -ForegroundColor Yellow
Write-Host "Esto mostrará los errores en tiempo real" -ForegroundColor Yellow
Write-Host ""

# Intentar iniciar PostgreSQL
& $pgctlPath start -D $dataPath -l "$dataPath\log\startup.log"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ PostgreSQL iniciado exitosamente" -ForegroundColor Green
    Start-Sleep -Seconds 3
    
    # Verificar que esté corriendo
    $port = Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue
    if ($port) {
        Write-Host "✅ Puerto 5432 está activo" -ForegroundColor Green
        Write-Host "   PostgreSQL está listo para conexiones" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Puerto 5432 no está disponible aún" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "❌ Error al iniciar PostgreSQL" -ForegroundColor Red
    Write-Host ""
    Write-Host "Revisando log de inicio..." -ForegroundColor Yellow
    $logFile = Join-Path $dataPath "log\startup.log"
    if (Test-Path $logFile) {
        Write-Host ""
        Write-Host "Últimas líneas del log:" -ForegroundColor Cyan
        Get-Content $logFile -Tail 20
    }
    
    # También revisar el último log de PostgreSQL
    $logs = Get-ChildItem -Path "$dataPath\log" -Filter "postgresql-*.log" | 
             Sort-Object LastWriteTime -Descending | 
             Select-Object -First 1
    
    if ($logs) {
        Write-Host ""
        Write-Host "Últimas líneas del log de PostgreSQL:" -ForegroundColor Cyan
        Get-Content $logs.FullName -Tail 30 | Where-Object { $_ -match "ERROR|FATAL|PANIC|WARNING" -or $_ -match "^\d{4}-\d{2}-\d{2}" }
    }
}

Write-Host ""


