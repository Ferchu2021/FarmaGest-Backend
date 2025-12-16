# Script para resetear la contraseña de PostgreSQL
# Ejecutar como Administrador

Write-Host "=== Resetear Contraseña de PostgreSQL ==="
Write-Host ""

# Detener el servicio de PostgreSQL
Write-Host "1. Deteniendo servicio de PostgreSQL..."
$service = Get-Service -Name "postgresql-x64-18" -ErrorAction SilentlyContinue
if ($service -and $service.Status -eq 'Running') {
    Stop-Service -Name "postgresql-x64-18" -Force
    Start-Sleep -Seconds 3
    Write-Host "   ✅ Servicio detenido"
} else {
    Write-Host "   ℹ️  Servicio ya estaba detenido"
}
Write-Host ""

# Ruta al archivo pg_hba.conf
$pgHbaPath = "C:\Program Files\PostgreSQL\18\data\pg_hba.conf"
$pgHbaBackup = "$pgHbaPath.backup"

# Hacer backup del archivo original
Write-Host "2. Creando backup de pg_hba.conf..."
Copy-Item $pgHbaPath $pgHbaBackup -Force
Write-Host "   ✅ Backup creado: $pgHbaBackup"
Write-Host ""

# Leer el contenido actual
$content = Get-Content $pgHbaPath -Raw

# Reemplazar métodos de autenticación por 'trust' temporalmente
Write-Host "3. Configurando autenticación temporal (trust)..."
$content = $content -replace '^(local\s+all\s+all\s+)(md5|scram-sha-256|password)', '$1trust'
$content = $content -replace '^(host\s+all\s+all\s+127\.0\.0\.1/32\s+)(md5|scram-sha-256|password)', '$1trust'
$content = $content -replace '^(host\s+all\s+all\s+::1/128\s+)(md5|scram-sha-256|password)', '$1trust'

# Guardar el archivo modificado
[System.IO.File]::WriteAllText($pgHbaPath, $content, [System.Text.Encoding]::UTF8)
Write-Host "   ✅ Archivo pg_hba.conf modificado"
Write-Host ""

# Iniciar el servicio
Write-Host "4. Iniciando servicio de PostgreSQL..."
Start-Service -Name "postgresql-x64-18"
Start-Sleep -Seconds 5
Write-Host "   ✅ Servicio iniciado"
Write-Host ""

# Nueva contraseña
$newPassword = "FarmaGest2024!"

Write-Host "5. Reseteando contraseña del usuario 'postgres'..."
Write-Host "   Nueva contraseña: $newPassword"
Write-Host ""

# Ejecutar comando para cambiar la contraseña
$env:PGPASSWORD = ""
$psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

# Cambiar contraseña usando psql
$changePasswordSQL = "ALTER USER postgres WITH PASSWORD '$newPassword';"

try {
    & $psqlPath -U postgres -d postgres -c $changePasswordSQL
    Write-Host "   ✅ Contraseña cambiada exitosamente"
} catch {
    Write-Host "   ❌ Error al cambiar contraseña: $_"
}
Write-Host ""

# Restaurar el archivo pg_hba.conf original
Write-Host "6. Restaurando configuración de autenticación..."
Copy-Item $pgHbaBackup $pgHbaPath -Force
Write-Host "   ✅ Archivo pg_hba.conf restaurado"
Write-Host ""

# Reiniciar el servicio
Write-Host "7. Reiniciando servicio..."
Restart-Service -Name "postgresql-x64-18" -Force
Start-Sleep -Seconds 3
Write-Host "   ✅ Servicio reiniciado"
Write-Host ""

Write-Host "=== Resumen ==="
Write-Host ""
Write-Host "✅ Contraseña reseteada para el usuario 'postgres'"
Write-Host "   Nueva contraseña: $newPassword"
Write-Host ""
Write-Host "Ahora puedes usar esta contraseña en pgAdmin4:"
Write-Host "   Usuario: postgres"
Write-Host "   Contraseña: $newPassword"
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Actualiza tu archivo .env con la nueva contraseña"
Write-Host ""

