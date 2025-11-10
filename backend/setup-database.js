// backend/setup-database.js
// This script helps set up PostgreSQL database and user
// Run with: node setup-database.js

console.log('🗄️  PostgreSQL Database Setup Helper\n');
console.log('This script will help you set up the database.\n');
console.log('You have two options:\n');
console.log('Option 1: Use existing PostgreSQL user (recommended)');
console.log('  - Connect as postgres superuser');
console.log('  - Create database and user if needed\n');
console.log('Option 2: Use your current system user');
console.log('  - No password needed if using peer authentication\n');

console.log('📋 Manual Setup Instructions:\n');
console.log('1. Connect to PostgreSQL as superuser:');
console.log('   sudo -u postgres psql\n');
console.log('2. Run these commands in psql:');
console.log('');
console.log('   -- Create database');
console.log('   CREATE DATABASE hitch_db;');
console.log('');
console.log('   -- Create user (change password)');
console.log('   CREATE USER hitch_user WITH PASSWORD \'your_password_here\';');
console.log('');
console.log('   -- Grant privileges');
console.log('   GRANT ALL PRIVILEGES ON DATABASE hitch_db TO hitch_user;');
console.log('');
console.log('   -- Connect to hitch_db');
console.log('   \\c hitch_db');
console.log('');
console.log('   -- Grant schema privileges');
console.log('   GRANT ALL ON SCHEMA public TO hitch_user;');
console.log('');
console.log('   -- Enable extensions');
console.log('   CREATE EXTENSION IF NOT EXISTS postgis;');
console.log('   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
console.log('');
console.log('3. Update your .env file:');
console.log('   DATABASE_URL=postgresql://hitch_user:your_password_here@localhost:5432/hitch_db\n');

console.log('💡 Quick Setup (if you want to use postgres user):');
console.log('   Update .env to: DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hitch_db');
console.log('   Then run migrations: npm run migrate\n');

console.log('🔍 To check existing databases:');
console.log('   sudo -u postgres psql -l\n');

console.log('🔍 To check existing users:');
console.log('   sudo -u postgres psql -c "\\du"\n');

