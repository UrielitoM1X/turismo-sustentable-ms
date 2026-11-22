-- Crear bases de datos aisladas por dominio de microservicio
CREATE DATABASE db_users;
CREATE DATABASE db_catalog;
CREATE DATABASE db_bookings;
CREATE DATABASE db_analytics;

-- Conectar a base de datos de catalogo para habilitar funciones geoespaciales
\c db_catalog;

-- Activar extension PostGIS para validar poligonos de alcaldias de CDMX
CREATE EXTENSION IF NOT EXISTS postgis;