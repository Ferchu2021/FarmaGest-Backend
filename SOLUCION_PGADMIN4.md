# 🔧 Solución: Problema de Contraseña en pgAdmin4

## 📋 Problema
pgAdmin4 no permite ingresar porque dice que la contraseña no es válida.

## ✅ Solución Paso a Paso

### Opción 1: Resetear Contraseña desde la Línea de Comandos (Recomendado)

1. **Abre PowerShell como Administrador**
   - Presiona `Win + X`
   - Selecciona "Windows PowerShell (Administrador)" o "Terminal (Administrador)"

2. **Navega al directorio del proyecto:**
   ```powershell
   cd "C:\Users\Administrator\Desktop\Farma GEST\FarmaGest-Backend"
   ```

3. **Ejecuta el script de reseteo:**
   ```powershell
   .\resetear-password-simple.ps1
   ```

### Opción 2: Resetear Manualmente usando psql

1. **Abre PowerShell como Administrador**

2. **Ejecuta este comando:**
   ```powershell
   & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -d postgres -c "ALTER USER postgres WITH PASSWORD 'FarmaGest2024!';"
   ```

   Si te pide contraseña, intenta presionar Enter (puede que funcione con la configuración trust).

### Opción 3: Usar pg_hba.conf (Método Avanzado)

1. **Detén el servicio de PostgreSQL:**
   ```powershell
   Stop-Service -Name "postgresql-x64-18"
   ```

2. **Edita el archivo pg_hba.conf:**
   - Ubicación: `C:\Program Files\PostgreSQL\18\data\pg_hba.conf`
   - Busca la línea que dice:
     ```
     host    all             all             127.0.0.1/32            scram-sha-256
     ```
   - Cámbiala a:
     ```
     host    all             all             127.0.0.1/32            trust
     ```

3. **Inicia el servicio:**
   ```powershell
   Start-Service -Name "postgresql-x64-18"
   ```

4. **Cambia la contraseña:**
   ```powershell
   & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -d postgres -c "ALTER USER postgres WITH PASSWORD 'FarmaGest2024!';"
   ```

5. **Restaura pg_hba.conf:**
   - Vuelve a cambiar `trust` por `scram-sha-256`
   - Reinicia el servicio:
     ```powershell
     Restart-Service -Name "postgresql-x64-18"
     ```

## 🔑 Credenciales para pgAdmin4

Después de resetear la contraseña, usa estas credenciales:

- **Usuario:** `postgres`
- **Contraseña:** `FarmaGest2024!`

## ⚙️ Actualizar archivo .env

Después de cambiar la contraseña, actualiza tu archivo `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=FarmaGest2024!
DB_NAME=farma_gest
port=3001
```

## 🆘 Si Nada Funciona

1. **Verifica que PostgreSQL esté corriendo:**
   ```powershell
   Get-Service -Name "postgresql-x64-18"
   ```

2. **Verifica el puerto:**
   ```powershell
   Get-NetTCPConnection -LocalPort 5432
   ```

3. **Revisa los logs de PostgreSQL:**
   - Ubicación: `C:\Program Files\PostgreSQL\18\data\log\`
   - Busca errores recientes

## 📝 Notas

- La contraseña `FarmaGest2024!` es la que se configuró anteriormente
- Si prefieres otra contraseña, cámbiala en todos los pasos
- Asegúrate de actualizar el archivo `.env` después de cambiar la contraseña

