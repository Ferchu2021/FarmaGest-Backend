# Script para iniciar PostgreSQL
# EJECUTAR COMO ADMINISTRADOR

Write-Host "=========================================="
Write-Host "  Iniciar PostgreSQL"
Write-Host "=========================================="
Write-Host ""

# Verificar permisos
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: Ejecuta PowerShell como Administrador"
    pause
    exit 1
}

$serviceName = "postgresql-x64-18"
$pgCtlPath = "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe"
$dataDir = "C:\Program Files\PostgreSQL\18\data"
$logFile = "$dataDir\postgresql.log"

Write-Host "Paso 1: Verificando servicio..."
$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue

if ($service) {
    Write-Host "   Servicio encontrado: $serviceName"
    Write-Host "   Estado actual: $($service.Status)"
    
    if ($service.Status -eq 'Running') {
        Write-Host "   OK: Servicio ya esta corriendo"
    } else {
        Write-Host "   Iniciando servicio..."
        try {
            Start-Service -Name $serviceName -ErrorAction Stop
            Start-Sleep -Seconds 5
            Write-Host "   OK: Servicio iniciado"
        } catch {
            Write-Host "   ERROR: No se pudo iniciar el servicio"
            Write-Host "   Error: $_"
            Write-Host ""
            Write-Host "   Intentando iniciar manualmente..."
            
            if (Test-Path $pgCtlPath) {
                Write-Host "   Usando pg_ctl para iniciar..."
                $result = & $pgCtlPath start -D $dataDir -l $logFile 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "   OK: PostgreSQL iniciado manualmente"
                    Start-Sleep -Seconds 3
                } else {
                    Write-Host "   ERROR: No se pudo iniciar"
                    Write-Host "   Salida: $result"
                    Write-Host ""
                    Write-Host "   Revisa los logs en: $logFile"
                    pause
                    exit 1
                }
            } else {
                Write-Host "   ERROR: pg_ctl.exe no encontrado"
                pause
                exit 1
            }
        }
    }
} else {
    Write-Host "   Servicio no encontrado, iniciando manualmente..."
    if (Test-Path $pgCtlPath) {
        Write-Host "   Usando pg_ctl para iniciar..."
        $result = & $pgCtlPath start -D $dataDir -l $logFile 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   OK: PostgreSQL iniciado"
            Start-Sleep -Seconds 3
        } else {
            Write-Host "   ERROR: No se pudo iniciar"
            Write-Host "   Salida: $result"
            pause
            exit 1
        }
    } else {
        Write-Host "   ERROR: pg_ctl.exe no encontrado"
        pause
        exit 1
    }
}

Write-Host ""
Write-Host "Paso 2: Verificando puerto 5432..."
Start-Sleep -Seconds 2
$port = Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue
if ($port) {
    Write-Host "   OK: Puerto 5432 esta en uso"
    $processId = $port.OwningProcess
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "   Proceso: $($process.ProcessName) (PID: $processId)"
    }
} else {
    Write-Host "   ERROR: Puerto 5432 no esta en uso"
    Write-Host "   PostgreSQL no esta respondiendo"
    Write-Host ""
    Write-Host "   Revisa los logs en: $logFile"
    pause
    exit 1
}

Write-Host ""
Write-Host "Paso 3: Probando conexion..."
$psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
if (Test-Path $psqlPath) {
    $testResult = & $psqlPath -h localhost -U postgres -d postgres -c "SELECT version();" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   OK: Conexion exitosa!"
        Write-Host ""
        Write-Host "=========================================="
        Write-Host "  PostgreSQL esta corriendo correctamente"
        Write-Host "=========================================="
        Write-Host ""
        Write-Host "Ahora puedes conectarte en pgAdmin4 con:"
        Write-Host "   Host: localhost"
        Write-Host "   Port: 5432"
        Write-Host "   Username: postgres"
        Write-Host "   Password: FarmaGest2024!"
        Write-Host ""
    } else {
        Write-Host "   ADVERTENCIA: No se pudo verificar la conexion"
        Write-Host "   Salida: $testResult"
        Write-Host ""
        Write-Host "   Pero el puerto esta en uso, intenta conectarte en pgAdmin4"
    }
} else {
    Write-Host "   psql.exe no encontrado, pero el puerto esta en uso"
    Write-Host "   Intenta conectarte en pgAdmin4"
}

Write-Host ""
Write-Host "Presiona cualquier tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

