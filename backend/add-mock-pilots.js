require('dotenv').config();
const { Pool } = require('pg');
const redis = require('redis');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

async function addMockPilots() {
  try {
    console.log('🎬 Adding mock pilots with locations...\n');

    // Connect to Redis
    await redisClient.connect();
    console.log('✅ Connected to Redis\n');

    // Mock pilots - you can adjust these coordinates to your location
    // Default: Near Aligarh (27.8974, 78.0880) - adjust as needed
    const baseLat = 27.8974;
    const baseLng = 78.0880;

    const pilots = [
      {
        name: 'Rajesh Kumar',
        phone: '+919876543210',
        lat: baseLat + 0.002,
        lng: baseLng + 0.002,
        rating: 4.8,
        totalRides: 127,
        vehicle: { type: 'Car', model: 'Maruti Swift', plate: 'UP-14-AB-1234' },
      },
      {
        name: 'Priya Sharma',
        phone: '+919876543211',
        lat: baseLat - 0.001,
        lng: baseLng + 0.003,
        rating: 4.9,
        totalRides: 89,
        vehicle: { type: 'Car', model: 'Honda City', plate: 'UP-14-CD-5678' },
      },
      {
        name: 'Amit Singh',
        phone: '+919876543212',
        lat: baseLat + 0.003,
        lng: baseLng - 0.001,
        rating: 4.7,
        totalRides: 203,
        vehicle: { type: 'Bike', model: 'Royal Enfield', plate: 'UP-14-EF-9012' },
      },
      {
        name: 'Sneha Patel',
        phone: '+919876543213',
        lat: baseLat - 0.002,
        lng: baseLng - 0.002,
        rating: 5.0,
        totalRides: 156,
        vehicle: { type: 'Car', model: 'Hyundai i20', plate: 'UP-14-GH-3456' },
      },
      {
        name: 'Vikram Mehta',
        phone: '+919876543214',
        lat: baseLat + 0.001,
        lng: baseLng + 0.001,
        rating: 4.6,
        totalRides: 94,
        vehicle: { type: 'Car', model: 'Tata Nexon', plate: 'UP-14-IJ-7890' },
      },
    ];

    for (const pilot of pilots) {
      // Create or update pilot user
      const userResult = await pool.query(
        `INSERT INTO users (
          firebase_uid, phone, name, role, 
          rating, total_rides, completed_rides, token_balance,
          created_at, updated_at
        )
         VALUES ($1, $2, $3, 'pilot', $4, $5, $5, 100, NOW(), NOW())
         ON CONFLICT (phone) 
         DO UPDATE SET 
           name = $3, 
           role = 'pilot',
           rating = $4,
           total_rides = $5,
           completed_rides = $5,
           updated_at = NOW()
         RETURNING id`,
        [
          `demo_${pilot.phone.replace(/[^0-9]/g, '')}`,
          pilot.phone,
          pilot.name,
          pilot.rating,
          pilot.totalRides,
        ]
      );

      const pilotId = userResult.rows[0].id;

      // Add location to PostgreSQL (PostGIS)
      await pool.query(
        `INSERT INTO pilot_locations (
          pilot_id, location, latitude, longitude, 
          is_available, updated_at
        )
         VALUES ($1, ST_SetSRID(ST_MakePoint($3, $2), 4326), $2, $3, true, NOW())
         ON CONFLICT (pilot_id) 
         DO UPDATE SET 
           location = ST_SetSRID(ST_MakePoint($3, $2), 4326),
           latitude = $2,
           longitude = $3,
           is_available = true,
           updated_at = NOW()`,
        [pilotId, pilot.lat, pilot.lng]
      );

      // Store location in Redis for proximity service
      const locationData = {
        lat: pilot.lat,
        lng: pilot.lng,
        heading: null,
        speed: null,
        timestamp: Date.now(),
      };

      await redisClient.setEx(
        `pilot_location:${pilotId}`,
        600, // 10 minutes TTL
        JSON.stringify(locationData)
      );

      console.log(`✅ Added pilot: ${pilot.name}`);
      console.log(`   Location: (${pilot.lat.toFixed(6)}, ${pilot.lng.toFixed(6)})`);
      console.log(`   Vehicle: ${pilot.vehicle.type} - ${pilot.vehicle.model} (${pilot.vehicle.plate})`);
      console.log(`   Rating: ${pilot.rating} ⭐ | Rides: ${pilot.totalRides}\n`);
    }

    console.log('🎉 Mock pilots added successfully!');
    console.log('\n💡 To add pilots at YOUR location, modify baseLat and baseLng in this script.');
    console.log('💡 Or use: node add-pilots-at-my-location.js\n');

    await redisClient.quit();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    if (redisClient.isOpen) await redisClient.quit();
    await pool.end();
    process.exit(1);
  }
}

addMockPilots();

