# Script para iniciar PostgreSQL
# Ejecutar como Administrador

Write-Host "=== Iniciando servicio PostgreSQL ===" -ForegroundColor Cyan
Write-Host ""

# Buscar servicio PostgreSQL
$service = Get-Service -Name "postgresql-x64-18" -ErrorAction SilentlyContinue
if (-not $service) {
    $services = Get-Service | Where-Object { $_.Name -like "*postgresql*" }
    if ($services) {
        Write-Host "Servicios PostgreSQL encontrados:" -ForegroundColor Yellow
        foreach ($svc in $services) {
            Write-Host "  - $($svc.Name): $($svc.Status)" -ForegroundColor White
        }
        $service = $services | Where-Object { $_.Name -like "*18*" } | Select-Object -First 1
        if (-not $service) {
            $service = $services[0]
        }
    }
}

if (-not $service) {
    Write-Host "❌ No se encontró ningún servicio PostgreSQL" -ForegroundColor Red
    Write-Host "   Verifica que PostgreSQL esté instalado correctamente" -ForegroundColor Yellow
    exit 1
}

Write-Host "Servicio encontrado: $($service.Name)" -ForegroundColor Green
Write-Host "Estado actual: $($service.Status)" -ForegroundColor Yellow

if ($service.Status -eq 'Running') {
    Write-Host "✅ El servicio ya está corriendo" -ForegroundColor Green
} else {
    Write-Host "Iniciando servicio..." -ForegroundColor Yellow
    
    try {
        Start-Service -Name $service.Name -ErrorAction Stop
        Start-Sleep -Seconds 5
        
        $service.Refresh()
        if ($service.Status -eq 'Running') {
            Write-Host "✅ Servicio iniciado exitosamente" -ForegroundColor Green
        } else {
            Write-Host "⚠️  El servicio no se inició correctamente" -ForegroundColor Yellow
            Write-Host "   Estado: $($service.Status)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Error al iniciar el servicio: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "" -ForegroundColor Yellow
        Write-Host "Posibles soluciones:" -ForegroundColor Yellow
        Write-Host "1. Ejecuta este script como Administrador" -ForegroundColor White
        Write-Host "2. Inicia el servicio manualmente desde Services (services.msc)" -ForegroundColor White
        Write-Host "3. Verifica los logs de PostgreSQL en:" -ForegroundColor White
        Write-Host "   C:\Program Files\PostgreSQL\18\data\log\" -ForegroundColor White
        exit 1
    }
}

# Verificar puerto
Write-Host ""
Write-Host "Verificando puerto 5432..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
$port = Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue

if ($port) {
    Write-Host "✅ Puerto 5432 está escuchando" -ForegroundColor Green
    Write-Host "   PostgreSQL está listo para conexiones" -ForegroundColor Green
} else {
    Write-Host "⚠️  Puerto 5432 aún no está disponible" -ForegroundColor Yellow
    Write-Host "   Espera unos segundos más y vuelve a intentar conectarte" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Ahora puedes conectarte a pgAdmin con:" -ForegroundColor Cyan
Write-Host "   Usuario: postgres" -ForegroundColor White
Write-Host "   Contraseña: FarmaGest2024!" -ForegroundColor White
Write-Host ""


