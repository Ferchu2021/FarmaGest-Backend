# Script completo para configurar PostgreSQL y cambiar contraseña
# Ejecutar como Administrador

Write-Host "=== Configurando PostgreSQL para FarmaGest ===" -ForegroundColor Cyan
Write-Host ""

$newPassword = "FarmaGest2024!"

# Detener el servicio PostgreSQL
Write-Host "1. Deteniendo servicio PostgreSQL..." -ForegroundColor Yellow
$service = Get-Service -Name "postgresql-x64-18" -ErrorAction SilentlyContinue
if (-not $service) {
    $services = Get-Service | Where-Object { $_.Name -like "*postgresql*" }
    if ($services) {
        $service = $services[0]
    }
}

if ($service) {
    Stop-Service -Name $service.Name -Force
    Write-Host "   ✅ Servicio detenido: $($service.Name)" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "   ⚠️  Servicio PostgreSQL no encontrado" -ForegroundColor Yellow
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
    Write-Host "   Busca manualmente el archivo en:" -ForegroundColor Yellow
    Write-Host "   C:\Program Files\PostgreSQL\[VERSION]\data\" -ForegroundColor Yellow
    exit 1
}

Write-Host "2. Archivo encontrado: $pgHbaPath" -ForegroundColor Green

# Hacer backup
$backupPath = "$pgHbaPath.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Copy-Item $pgHbaPath $backupPath
Write-Host "   ✅ Backup creado: $backupPath" -ForegroundColor Green

# Leer y modificar el archivo
$content = Get-Content $pgHbaPath
$newContent = @()
$modified = $false

foreach ($line in $content) {
    if ($line -match "^#?host\s+all\s+all\s+127\.0\.0\.1/32\s+") {
        $newContent += "host    all             all             127.0.0.1/32            trust"
        $modified = $true
    } elseif ($line -match "^#?host\s+all\s+all\s+::1/128\s+") {
        $newContent += "host    all             all             ::1/128                 trust"
        $modified = $true
    } else {
        $newContent += $line
    }
}

if (-not $modified) {
    $newContent += ""
    $newContent += "# Configuración temporal para cambiar contraseña"
    $newContent += "host    all             all             127.0.0.1/32            trust"
    $newContent += "host    all             all             ::1/128                 trust"
}

$newContent | Set-Content $pgHbaPath -Encoding UTF8
Write-Host "3. Archivo modificado para permitir conexiones sin contraseña" -ForegroundColor Green

# Reiniciar el servicio
Write-Host "4. Reiniciando servicio PostgreSQL..." -ForegroundColor Yellow
Start-Service -Name $service.Name -ErrorAction SilentlyContinue
Start-Sleep -Seconds 5

# Cambiar la contraseña
Write-Host "5. Cambiando contraseña de postgres a: $newPassword" -ForegroundColor Yellow

$env:PGPASSWORD = ""
$psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
if (-not (Test-Path $psqlPath)) {
    $psqlPaths = @(
        "C:\Program Files\PostgreSQL\18\bin\psql.exe",
        "C:\Program Files (x86)\PostgreSQL\18\bin\psql.exe"
    )
    foreach ($path in $psqlPaths) {
        if (Test-Path $path) {
            $psqlPath = $path
            break
        }
    }
}

if (Test-Path $psqlPath) {
    $changePasswordQuery = "ALTER USER postgres WITH PASSWORD '$newPassword';"
    & $psqlPath -U postgres -h localhost -c $changePasswordQuery 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Contraseña cambiada exitosamente" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Error al cambiar contraseña. Intenta manualmente:" -ForegroundColor Yellow
        Write-Host "      ALTER USER postgres WITH PASSWORD '$newPassword';" -ForegroundColor White
    }
} else {
    Write-Host "   ⚠️  psql.exe no encontrado. Cambia la contraseña manualmente en pgAdmin:" -ForegroundColor Yellow
    Write-Host "      ALTER USER postgres WITH PASSWORD '$newPassword';" -ForegroundColor White
}

# Restaurar pg_hba.conf
Write-Host "6. Restaurando configuración original de pg_hba.conf..." -ForegroundColor Yellow
Copy-Item $backupPath $pgHbaPath -Force

# Reiniciar servicio nuevamente
Stop-Service -Name $service.Name -Force
Start-Sleep -Seconds 2
Start-Service -Name $service.Name
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "✅ Configuración completada!" -ForegroundColor Green
Write-Host ""
Write-Host "Credenciales de PostgreSQL:" -ForegroundColor Cyan
Write-Host "   Usuario: postgres" -ForegroundColor White
Write-Host "   Contraseña: $newPassword" -ForegroundColor White
Write-Host ""
Write-Host "Ahora puedes conectarte a pgAdmin con estas credenciales." -ForegroundColor Green
Write-Host ""




