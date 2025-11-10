-- setup-database-schema.sql
-- Run this AFTER connecting to hitch_db
-- Usage: sudo -u postgres psql hitch_db -f setup-database-schema.sql

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO hitch_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hitch_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO hitch_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO hitch_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO hitch_user;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verify
SELECT 'Database setup complete!' AS status;
SELECT extname FROM pg_extension WHERE extname IN ('postgis', 'uuid-ossp');

