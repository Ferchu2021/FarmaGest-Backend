# Script para configurar el servicio PostgreSQL para que inicie correctamente
# EJECUTAR COMO ADMINISTRADOR

Write-Host "=== Configurando Servicio PostgreSQL ===" -ForegroundColor Cyan
Write-Host ""

# Verificar que se ejecute como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ Este script requiere permisos de Administrador" -ForegroundColor Red
    Write-Host ""
    Write-Host "Para ejecutarlo:" -ForegroundColor Yellow
    Write-Host "1. Click derecho en PowerShell" -ForegroundColor White
    Write-Host "2. Selecciona 'Ejecutar como administrador'" -ForegroundColor White
    Write-Host "3. Navega al directorio y ejecuta el script" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Buscar servicio PostgreSQL
$service = Get-Service -Name "postgresql-x64-18" -ErrorAction SilentlyContinue
if (-not $service) {
    $services = Get-Service | Where-Object { $_.Name -like "*postgresql*" }
    if ($services) {
        $service = $services | Where-Object { $_.Name -like "*18*" } | Select-Object -First 1
        if (-not $service) {
            $service = $services[0]
        }
    }
}

if (-not $service) {
    Write-Host "❌ Servicio PostgreSQL no encontrado" -ForegroundColor Red
    exit 1
}

Write-Host "Servicio encontrado: $($service.Name)" -ForegroundColor Green
Write-Host ""

# Detener el servicio si está corriendo
if ($service.Status -eq 'Running') {
    Write-Host "Deteniendo servicio..." -ForegroundColor Yellow
    Stop-Service -Name $service.Name -Force
    Start-Sleep -Seconds 2
}

# Configurar para inicio automático
Write-Host "Configurando inicio automático..." -ForegroundColor Yellow
Set-Service -Name $service.Name -StartupType Automatic
Write-Host "✅ Servicio configurado para inicio automático" -ForegroundColor Green

# Verificar la ruta del ejecutable del servicio
$wmi = Get-WmiObject Win32_Service -Filter "Name='$($service.Name)'"
Write-Host ""
Write-Host "Configuración del servicio:" -ForegroundColor Cyan
Write-Host "   Nombre: $($service.Name)" -ForegroundColor White
Write-Host "   Ruta: $($wmi.PathName)" -ForegroundColor White
Write-Host "   Tipo de inicio: $($wmi.StartMode)" -ForegroundColor White

# Intentar iniciar el servicio
Write-Host ""
Write-Host "Intentando iniciar el servicio..." -ForegroundColor Yellow
try {
    Start-Service -Name $service.Name -ErrorAction Stop
    Start-Sleep -Seconds 5
    
    $service.Refresh()
    if ($service.Status -eq 'Running') {
        Write-Host "✅ Servicio iniciado correctamente" -ForegroundColor Green
        
        # Verificar puerto
        Start-Sleep -Seconds 3
        $port = Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue
        if ($port) {
            Write-Host "✅ Puerto 5432 está activo" -ForegroundColor Green
            Write-Host ""
            Write-Host "¡PostgreSQL está funcionando correctamente!" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Puerto 5432 aún no está disponible" -ForegroundColor Yellow
            Write-Host "   Espera unos segundos más..." -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  El servicio no se inició correctamente" -ForegroundColor Yellow
        Write-Host "   Estado: $($service.Status)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Intentando iniciar PostgreSQL manualmente..." -ForegroundColor Yellow
        
        # Iniciar manualmente como respaldo
        $dataPath = "C:\Program Files\PostgreSQL\18\data"
        $binPath = "C:\Program Files\PostgreSQL\18\bin"
        $pgctlPath = Join-Path $binPath "pg_ctl.exe"
        
        if (Test-Path $pgctlPath) {
            & $pgctlPath start -D $dataPath -l "$dataPath\log\startup.log"
            Start-Sleep -Seconds 5
            $port = Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue
            if ($port) {
                Write-Host "✅ PostgreSQL iniciado manualmente" -ForegroundColor Green
            }
        }
    }
} catch {
    Write-Host "❌ Error al iniciar el servicio: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Posibles causas:" -ForegroundColor Yellow
    Write-Host "1. El archivo pg_hba.conf tiene errores" -ForegroundColor White
    Write-Host "2. El directorio de datos está corrupto" -ForegroundColor White
    Write-Host "3. Hay otro proceso usando el puerto 5432" -ForegroundColor White
    Write-Host ""
    Write-Host "Solución: Ejecuta el script de diagnóstico:" -ForegroundColor Yellow
    Write-Host "   .\diagnosticar-postgresql.ps1" -ForegroundColor White
}

Write-Host ""




