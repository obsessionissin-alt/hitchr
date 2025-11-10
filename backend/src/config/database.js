const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  console.error('   Please set DATABASE_URL in your .env file');
  console.error('   Example: DATABASE_URL=postgresql://user:password@localhost:5432/hitchr');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

// Test connection on startup
const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ PostgreSQL connected successfully');
    console.log(`   Database time: ${result.rows[0].current_time}`);
    
    // Check PostGIS
    const postgisCheck = await pool.query(
      "SELECT * FROM pg_extension WHERE extname = 'postgis'"
    );
    if (postgisCheck.rows.length === 0) {
      console.warn('⚠️  PostGIS extension not found. Some features may not work.');
      console.warn('   Run: CREATE EXTENSION IF NOT EXISTS postgis;');
    } else {
      console.log('✅ PostGIS extension enabled');
    }
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check if PostgreSQL is running');
    console.error('   2. Verify DATABASE_URL in .env file');
    console.error('   3. Test connection: node test-db-connection.js');
    throw error;
  }
};

const query = (text, params) => pool.query(text, params);

const getClient = () => pool.connect();

module.exports = {
  query,
  getClient,
  pool,
  testConnection,
};
