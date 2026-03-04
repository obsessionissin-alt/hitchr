// Quick script to create user_locations table if it doesn't exist
require('dotenv').config();
const { pool } = require('./src/config/database');

async function createUserLocationsTable() {
  try {
    console.log('Checking if user_locations table exists...');
    
    // Check if pilot_locations exists (old table name)
    const checkOld = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'pilot_locations'
      );
    `);
    
    if (checkOld.rows[0].exists) {
      console.log('Found pilot_locations table, renaming to user_locations...');
      await pool.query(`ALTER TABLE pilot_locations RENAME TO user_locations;`);
      await pool.query(`ALTER TABLE user_locations RENAME COLUMN pilot_id TO user_id;`);
      await pool.query(`
        ALTER TABLE user_locations 
        ADD COLUMN IF NOT EXISTS is_pilot_available BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS is_rider_available BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT NOW();
      `);
      console.log('✅ Renamed pilot_locations to user_locations');
    }
    
    // Check if user_locations exists
    const check = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_locations'
      );
    `);
    
    if (!check.rows[0].exists) {
      console.log('Creating user_locations table...');
      
      // Enable PostGIS if not already enabled
      await pool.query('CREATE EXTENSION IF NOT EXISTS postgis;');
      
      await pool.query(`
        CREATE TABLE user_locations (
          user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
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
      
      console.log('✅ Created user_locations table');
    } else {
      console.log('✅ user_locations table already exists');
      
      // Ensure all columns exist
      const columns = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'user_locations';
      `);
      
      const columnNames = columns.rows.map(r => r.column_name);
      
      if (!columnNames.includes('is_pilot_available')) {
        await pool.query(`ALTER TABLE user_locations ADD COLUMN is_pilot_available BOOLEAN DEFAULT false;`);
        console.log('✅ Added is_pilot_available column');
      }
      
      if (!columnNames.includes('is_rider_available')) {
        await pool.query(`ALTER TABLE user_locations ADD COLUMN is_rider_available BOOLEAN DEFAULT false;`);
        console.log('✅ Added is_rider_available column');
      }
      
      if (!columnNames.includes('last_updated')) {
        await pool.query(`ALTER TABLE user_locations ADD COLUMN last_updated TIMESTAMP DEFAULT NOW();`);
        console.log('✅ Added last_updated column');
      }
    }
    
    console.log('✅ Database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createUserLocationsTable();

















