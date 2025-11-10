
-- Create database
CREATE DATABASE hitch_db;

-- Create user with password
CREATE USER hitch_user WITH PASSWORD 'hitch_password';

-- Grant privileges on database
GRANT ALL PRIVILEGES ON DATABASE hitch_db TO hitch_user;

-- Connect to the database
\c hitch_db

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO hitch_user;

-- Grant privileges on all existing tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hitch_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO hitch_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO hitch_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO hitch_user;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
