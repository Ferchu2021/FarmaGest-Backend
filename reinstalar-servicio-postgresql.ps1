# Script para reinstalar el servicio PostgreSQL
# EJECUTAR COMO ADMINISTRADOR

Write-Host "=== Reinstalando Servicio PostgreSQL ===" -ForegroundColor Cyan
Write-Host ""

# Verificar permisos de administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ Este script requiere permisos de Administrador" -ForegroundColor Red
    Write-Host "   Ejecuta PowerShell como Administrador" -ForegroundColor Yellow
    exit 1
}

$dataPath = "C:\Program Files\PostgreSQL\18\data"
$binPath = "C:\Program Files\PostgreSQL\18\bin"
$pgctlPath = Join-Path $binPath "pg_ctl.exe"
$serviceName = "postgresql-x64-18"

# 1. Detener PostgreSQL
Write-Host "1. Deteniendo PostgreSQL..." -ForegroundColor Yellow
Get-Process | Where-Object { $_.Name -like "*postgres*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 2. Eliminar el servicio si existe
Write-Host ""
Write-Host "2. Eliminando servicio existente..." -ForegroundColor Yellow
$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($service) {
    if ($service.Status -eq 'Running') {
        Stop-Service -Name $serviceName -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 3
    }
    
    try {
        $wmi = Get-WmiObject Win32_Service -Filter "Name='$serviceName'"
        $wmi.Delete()
        Write-Host "   ✅ Servicio eliminado" -ForegroundColor Green
        Start-Sleep -Seconds 2
    } catch {
        Write-Host "   ⚠️  No se pudo eliminar el servicio: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ℹ️  Servicio no existe" -ForegroundColor White
}

# 3. Reinstalar el servicio usando pg_ctl
Write-Host ""
Write-Host "3. Reinstalando servicio..." -ForegroundColor Yellow
if (Test-Path $pgctlPath) {
    try {
        # Usar pg_ctl para registrar el servicio
        & $pgctlPath register -N $serviceName -D $dataPath -w
        Start-Sleep -Seconds 3
        
        $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
        if ($service) {
            Write-Host "   ✅ Servicio reinstalado" -ForegroundColor Green
            
            # Configurar para inicio automático
            Set-Service -Name $serviceName -StartupType Automatic
            Write-Host "   ✅ Configurado para inicio automático" -ForegroundColor Green
            
            # Intentar iniciar
            Write-Host ""
            Write-Host "4. Intentando iniciar el servicio..." -ForegroundColor Yellow
            Start-Service -Name $serviceName -ErrorAction Stop
            Start-Sleep -Seconds 5
            
            $service.Refresh()
            if ($service.Status -eq 'Running') {
                Write-Host "   ✅ Servicio iniciado correctamente" -ForegroundColor Green
                
                Start-Sleep -Seconds 3
                $port = Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue
                if ($port) {
                    Write-Host "   ✅ Puerto 5432 está activo" -ForegroundColor Green
                    Write-Host ""
                    Write-Host "¡Servicio PostgreSQL reinstalado y funcionando!" -ForegroundColor Green
                }
            } else {
                Write-Host "   ⚠️  Servicio no se inició. Estado: $($service.Status)" -ForegroundColor Yellow
            }
        } else {
            Write-Host "   ❌ No se pudo reinstalar el servicio" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        Write-Host "Intentando método alternativo..." -ForegroundColor Yellow
        
        # Método alternativo: usar sc.exe
        $scPath = "sc.exe"
        & $scPath delete $serviceName 2>&1 | Out-Null
        Start-Sleep -Seconds 2
        
        $servicePath = "`"$pgctlPath`" runservice -N `"$serviceName`""
        & $scPath create $serviceName binPath= $servicePath start= auto DisplayName= "PostgreSQL 18 Server" 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Servicio creado con sc.exe" -ForegroundColor Green
            Start-Service -Name $serviceName -ErrorAction SilentlyContinue
        }
    }
} else {
    Write-Host "   ❌ pg_ctl.exe no encontrado" -ForegroundColor Red
}

Write-Host ""




