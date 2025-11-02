const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addFirebaseColumn() {
  console.log('🔧 Adding firebase_uid column...\n');

  try {
    // Add column
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(128) UNIQUE;
    `);
    console.log('✅ Column added');

    // Add index
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_firebase_uid 
      ON users(firebase_uid);
    `);
    console.log('✅ Index created');

    // Verify
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'firebase_uid';
    `);

    if (result.rows.length > 0) {
      console.log('\n✅ SUCCESS! firebase_uid column is ready\n');
      console.log('Column details:', result.rows[0]);
    } else {
      console.log('\n❌ Column was not added');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

addFirebaseColumn();
