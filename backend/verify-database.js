const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function verifyDatabase() {
  console.log('🔍 Verifying Hitchr Database Schema...\n');

  try {
    const usersTable = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    if (usersTable.rows.length === 0) {
      console.log('❌ Users table does not exist!');
      console.log('Run: npm run migrate:up\n');
      process.exit(1);
    }

    console.log('✅ Users table exists');
    console.log('\nColumns found:');
    usersTable.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });

    const hasFirebaseUid = usersTable.rows.some(
      col => col.column_name === 'firebase_uid'
    );

    console.log('\n🔑 Firebase UID column:', hasFirebaseUid ? '✅ EXISTS' : '❌ MISSING');

    if (!hasFirebaseUid) {
      console.log('\n⚠️  WARNING: firebase_uid column is missing!');
      console.log('\nYou need to add this column for Firebase authentication.');
      console.log('Run this command to add it:\n');
      console.log('psql $DATABASE_URL -c "ALTER TABLE users ADD COLUMN firebase_uid VARCHAR(128) UNIQUE;"');
      console.log('psql $DATABASE_URL -c "CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);"');
      console.log('\nOr use the migration script below.\n');
    }

    const tables = ['pilot_locations', 'rides', 'tokens', 'telemetry', 'active_notifications'];
    
    console.log('\n📊 Checking other tables:');
    for (const table of tables) {
      const result = await pool.query(`
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_name = $1
      `, [table]);
      
      const exists = result.rows[0].count > 0;
      console.log(`  ${exists ? '✅' : '❌'} ${table}`);
    }

    const postgisCheck = await pool.query(`
      SELECT * FROM pg_extension WHERE extname = 'postgis';
    `);

    console.log('\n🗺️  PostGIS extension:', postgisCheck.rows.length > 0 ? '✅ ENABLED' : '❌ DISABLED');

    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`\n👥 Total users: ${userCount.rows[0].count}`);

    console.log('\n✅ Database verification complete!\n');

  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifyDatabase();
