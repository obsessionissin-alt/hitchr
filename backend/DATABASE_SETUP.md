# PostgreSQL Database Setup Guide

## Current Issue
- ✅ PostgreSQL is running on port 5432
- ✅ Port in .env has been fixed to 5432
- ❌ Authentication failed for user "hitch_user"

## Quick Fix Options

### Option 1: Create Database and User (Recommended)

Run these commands in your terminal:

```bash
# Connect to PostgreSQL as superuser
sudo -u postgres psql
```

Then in the psql prompt, run:

```sql
-- Create database
CREATE DATABASE hitch_db;

-- Create user with password
CREATE USER hitch_user WITH PASSWORD 'hitch_password_123';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE hitch_db TO hitch_user;

-- Connect to the database
\c hitch_db

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO hitch_user;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Exit
\q
```

Then update your `.env` file:
```
DATABASE_URL=postgresql://hitch_user:hitch_password_123@localhost:5432/hitch_db
```

### Option 2: Use Default PostgreSQL User

If you want to use the default `postgres` user, update your `.env`:

```
DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/hitch_db
```

Then create the database:
```bash
sudo -u postgres createdb hitch_db
sudo -u postgres psql hitch_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"
sudo -u postgres psql hitch_db -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
```

### Option 3: Use Your System User

If your system user has PostgreSQL access, you can use:

```
DATABASE_URL=postgresql://YOUR_USERNAME@localhost:5432/hitch_db
```

## Verify Setup

After setting up, test the connection:

```bash
cd backend
node test-db-connection.js
```

## Run Migrations

Once connected, run migrations:

```bash
npm run migrate
```

## Troubleshooting

### Check if database exists:
```bash
sudo -u postgres psql -l | grep hitch_db
```

### Check if user exists:
```bash
sudo -u postgres psql -c "\du" | grep hitch_user
```

### Test connection manually:
```bash
psql postgresql://hitch_user:hitch_password_123@localhost:5432/hitch_db
```

### Common Issues:

1. **"password authentication failed"**
   - User doesn't exist or password is wrong
   - Create user: `CREATE USER hitch_user WITH PASSWORD 'password';`

2. **"database does not exist"**
   - Create database: `CREATE DATABASE hitch_db;`

3. **"permission denied"**
   - Grant privileges: `GRANT ALL PRIVILEGES ON DATABASE hitch_db TO hitch_user;`

4. **"extension postgis does not exist"**
   - Install PostGIS: `sudo apt-get install postgis` (Ubuntu/Debian)
   - Enable extension: `CREATE EXTENSION IF NOT EXISTS postgis;`

