# Script para resetear contraseña de PostgreSQL
# Ejecutar como Administrador

Write-Host "=========================================="
Write-Host "  Resetear Contraseña de PostgreSQL"
Write-Host "=========================================="
Write-Host ""

# Verificar si PostgreSQL está corriendo
$service = Get-Service -Name "postgresql-x64-18" -ErrorAction SilentlyContinue
if (-not $service) {
    Write-Host "❌ Servicio PostgreSQL no encontrado"
    Write-Host "   Buscando servicio..."
    $allServices = Get-Service | Where-Object { $_.Name -like "*postgres*" }
    if ($allServices) {
        Write-Host "   Servicios encontrados:"
        $allServices | ForEach-Object { Write-Host "     - $($_.Name)" }
    }
    exit 1
}

if ($service.Status -ne 'Running') {
    Write-Host "⚠️  Servicio PostgreSQL no está corriendo. Iniciando..."
    Start-Service -Name "postgresql-x64-18"
    Start-Sleep -Seconds 3
}

Write-Host "✅ Servicio PostgreSQL está corriendo"
Write-Host ""

# Nueva contraseña
$newPassword = "FarmaGest2024!"

# Ruta a psql
$psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

if (-not (Test-Path $psqlPath)) {
    Write-Host "❌ psql.exe no encontrado en: $psqlPath"
    Write-Host "   Buscando en otras ubicaciones..."
    $possiblePaths = @(
        "C:\Program Files\PostgreSQL\17\bin\psql.exe",
        "C:\Program Files\PostgreSQL\16\bin\psql.exe",
        "C:\Program Files\PostgreSQL\15\bin\psql.exe"
    )
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $psqlPath = $path
            Write-Host "   ✅ Encontrado en: $path"
            break
        }
    }
    if (-not (Test-Path $psqlPath)) {
        Write-Host "   ❌ psql.exe no encontrado"
        exit 1
    }
}

Write-Host "Reseteando contraseña del usuario 'postgres'..."
Write-Host "Nueva contraseña: $newPassword"
Write-Host ""

# Intentar cambiar la contraseña usando la conexión trust
$sqlCommand = "ALTER USER postgres WITH PASSWORD '$newPassword';"

Write-Host "Ejecutando comando SQL..."
Write-Host ""

# Configurar variable de entorno para evitar prompt de contraseña
$env:PGPASSWORD = ""

# Ejecutar comando
$result = & $psqlPath -h localhost -U postgres -d postgres -c $sqlCommand 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Contraseña cambiada exitosamente"
    Write-Host ""
    Write-Host "=========================================="
    Write-Host "  Credenciales para pgAdmin4"
    Write-Host "=========================================="
    Write-Host ""
    Write-Host "  Usuario: postgres"
    Write-Host "  Contraseña: $newPassword"
    Write-Host ""
    Write-Host "=========================================="
    Write-Host ""
    Write-Host "⚠️  IMPORTANTE: Actualiza tu archivo .env con esta contraseña"
    Write-Host ""
} else {
    Write-Host "❌ Error al cambiar la contraseña"
    Write-Host ""
    Write-Host "Salida del comando:"
    Write-Host $result
    Write-Host ""
    Write-Host "Código de salida: $LASTEXITCODE"
    Write-Host ""
    Write-Host "Intenta ejecutar este script como Administrador"
    Write-Host "O sigue la guía en: SOLUCION_PGADMIN4.md"
    Write-Host ""
}

