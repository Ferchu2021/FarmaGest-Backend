# Script para diagnosticar problemas de PostgreSQL
# EJECUTAR COMO ADMINISTRADOR

Write-Host "=========================================="
Write-Host "  Diagnosticar PostgreSQL"
Write-Host "=========================================="
Write-Host ""

$dataDir = "C:\Program Files\PostgreSQL\18\data"
$logDir = "$dataDir\log"
$pgHbaPath = "$dataDir\pg_hba.conf"
$postgresqlConf = "$dataDir\postgresql.conf"

Write-Host "1. Verificando archivos de configuracion..."
if (Test-Path $pgHbaPath) {
    Write-Host "   OK: pg_hba.conf encontrado"
    
    # Verificar BOM
    $bytes = [System.IO.File]::ReadAllBytes($pgHbaPath)
    if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
        Write-Host "   ERROR: Archivo tiene BOM (Byte Order Mark)"
        Write-Host "   Esto puede impedir que PostgreSQL inicie"
        Write-Host ""
        Write-Host "   Removiendo BOM..."
        $content = Get-Content $pgHbaPath -Raw
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($pgHbaPath, $content, $utf8NoBom)
        Write-Host "   OK: BOM removido"
    } else {
        Write-Host "   OK: Archivo sin BOM"
    }
} else {
    Write-Host "   ERROR: pg_hba.conf no encontrado"
}

if (Test-Path $postgresqlConf) {
    Write-Host "   OK: postgresql.conf encontrado"
} else {
    Write-Host "   ERROR: postgresql.conf no encontrado"
}

Write-Host ""
Write-Host "2. Verificando logs..."
if (Test-Path $logDir) {
    $latestLog = Get-ChildItem $logDir -Filter "*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($latestLog) {
        Write-Host "   Log mas reciente: $($latestLog.Name)"
        Write-Host ""
        Write-Host "   Ultimas 10 lineas con ERROR o FATAL:"
        Get-Content $latestLog.FullName | Select-String -Pattern "ERROR|FATAL" | Select-Object -Last 10
    }
} else {
    Write-Host "   Directorio de logs no encontrado"
}

Write-Host ""
Write-Host "3. Verificando archivos de bloqueo..."
$pidFile = "$dataDir\postmaster.pid"
if (Test-Path $pidFile) {
    Write-Host "   ADVERTENCIA: postmaster.pid encontrado"
    Write-Host "   Esto puede indicar que PostgreSQL no se cerro correctamente"
    Write-Host ""
    Write-Host "   Contenido:"
    Get-Content $pidFile | Select-Object -First 1
    Write-Host ""
    Write-Host "   ¿Deseas eliminar este archivo? (S/N)"
    $response = Read-Host
    if ($response -eq "S" -or $response -eq "s") {
        Remove-Item $pidFile -Force
        Write-Host "   OK: Archivo eliminado"
    }
} else {
    Write-Host "   OK: No hay archivo postmaster.pid"
}

Write-Host ""
Write-Host "4. Verificando permisos..."
$acl = Get-Acl $dataDir
Write-Host "   Propietario: $($acl.Owner)"
Write-Host "   Permisos del directorio verificados"

Write-Host ""
Write-Host "5. Intentando iniciar PostgreSQL..."
$serviceName = "postgresql-x64-18"
$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue

if ($service) {
    if ($service.Status -ne 'Running') {
        Write-Host "   Iniciando servicio..."
        try {
            Start-Service -Name $serviceName -ErrorAction Stop
            Start-Sleep -Seconds 5
            if ((Get-Service -Name $serviceName).Status -eq 'Running') {
                Write-Host "   OK: Servicio iniciado"
            } else {
                Write-Host "   ERROR: Servicio no se inicio"
            }
        } catch {
            Write-Host "   ERROR: $($_.Exception.Message)"
        }
    } else {
        Write-Host "   OK: Servicio ya esta corriendo"
    }
} else {
    Write-Host "   Servicio no encontrado"
}

Write-Host ""
Write-Host "Presiona cualquier tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

