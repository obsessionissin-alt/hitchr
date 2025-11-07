// Run migration to add missing columns to active_notifications
// Run with: node run-migration.js

require('dotenv').config();
const { pool } = require('./database');

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running migration: Add rider_location and expires_at to active_notifications...\n');
    
    await client.query('BEGIN');

    // Add rider_location column
    await client.query(`
      ALTER TABLE active_notifications 
      ADD COLUMN IF NOT EXISTS rider_location GEOGRAPHY(POINT, 4326);
    `);
    console.log('✅ Added rider_location column');

    // Add expires_at column
    await client.query(`
      ALTER TABLE active_notifications 
      ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
    `);
    console.log('✅ Added expires_at column');

    // Create spatial index for rider_location
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_rider_location 
      ON active_notifications USING GIST(rider_location);
    `);
    console.log('✅ Created spatial index for rider_location');

    // Create index for expires_at
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_expires_at 
      ON active_notifications(expires_at);
    `);
    console.log('✅ Created index for expires_at');

    await client.query('COMMIT');
    console.log('\n✅ Migration completed successfully!\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
