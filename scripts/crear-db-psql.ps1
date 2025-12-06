# Script PowerShell para crear la base de datos PostgreSQL
# Uso: .\scripts\crear-db-psql.ps1

$psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

if (-not (Test-Path $psqlPath)) {
    Write-Host "❌ No se encontró psql.exe en la ruta esperada"
    Write-Host "   Buscando en otras ubicaciones..."
    
    $possiblePaths = @(
        "C:\Program Files\PostgreSQL\16\bin\psql.exe",
        "C:\Program Files\PostgreSQL\15\bin\psql.exe",
        "C:\Program Files\PostgreSQL\17\bin\psql.exe"
    )
    
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $psqlPath = $path
            Write-Host "✅ Encontrado en: $psqlPath"
            break
        }
    }
    
    if (-not (Test-Path $psqlPath)) {
        Write-Host "❌ No se pudo encontrar psql.exe"
        Write-Host "   Por favor, ejecuta manualmente en pgAdmin o psql:"
        Write-Host "   CREATE DATABASE farma_gest;"
        Write-Host "   CREATE USER farma_app WITH PASSWORD 'FarmaApp2024!';"
        Write-Host "   GRANT ALL PRIVILEGES ON DATABASE farma_gest TO farma_app;"
        exit 1
    }
}

Write-Host "🚀 Creando base de datos PostgreSQL..."
Write-Host ""

# Crear script SQL temporal
$sqlScript = @"
-- Crear base de datos
SELECT 'CREATE DATABASE farma_gest' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'farma_gest')\gexec

-- Crear usuario
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'farma_app') THEN
        CREATE USER farma_app WITH PASSWORD 'FarmaApp2024!';
    END IF;
END
\$\$;

-- Dar permisos
GRANT ALL PRIVILEGES ON DATABASE farma_gest TO farma_app;

-- Conectar a la base de datos
\c farma_gest

-- Crear extensiones
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Dar permisos en el esquema
GRANT ALL ON SCHEMA public TO farma_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO farma_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO farma_app;
"@

$tempScript = Join-Path $PSScriptRoot "temp_create_db.sql"
$sqlScript | Out-File -FilePath $tempScript -Encoding UTF8

Write-Host "📝 Ejecutando script SQL..."
Write-Host "   (Se te pedirá la contraseña del usuario 'postgres')"
Write-Host ""

# Ejecutar psql
Write-Host "Ejecutando comandos SQL..."
& $psqlPath -U postgres -f $tempScript

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ ¡Base de datos creada exitosamente!"
    Write-Host ""
    Write-Host "📋 Resumen:"
    Write-Host "   Base de datos: farma_gest"
    Write-Host "   Usuario: farma_app"
    Write-Host "   Contraseña: FarmaApp2024!"
    Write-Host ""
    Write-Host "🚀 Próximo paso: Ejecuta 'node scripts/crear-schema-postgresql.js'"
} else {
    Write-Host ""
    Write-Host "⚠️  El script se ejecutó pero hubo algunos errores"
    Write-Host "   Esto puede ser normal si la base de datos o usuario ya existían"
    Write-Host ""
    Write-Host "💡 Solución alternativa:"
    Write-Host "   1. Abre pgAdmin"
    Write-Host "   2. Conecta al servidor PostgreSQL"
    Write-Host "   3. Ejecuta el archivo: scripts\crear-db-manual.sql"
}

# Limpiar archivo temporal
if (Test-Path $tempScript) {
    Remove-Item $tempScript -Force
}

