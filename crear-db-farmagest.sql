-- Script para crear base de datos y usuario FarmaGest
-- Ejecuta esto en pgAdmin o psql

-- Crear base de datos
CREATE DATABASE farma_gest 
WITH ENCODING 'UTF8' 
TEMPLATE template0;

-- Crear usuario
CREATE USER farma_app WITH PASSWORD 'FarmaApp2024!';

-- Dar permisos
GRANT ALL PRIVILEGES ON DATABASE farma_gest TO farma_app;

-- Conectar a la base de datos
\c farma_gest

-- Dar permisos en el esquema público
GRANT ALL PRIVILEGES ON SCHEMA public TO farma_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO farma_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO farma_app;

-- Dar permisos para futuras tablas
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO farma_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO farma_app;

-- Crear extensiones
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
