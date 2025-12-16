# Script simple para resetear contraseña de PostgreSQL
# Usa la conexión trust que ya está configurada

Write-Host "=== Resetear Contraseña de PostgreSQL (Método Simple) ==="
Write-Host ""

# Nueva contraseña
$newPassword = "FarmaGest2024!"

# Ruta a psql
$psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

Write-Host "Reseteando contraseña del usuario 'postgres'..."
Write-Host "Nueva contraseña: $newPassword"
Write-Host ""

# Ejecutar comando SQL para cambiar la contraseña
$sqlCommand = "ALTER USER postgres WITH PASSWORD '$newPassword';"

try {
    # Usar la conexión trust que está configurada para localhost
    & $psqlPath -h localhost -U postgres -d postgres -c $sqlCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Contraseña cambiada exitosamente"
        Write-Host ""
        Write-Host "=== Credenciales para pgAdmin4 ==="
        Write-Host "   Usuario: postgres"
        Write-Host "   Contraseña: $newPassword"
        Write-Host ""
        Write-Host "⚠️  Actualiza tu archivo .env con esta contraseña"
    } else {
        Write-Host ""
        Write-Host "❌ Error al cambiar la contraseña"
        Write-Host "   Código de salida: $LASTEXITCODE"
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error: $_"
    Write-Host ""
    Write-Host "Intenta ejecutar este script como Administrador"
}

Write-Host ""

