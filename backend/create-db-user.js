// backend/create-db-user.js
// Script to create database and user via psql commands
// This will output SQL commands you can run manually

const fs = require('fs');
const path = require('path');

console.log('📋 PostgreSQL Setup SQL Commands\n');
console.log('Run these commands as postgres superuser:\n');
console.log('Method 1: Using psql');
console.log('  sudo -u postgres psql\n');
console.log('Method 2: Direct command');
console.log('  sudo -u postgres psql -f setup.sql\n');

const sqlCommands = `
-- Create database
CREATE DATABASE hitch_db;

-- Create user with password
CREATE USER hitch_user WITH PASSWORD 'hitch_password';

-- Grant privileges on database
GRANT ALL PRIVILEGES ON DATABASE hitch_db TO hitch_user;

-- Connect to the database
\\c hitch_db

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
`;

// Write SQL file
const sqlPath = path.join(__dirname, 'setup.sql');
fs.writeFileSync(sqlPath, sqlCommands);

console.log('✅ Created setup.sql file\n');
console.log('📝 SQL Commands:');
console.log('─'.repeat(50));
console.log(sqlCommands);
console.log('─'.repeat(50));
console.log('\n💡 To execute:');
console.log('   sudo -u postgres psql -f setup.sql');
console.log('\n💡 Or run interactively:');
console.log('   sudo -u postgres psql');
console.log('   Then copy-paste the SQL commands above\n');

