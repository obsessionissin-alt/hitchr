// backend/test-db-connection.js
require('dotenv').config();
const { Pool } = require('pg');

async function testConnection() {
  console.log('🔍 Testing PostgreSQL Connection...\n');

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    console.log('\n💡 Please set DATABASE_URL in your .env file');
    console.log('   Example: DATABASE_URL=postgresql://user:password@localhost:5432/hitchr');
    process.exit(1);
  }

  console.log('✅ DATABASE_URL found');
  console.log(`   Connection string: ${process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')}\n`);

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  try {
    console.log('🔄 Attempting to connect...');
    
    // Test basic connection
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Connected successfully!');
    console.log(`   Current time: ${result.rows[0].current_time}`);
    console.log(`   PostgreSQL version: ${result.rows[0].pg_version.split(',')[0]}\n`);

    // Check PostGIS extension
    console.log('🔄 Checking PostGIS extension...');
    const postgisCheck = await pool.query(
      "SELECT * FROM pg_extension WHERE extname = 'postgis'"
    );
    
    if (postgisCheck.rows.length > 0) {
      console.log('✅ PostGIS extension is installed\n');
    } else {
      console.log('⚠️  PostGIS extension not found');
      console.log('   Run: CREATE EXTENSION IF NOT EXISTS postgis;\n');
    }

    // Check uuid-ossp extension
    console.log('🔄 Checking uuid-ossp extension...');
    const uuidCheck = await pool.query(
      "SELECT * FROM pg_extension WHERE extname = 'uuid-ossp'"
    );
    
    if (uuidCheck.rows.length > 0) {
      console.log('✅ uuid-ossp extension is installed\n');
    } else {
      console.log('⚠️  uuid-ossp extension not found');
      console.log('   Run: CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n');
    }

    // Check if tables exist
    console.log('🔄 Checking database tables...');
    const tablesCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    const expectedTables = [
      'users',
      'pilot_locations',
      'rides',
      'active_notifications',
      'tokens',
      'telemetry'
    ];

    console.log(`   Found ${tablesCheck.rows.length} tables:`);
    tablesCheck.rows.forEach(row => {
      const exists = expectedTables.includes(row.table_name);
      console.log(`   ${exists ? '✅' : '⚠️ '} ${row.table_name}`);
    });

    const missingTables = expectedTables.filter(
      table => !tablesCheck.rows.find(row => row.table_name === table)
    );

    if (missingTables.length > 0) {
      console.log(`\n⚠️  Missing tables: ${missingTables.join(', ')}`);
      console.log('   Run migrations: npm run migrate\n');
    } else {
      console.log('\n✅ All expected tables exist!\n');
    }

    // Test a simple query on users table
    if (tablesCheck.rows.find(row => row.table_name === 'users')) {
      console.log('🔄 Testing users table query...');
      const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
      console.log(`   Users in database: ${userCount.rows[0].count}`);
    }

    await pool.end();
    console.log('\n✅ Database connection test completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Database connection failed!');
    console.error(`   Error: ${error.message}\n`);

    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Connection refused. Check if PostgreSQL is running:');
      console.log('   sudo systemctl status postgresql');
      console.log('   or');
      console.log('   sudo service postgresql status\n');
    } else if (error.code === '28P01') {
      console.log('💡 Authentication failed. Check your DATABASE_URL credentials.\n');
    } else if (error.code === '3D000') {
      console.log('💡 Database does not exist. Create it first:');
      console.log('   createdb hitchr\n');
    } else {
      console.log('💡 Common fixes:');
      console.log('   1. Check PostgreSQL is running');
      console.log('   2. Verify DATABASE_URL in .env file');
      console.log('   3. Check database exists');
      console.log('   4. Verify user permissions\n');
    }

    await pool.end();
    process.exit(1);
  }
}

testConnection();

