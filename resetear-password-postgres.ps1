# Script para resetear la contraseña de PostgreSQL
# Ejecutar como Administrador

Write-Host "=== Reseteando contraseña de PostgreSQL ===" -ForegroundColor Cyan
Write-Host ""

# Detener el servicio PostgreSQL
Write-Host "1. Deteniendo servicio PostgreSQL..." -ForegroundColor Yellow
$service = Get-Service -Name "postgresql-x64-18" -ErrorAction SilentlyContinue
if ($service) {
    Stop-Service -Name "postgresql-x64-18" -Force
    Write-Host "   ✅ Servicio detenido" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Servicio no encontrado. Buscando otros servicios..." -ForegroundColor Yellow
    $services = Get-Service | Where-Object { $_.Name -like "*postgresql*" }
    if ($services) {
        foreach ($svc in $services) {
            Write-Host "   Encontrado: $($svc.Name)" -ForegroundColor Yellow
            Stop-Service -Name $svc.Name -Force
        }
    }
}

# Buscar archivo pg_hba.conf
$pgHbaPaths = @(
    "C:\Program Files\PostgreSQL\18\data\pg_hba.conf",
    "C:\Program Files (x86)\PostgreSQL\18\data\pg_hba.conf",
    "C:\PostgreSQL\18\data\pg_hba.conf"
)

$pgHbaPath = $null
foreach ($path in $pgHbaPaths) {
    if (Test-Path $path) {
        $pgHbaPath = $path
        break
    }
}

if (-not $pgHbaPath) {
    Write-Host "❌ No se encontró pg_hba.conf" -ForegroundColor Red
    Write-Host "   Busca manualmente el archivo pg_hba.conf en:" -ForegroundColor Yellow
    Write-Host "   C:\Program Files\PostgreSQL\[VERSION]\data\" -ForegroundColor Yellow
    exit 1
}

Write-Host "2. Archivo encontrado: $pgHbaPath" -ForegroundColor Green

# Hacer backup
$backupPath = "$pgHbaPath.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Copy-Item $pgHbaPath $backupPath
Write-Host "   ✅ Backup creado: $backupPath" -ForegroundColor Green

# Leer el archivo
$content = Get-Content $pgHbaPath

# Modificar para permitir conexiones sin contraseña desde localhost
$newContent = @()
$modified = $false

foreach ($line in $content) {
    if ($line -match "^#?host\s+all\s+all\s+127\.0\.0\.1/32\s+") {
        $newContent += "host    all             all             127.0.0.1/32            trust"
        $modified = $true
        Write-Host "   ✅ Línea modificada para localhost" -ForegroundColor Green
    } elseif ($line -match "^#?host\s+all\s+all\s+::1/128\s+") {
        $newContent += "host    all             all             ::1/128                 trust"
        $modified = $true
        Write-Host "   ✅ Línea modificada para IPv6 localhost" -ForegroundColor Green
    } else {
        $newContent += $line
    }
}

# Si no se encontró la línea, agregarla
if (-not $modified) {
    Write-Host "   ⚠️  No se encontró línea para localhost, agregando..." -ForegroundColor Yellow
    $newContent += ""
    $newContent += "# Configuración temporal para resetear contraseña"
    $newContent += "host    all             all             127.0.0.1/32            trust"
    $newContent += "host    all             all             ::1/128                 trust"
}

# Guardar el archivo
$newContent | Set-Content $pgHbaPath -Encoding UTF8
Write-Host "3. Archivo modificado" -ForegroundColor Green

# Reiniciar el servicio
Write-Host "4. Reiniciando servicio PostgreSQL..." -ForegroundColor Yellow
Start-Service -Name "postgresql-x64-18" -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "✅ Configuración completada!" -ForegroundColor Green
Write-Host ""
Write-Host "Ahora puedes conectarte a PostgreSQL sin contraseña." -ForegroundColor Cyan
Write-Host ""
Write-Host "Para cambiar la contraseña, ejecuta en psql o pgAdmin:" -ForegroundColor Yellow
Write-Host "   ALTER USER postgres WITH PASSWORD 'tu_nueva_contraseña';" -ForegroundColor White
Write-Host ""
Write-Host "Después de cambiar la contraseña, restaura el backup:" -ForegroundColor Yellow
Write-Host "   Copy-Item '$backupPath' '$pgHbaPath' -Force" -ForegroundColor White
Write-Host ""




