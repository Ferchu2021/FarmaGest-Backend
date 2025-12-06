# Script simple para crear la base de datos PostgreSQL
$psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

Write-Host "🚀 Creando base de datos PostgreSQL..." -ForegroundColor Green
Write-Host ""

# Crear archivo SQL temporal
$sqlFile = Join-Path $PSScriptRoot "temp_create_db.sql"
$sqlContent = @"
CREATE DATABASE farma_gest;
CREATE USER farma_app WITH PASSWORD 'FarmaApp2024!';
GRANT ALL PRIVILEGES ON DATABASE farma_gest TO farma_app;
"@

$sqlContent | Out-File -FilePath $sqlFile -Encoding UTF8

Write-Host "📝 Ejecutando comandos SQL..." -ForegroundColor Yellow
Write-Host "   (Se te pedirá la contraseña del usuario 'postgres')" -ForegroundColor Yellow
Write-Host ""

# Ejecutar psql
& $psqlPath -U postgres -f $sqlFile

# Limpiar
if (Test-Path $sqlFile) {
    Remove-Item $sqlFile -Force
}

Write-Host ""
Write-Host "✅ Si todo salió bien, ahora ejecuta:" -ForegroundColor Green
Write-Host "   node scripts/crear-schema-postgresql.js" -ForegroundColor Cyan



