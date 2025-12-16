# 🔧 Reseteo Manual de Contraseña PostgreSQL

## Problema
pgAdmin4 muestra error: "la autentificación password falló para el usuario postgres"

## Solución Paso a Paso

### Método 1: Usando el Script (Recomendado)

1. **Abre PowerShell como Administrador:**
   - Presiona `Win + X`
   - Selecciona "Terminal (Administrador)" o "Windows PowerShell (Administrador)"

2. **Navega al directorio:**
   ```powershell
   cd "C:\Users\Administrator\Desktop\Farma GEST\FarmaGest-Backend"
   ```

3. **Ejecuta el script:**
   ```powershell
   .\resetear-password-completo.ps1
   ```

### Método 2: Manual (Si el script no funciona)

#### Paso 1: Detener PostgreSQL
```powershell
Stop-Service -Name "postgresql-x64-18" -Force
```

#### Paso 2: Editar pg_hba.conf
1. Abre el archivo en un editor de texto (como Administrador):
   ```
   C:\Program Files\PostgreSQL\18\data\pg_hba.conf
   ```

2. Busca estas líneas:
   ```
   host    all             all             127.0.0.1/32            scram-sha-256
   host    all             all             ::1/128                 scram-sha-256
   ```

3. Cámbialas a:
   ```
   host    all             all             127.0.0.1/32            trust
   host    all             all             ::1/128                 trust
   ```

4. Guarda el archivo

#### Paso 3: Iniciar PostgreSQL
```powershell
Start-Service -Name "postgresql-x64-18"
```

#### Paso 4: Cambiar la contraseña
```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -U postgres -d postgres -c "ALTER USER postgres WITH PASSWORD 'FarmaGest2024!';"
```

#### Paso 5: Restaurar pg_hba.conf
1. Vuelve a editar `pg_hba.conf`
2. Cambia `trust` de vuelta a `scram-sha-256`
3. Guarda el archivo

#### Paso 6: Reiniciar PostgreSQL
```powershell
Restart-Service -Name "postgresql-x64-18" -Force
```

## Credenciales para pgAdmin4

Después de completar los pasos:
- **Usuario:** `postgres`
- **Contraseña:** `FarmaGest2024!`

## Actualizar .env

Actualiza tu archivo `.env` con:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=FarmaGest2024!
DB_NAME=farma_gest
port=3001
```

