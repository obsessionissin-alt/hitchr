require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addDemoPilots() {
  try {
    console.log('🎬 Adding demo pilots for presentation...\n');

    // Demo pilots near Aligarh (27.8974, 78.0880)
    const pilots = [
      { name: 'Rajesh Kumar', phone: '+919876543210', lat: 27.8990, lng: 78.0900 },
      { name: 'Priya Sharma', phone: '+919876543211', lat: 27.8985, lng: 78.0870 },
      { name: 'Amit Singh', phone: '+919876543212', lat: 27.8960, lng: 78.0910 },
    ];

    for (const pilot of pilots) {
      // Create pilot user
      const userResult = await pool.query(
        `INSERT INTO users (firebase_uid, phone, name, role, rating, total_rides, token_balance, created_at, updated_at)
         VALUES ($1, $2, $3, 'pilot', 4.8, 50, 100, NOW(), NOW())
         ON CONFLICT (phone) DO UPDATE SET name = $3, role = 'pilot'
         RETURNING id`,
        [`demo_${pilot.phone}`, pilot.phone, pilot.name]
      );

      const pilotId = userResult.rows[0].id;

      // Add location using PostGIS
      await pool.query(
        `INSERT INTO pilot_locations (pilot_id, location, is_available, updated_at)
         VALUES ($1, ST_SetSRID(ST_MakePoint($3, $2), 4326), true, NOW())
         ON CONFLICT (pilot_id) 
         DO UPDATE SET 
           location = ST_SetSRID(ST_MakePoint($3, $2), 4326),
           is_available = true,
           updated_at = NOW()`,
        [pilotId, pilot.lat, pilot.lng]
      );

      console.log(`✅ Added pilot: ${pilot.name} at (${pilot.lat}, ${pilot.lng})`);
    }

    // Give demo user tokens (without completed_rides column)
    await pool.query(
      `UPDATE users 
       SET token_balance = 50, total_rides = 5, rating = 4.5
       WHERE phone = '+918076225495'`
    );

    console.log('✅ Demo user updated with 50 tokens');
    console.log('\n🎉 Demo data ready for presentation!');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

addDemoPilots();
