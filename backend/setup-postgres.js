// backend/setup-postgres.js
// Interactive PostgreSQL setup script
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🗄️  PostgreSQL Database Setup\n');

const DB_NAME = 'hitch_db';
const DB_USER = 'hitch_user';
const DB_PASSWORD = 'hitch_password';

// SQL commands to run
const sqlCommands = `
CREATE DATABASE ${DB_NAME};
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
\\c ${DB_NAME}
GRANT ALL ON SCHEMA public TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
`;

console.log('📋 Setup Configuration:');
console.log(`   Database: ${DB_NAME}`);
console.log(`   User: ${DB_USER}`);
console.log(`   Password: ${DB_PASSWORD}\n`);

console.log('⚠️  This script requires sudo access to PostgreSQL');
console.log('   You have two options:\n');

console.log('Option 1: Run automated script (requires sudo password)');
console.log('   bash auto-setup-db.sh\n');

console.log('Option 2: Manual setup (recommended)');
console.log('   Run these commands:\n');

console.log('   sudo -u postgres psql\n');
console.log('   Then execute:\n');

// Split SQL commands for interactive use
const interactiveCommands = `
-- Step 1: Create database
CREATE DATABASE ${DB_NAME};

-- Step 2: Create user
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';

-- Step 3: Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};

-- Step 4: Connect to database
\\c ${DB_NAME}

-- Step 5: Grant schema privileges
GRANT ALL ON SCHEMA public TO ${DB_USER};

-- Step 6: Enable extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
`;

console.log(interactiveCommands);
console.log('\n');

// Write to file for easy execution
const sqlFile = path.join(__dirname, 'setup-database.sql');
fs.writeFileSync(sqlFile, sqlCommands.replace(/\\c/g, '-- \\c')); // Comment out \c for file execution

console.log('✅ SQL file created: setup-database.sql');
console.log('   You can also run: sudo -u postgres psql < setup-database.sql\n');

// Try to check if user exists
console.log('🔍 Checking current setup...\n');

try {
  // Check if database exists
  const dbCheck = execSync(`sudo -u postgres psql -lqt | cut -d \\| -f 1 | grep -qw ${DB_NAME} && echo "exists" || echo "not found"`, { encoding: 'utf-8' }).trim();
  console.log(`Database ${DB_NAME}: ${dbCheck === 'exists' ? '✅ exists' : '❌ not found'}`);
} catch (e) {
  console.log(`Database ${DB_NAME}: ⚠️  Could not check (need sudo)`);
}

try {
  // Check if user exists
  const userCheck = execSync(`sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'"`, { encoding: 'utf-8' }).trim();
  console.log(`User ${DB_USER}: ${userCheck === '1' ? '✅ exists' : '❌ not found'}`);
} catch (e) {
  console.log(`User ${DB_USER}: ⚠️  Could not check (need sudo)`);
}

console.log('\n💡 After setup, test connection:');
console.log('   node test-db-connection.js\n');

