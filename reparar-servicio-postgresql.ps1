# Script para reparar el servicio PostgreSQL
# EJECUTAR COMO ADMINISTRADOR

Write-Host "=== Reparando Servicio PostgreSQL ===" -ForegroundColor Cyan
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
$pgHbaPath = Join-Path $dataPath "pg_hba.conf"

# 1. Detener cualquier instancia de PostgreSQL
Write-Host "1. Deteniendo procesos de PostgreSQL..." -ForegroundColor Yellow
Get-Process | Where-Object { $_.Name -like "*postgres*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 2. Detener el servicio si está corriendo
$service = Get-Service -Name "postgresql-x64-18" -ErrorAction SilentlyContinue
if ($service -and $service.Status -eq 'Running') {
    Write-Host "   Deteniendo servicio..." -ForegroundColor Yellow
    Stop-Service -Name $service.Name -Force
    Start-Sleep -Seconds 3
}

# 3. Verificar y corregir pg_hba.conf
Write-Host ""
Write-Host "2. Verificando pg_hba.conf..." -ForegroundColor Yellow
if (Test-Path $pgHbaPath) {
    $content = Get-Content $pgHbaPath -Raw
    $hasBOM = $content -match '^\xEF\xBB\xBF' -or $content -match '^ï»¿'
    
    if ($hasBOM) {
        Write-Host "   ⚠️  BOM detectado, corrigiendo..." -ForegroundColor Yellow
        $backupPath = "$pgHbaPath.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        Copy-Item $pgHbaPath $backupPath -Force
        $content = $content -replace '^\xEF\xBB\xBF', '' -replace '^ï»¿', ''
        $content | Out-File -FilePath $pgHbaPath -Encoding ASCII -NoNewline -Force
        Write-Host "   ✅ BOM eliminado" -ForegroundColor Green
    } else {
        Write-Host "   ✅ pg_hba.conf está bien" -ForegroundColor Green
    }
} else {
    Write-Host "   ❌ pg_hba.conf no encontrado" -ForegroundColor Red
}

# 4. Verificar permisos del directorio de datos
Write-Host ""
Write-Host "3. Verificando permisos..." -ForegroundColor Yellow
if (Test-Path $dataPath) {
    $acl = Get-Acl $dataPath
    Write-Host "   Propietario: $($acl.Owner)" -ForegroundColor White
    # Intentar dar permisos completos a SYSTEM y Administrators
    try {
        $rule1 = New-Object System.Security.AccessControl.FileSystemAccessRule("SYSTEM", "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow")
        $rule2 = New-Object System.Security.AccessControl.FileSystemAccessRule("BUILTIN\Administrators", "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow")
        $acl.SetAccessRule($rule1)
        $acl.SetAccessRule($rule2)
        Set-Acl -Path $dataPath -AclObject $acl
        Write-Host "   ✅ Permisos actualizados" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  No se pudieron actualizar permisos: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# 5. Verificar que el puerto esté libre
Write-Host ""
Write-Host "4. Verificando puerto 5432..." -ForegroundColor Yellow
$port = Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue
if ($port) {
    Write-Host "   ⚠️  Puerto 5432 en uso, liberando..." -ForegroundColor Yellow
    $process = Get-Process -Id $port.OwningProcess -ErrorAction SilentlyContinue
    if ($process) {
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
}

# 6. Intentar iniciar PostgreSQL manualmente primero
Write-Host ""
Write-Host "5. Iniciando PostgreSQL manualmente para verificar..." -ForegroundColor Yellow
if (Test-Path $pgctlPath) {
    & $pgctlPath start -D $dataPath -l "$dataPath\log\startup.log" 2>&1 | Out-Null
    Start-Sleep -Seconds 5
    
    $port = Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue
    if ($port) {
        Write-Host "   ✅ PostgreSQL iniciado manualmente" -ForegroundColor Green
        
        # Detener para intentar iniciar el servicio
        & $pgctlPath stop -D $dataPath -m fast
        Start-Sleep -Seconds 3
    } else {
        Write-Host "   ❌ No se pudo iniciar PostgreSQL manualmente" -ForegroundColor Red
        Write-Host "   Revisa los logs en: $dataPath\log\" -ForegroundColor Yellow
    }
}

# 7. Intentar iniciar el servicio
Write-Host ""
Write-Host "6. Intentando iniciar el servicio de Windows..." -ForegroundColor Yellow
if ($service) {
    try {
        Start-Service -Name $service.Name -ErrorAction Stop
        Start-Sleep -Seconds 5
        
        $service.Refresh()
        if ($service.Status -eq 'Running') {
            Write-Host "   ✅ Servicio iniciado correctamente" -ForegroundColor Green
            
            Start-Sleep -Seconds 3
            $port = Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue
            if ($port) {
                Write-Host "   ✅ Puerto 5432 está activo" -ForegroundColor Green
                Write-Host ""
                Write-Host "¡Servicio PostgreSQL reparado y funcionando!" -ForegroundColor Green
            }
        } else {
            Write-Host "   ⚠️  Servicio no se inició. Estado: $($service.Status)" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Revisando logs del servicio..." -ForegroundColor Yellow
            $eventLog = Get-EventLog -LogName Application -Source "postgresql-x64-18" -Newest 5 -ErrorAction SilentlyContinue
            if ($eventLog) {
                $eventLog | ForEach-Object { Write-Host "   $($_.TimeGenerated): $($_.Message)" -ForegroundColor Red }
            }
        }
    } catch {
        Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        Write-Host "El servicio no puede iniciarse. Posibles causas:" -ForegroundColor Yellow
        Write-Host "1. Error en la configuración de PostgreSQL" -ForegroundColor White
        Write-Host "2. Problema con los archivos de datos" -ForegroundColor White
        Write-Host "3. Conflicto con otro servicio" -ForegroundColor White
        Write-Host ""
        Write-Host "Revisa los logs en: $dataPath\log\" -ForegroundColor Yellow
    }
}

Write-Host ""




