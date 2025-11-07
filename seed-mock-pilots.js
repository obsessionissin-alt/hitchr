// Seed script to create mock pilots for testing
// Run with: node seed-mock-pilots.js

require('dotenv').config();
const { pool } = require('./database');

const MOCK_PILOTS = [
  {
    name: 'Rohit Kumar',
    phone: '+919876543210',
    role: 'pilot',
    rating: 4.8,
    total_rides: 127,
    token_balance: 450,
    latitude: 28.6139, // Delhi
    longitude: 77.2090,
    vehicle: { type: 'Car', model: 'Sedan' }
  },
  {
    name: 'Priya Sharma',
    phone: '+919876543211',
    role: 'pilot',
    rating: 4.9,
    total_rides: 89,
    token_balance: 320,
    latitude: 28.6140,
    longitude: 77.2095,
    vehicle: { type: 'SUV', model: 'Creta' }
  },
  {
    name: 'Amit Singh',
    phone: '+919876543212',
    role: 'pilot',
    rating: 4.7,
    total_rides: 203,
    token_balance: 680,
    latitude: 28.6145,
    longitude: 77.2100,
    vehicle: { type: 'Car', model: 'Swift' }
  },
  {
    name: 'Sneha Patel',
    phone: '+919876543213',
    role: 'pilot',
    rating: 5.0,
    total_rides: 156,
    token_balance: 520,
    latitude: 28.6150,
    longitude: 77.2105,
    vehicle: { type: 'Car', model: 'i20' }
  },
  {
    name: 'Vikram Mehta',
    phone: '+919876543214',
    role: 'pilot',
    rating: 4.6,
    total_rides: 94,
    token_balance: 290,
    latitude: 28.6155,
    longitude: 77.2110,
    vehicle: { type: 'Bike', model: 'Pulsar' }
  },
];

async function seedMockPilots() {
  try {
    console.log('🌱 Starting to seed mock pilots...\n');

    for (const pilot of MOCK_PILOTS) {
      // Check if user already exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE phone = $1',
        [pilot.phone]
      );

      let userId;
      
      if (existingUser.rows.length > 0) {
        userId = existingUser.rows[0].id;
        console.log(`✅ User ${pilot.name} already exists, updating...`);
        
        // Update user
        await pool.query(
          `UPDATE users 
           SET name = $1, role = $2, rating = $3, total_rides = $4, token_balance = $5, is_available = true
           WHERE id = $6`,
          [pilot.name, pilot.role, pilot.rating, pilot.total_rides, pilot.token_balance, userId]
        );
      } else {
        // Create new user
        const userResult = await pool.query(
          `INSERT INTO users (
            phone, name, role, rating, total_rides, token_balance, 
            is_available, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
          RETURNING id`,
          [
            pilot.phone,
            pilot.name,
            pilot.role,
            pilot.rating,
            pilot.total_rides,
            pilot.token_balance
          ]
        );
        userId = userResult.rows[0].id;
        console.log(`✅ Created new pilot: ${pilot.name}`);
      }

      // Upsert pilot location
      await pool.query(
        `INSERT INTO pilot_locations (pilot_id, location, latitude, longitude, is_available, updated_at)
         VALUES ($1, ST_SetSRID(ST_MakePoint($3, $2), 4326), $2, $3, true, NOW())
         ON CONFLICT (pilot_id) 
         DO UPDATE SET 
           location = ST_SetSRID(ST_MakePoint($3, $2), 4326),
           latitude = $2,
           longitude = $3,
           is_available = true,
           updated_at = NOW()`,
        [userId, pilot.latitude, pilot.longitude]
      );

      console.log(`   📍 Location set: ${pilot.latitude}, ${pilot.longitude}`);
    }

    console.log('\n✅ Successfully seeded mock pilots!');
    console.log(`\n📊 Summary:`);
    console.log(`   - ${MOCK_PILOTS.length} pilots created/updated`);
    console.log(`   - All pilots are marked as available`);
    console.log(`   - Locations set around Delhi area\n`);

  } catch (error) {
    console.error('❌ Error seeding mock pilots:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  seedMockPilots();
}

module.exports = { seedMockPilots };
