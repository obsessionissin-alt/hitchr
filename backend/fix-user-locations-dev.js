// Fix user_locations table to work with dev tokens
require('dotenv').config();
const { pool } = require('./src/config/database');

async function fixUserLocations() {
  try {
    console.log('Fixing user_locations table for dev mode...');
    
    // Check current column type
    const typeCheck = await pool.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_locations' AND column_name = 'user_id';
    `);
    console.log('Current user_id type:', typeCheck.rows[0]?.data_type);
    
    if (typeCheck.rows[0]?.data_type === 'uuid') {
      console.log('Converting user_id from UUID to TEXT...');
      
      // Remove all constraints first
      await pool.query(`
        ALTER TABLE user_locations 
        DROP CONSTRAINT IF EXISTS user_locations_user_id_fkey CASCADE;
      `);
      
      // Drop and recreate the table for simplicity
      await pool.query(`DROP TABLE IF EXISTS user_locations CASCADE;`);
      console.log('✅ Dropped old table');
      
      // Create new table with TEXT user_id
      await pool.query(`
        CREATE TABLE user_locations (
          user_id TEXT PRIMARY KEY,
          location GEOGRAPHY(POINT, 4326) NOT NULL,
          latitude DECIMAL(10, 8) NOT NULL,
          longitude DECIMAL(11, 8) NOT NULL,
          heading DECIMAL(5, 2),
          speed DECIMAL(5, 2),
          is_pilot_available BOOLEAN DEFAULT false,
          is_rider_available BOOLEAN DEFAULT false,
          last_updated TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('✅ Created new table with TEXT user_id');
      
      // Create spatial index
      await pool.query(`
        CREATE INDEX idx_user_locations_geo 
        ON user_locations USING GIST(location);
      `);
      
      // Create availability index
      await pool.query(`
        CREATE INDEX idx_user_locations_availability 
        ON user_locations(is_pilot_available, is_rider_available, last_updated);
      `);
      console.log('✅ Created indexes');
    } else {
      console.log('user_id is already TEXT type');
    }
    
    console.log('✅ user_locations table is now compatible with dev tokens!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

fixUserLocations();
