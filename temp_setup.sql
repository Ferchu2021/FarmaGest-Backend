
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
      