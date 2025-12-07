# Script para diagnosticar problemas de PostgreSQL
# Ejecutar como Administrador

Write-Host "=== Diagnóstico de PostgreSQL ===" -ForegroundColor Cyan
Write-Host ""

$dataPath = "C:\Program Files\PostgreSQL\18\data"
$logPath = "$dataPath\log"

# Verificar directorio de datos
Write-Host "1. Verificando directorio de datos..." -ForegroundColor Yellow
if (Test-Path $dataPath) {
    Write-Host "   ✅ Directorio encontrado: $dataPath" -ForegroundColor Green
    
    # Verificar archivos críticos
    $criticalFiles = @("PG_VERSION", "postgresql.conf", "pg_hba.conf")
    foreach ($file in $criticalFiles) {
        $filePath = Join-Path $dataPath $file
        if (Test-Path $filePath) {
            Write-Host "   ✅ $file existe" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $file NO existe" -ForegroundColor Red
        }
    }
} else {
    Write-Host "   ❌ Directorio de datos no encontrado" -ForegroundColor Red
    Write-Host "   PostgreSQL puede no estar instalado correctamente" -ForegroundColor Yellow
}

# Verificar logs
Write-Host ""
Write-Host "2. Revisando logs de error..." -ForegroundColor Yellow
if (Test-Path $logPath) {
    $logs = Get-ChildItem -Path $logPath -Filter "*.log" -ErrorAction SilentlyContinue | 
             Sort-Object LastWriteTime -Descending | 
             Select-Object -First 1
    
    if ($logs) {
        Write-Host "   Último log: $($logs.Name)" -ForegroundColor Green
        Write-Host ""
        Write-Host "   Últimas 30 líneas del log:" -ForegroundColor Cyan
        Write-Host "   " + ("=" * 70) -ForegroundColor Gray
        $logContent = Get-Content $logs.FullName -Tail 30
        foreach ($line in $logContent) {
            if ($line -match "ERROR|FATAL|PANIC") {
                Write-Host "   $line" -ForegroundColor Red
            } elseif ($line -match "WARNING") {
                Write-Host "   $line" -ForegroundColor Yellow
            } else {
                Write-Host "   $line" -ForegroundColor White
            }
        }
        Write-Host "   " + ("=" * 70) -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️  No se encontraron archivos de log" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  Directorio de logs no encontrado" -ForegroundColor Yellow
}

# Verificar puerto
Write-Host ""
Write-Host "3. Verificando puerto 5432..." -ForegroundColor Yellow
$port = Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue
if ($port) {
    Write-Host "   ⚠️  Puerto 5432 está en uso" -ForegroundColor Yellow
    $process = Get-Process -Id $port.OwningProcess -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "   Proceso: $($process.Name) (PID: $($process.Id))" -ForegroundColor White
    }
} else {
    Write-Host "   ✅ Puerto 5432 está libre" -ForegroundColor Green
}

# Verificar permisos
Write-Host ""
Write-Host "4. Verificando permisos del directorio de datos..." -ForegroundColor Yellow
if (Test-Path $dataPath) {
    $acl = Get-Acl $dataPath
    Write-Host "   Propietario: $($acl.Owner)" -ForegroundColor White
}

# Verificar servicio
Write-Host ""
Write-Host "5. Estado del servicio..." -ForegroundColor Yellow
$service = Get-Service -Name "postgresql-x64-18" -ErrorAction SilentlyContinue
if ($service) {
    Write-Host "   Estado: $($service.Status)" -ForegroundColor $(if ($service.Status -eq 'Running') { 'Green' } else { 'Yellow' })
    Write-Host "   Tipo de inicio: $((Get-WmiObject Win32_Service -Filter "Name='$($service.Name)'").StartMode)" -ForegroundColor White
} else {
    Write-Host "   ❌ Servicio no encontrado" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Fin del diagnóstico ===" -ForegroundColor Cyan
Write-Host ""




