require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addPilots() {
  try {
    // YOUR ACTUAL LOCATION from the error log
    const myLat = 30.395359;
    const myLng = 77.966561;

    const pilots = [
      { name: 'Rajesh Kumar', phone: '+919876543210', latOffset: 0.002, lngOffset: 0.002 },
      { name: 'Priya Sharma', phone: '+919876543211', latOffset: -0.001, lngOffset: 0.003 },
      { name: 'Amit Singh', phone: '+919876543212', latOffset: 0.003, lngOffset: -0.001 },
    ];

    for (const pilot of pilots) {
      const lat = myLat + pilot.latOffset;
      const lng = myLng + pilot.lngOffset;

      const userResult = await pool.query(
        `INSERT INTO users (firebase_uid, phone, name, role, rating, total_rides, token_balance, created_at, updated_at)
         VALUES ($1, $2, $3, 'pilot', 4.8, 50, 100, NOW(), NOW())
         ON CONFLICT (phone) DO UPDATE SET role = 'pilot'
         RETURNING id`,
        [`demo_${pilot.phone}`, pilot.phone, pilot.name]
      );

      const pilotId = userResult.rows[0].id;

      await pool.query(
        `INSERT INTO pilot_locations (pilot_id, location, is_available, updated_at)
         VALUES ($1, ST_SetSRID(ST_MakePoint($3, $2), 4326), true, NOW())
         ON CONFLICT (pilot_id) 
         DO UPDATE SET location = ST_SetSRID(ST_MakePoint($3, $2), 4326), is_available = true, updated_at = NOW()`,
        [pilotId, lat, lng]
      );

      console.log(`✅ ${pilot.name} at (${lat}, ${lng})`);
    }

    console.log('\n🎉 Pilots added at YOUR location!');
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
  }
}

addPilots();
