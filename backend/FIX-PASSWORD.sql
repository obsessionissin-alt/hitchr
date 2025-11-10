-- FIX-PASSWORD.sql
-- Run these commands in psql as postgres user
-- sudo -u postgres psql

-- Step 1: Reset password for hitch_user
ALTER USER hitch_user WITH PASSWORD 'hitch_password';

-- Step 2: Make sure user can login
ALTER USER hitch_user WITH LOGIN;

-- Step 3: Grant privileges on database
GRANT ALL PRIVILEGES ON DATABASE hitch_db TO hitch_user;

-- Step 4: Connect to the database
\c hitch_db

-- Step 5: Grant schema privileges
GRANT ALL ON SCHEMA public TO hitch_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hitch_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO hitch_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO hitch_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO hitch_user;

-- Step 6: Verify user can connect
\q

