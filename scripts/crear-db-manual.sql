-- =====================================================
-- Script SQL para crear la base de datos y usuario
-- Ejecutar en pgAdmin o psql como usuario postgres
-- =====================================================

-- Crear base de datos
CREATE DATABASE farma_gest;

-- Crear usuario
CREATE USER farma_app WITH PASSWORD 'FarmaApp2024!';

-- Dar permisos completos
GRANT ALL PRIVILEGES ON DATABASE farma_gest TO farma_app;

-- Conectar a la base de datos
\c farma_gest

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Dar permisos en el esquema public
GRANT ALL ON SCHEMA public TO farma_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO farma_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO farma_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO farma_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO farma_app;



