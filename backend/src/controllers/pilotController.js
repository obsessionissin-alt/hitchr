const pool = require('../config/database');
const { client: redis } = require('../config/redis');

exports.updateLocation = async (req, res) => {
  try {
    const pilotId = req.user.id || req.user.userId; // Handle both formats
    const { latitude, longitude, heading, speed } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude required',
      });
    }

    // Update PostgreSQL (PostGIS)
    await pool.query(
      `INSERT INTO pilot_locations (pilot_id, location, latitude, longitude, heading, speed, is_available, updated_at)
       VALUES ($1, ST_SetSRID(ST_MakePoint($3, $2), 4326), $2, $3, $4, $5, true, NOW())
       ON CONFLICT (pilot_id) 
       DO UPDATE SET 
         location = ST_SetSRID(ST_MakePoint($3, $2), 4326),
         latitude = $2,
         longitude = $3,
         heading = $4,
         speed = $5,
         is_available = true,
         updated_at = NOW()`,
      [pilotId, parseFloat(latitude), parseFloat(longitude), heading || null, speed || null]
    );

    // Store in Redis for fast proximity checks
    const locationData = {
      lat: parseFloat(latitude),
      lng: parseFloat(longitude),
      heading: heading || null,
      speed: speed || null,
      timestamp: Date.now()
    };
    
    await redis.setEx(
      `pilot_location:${pilotId}`,
      600, // 10 minutes TTL
      JSON.stringify(locationData)
    );

    res.json({ success: true, message: 'Location updated' });
  } catch (error) {
    console.error('❌ Update location error:', error);
    res.status(500).json({ success: false, message: 'Error updating location', error: error.message });
  }
};

exports.getNearbyPilots = async (req, res) => {
  try {
    const { lat, lng, radius = 2000 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Lat/lng required',
      });
    }

    console.log(`🔍 Finding pilots near ${lat}, ${lng}`);

    // Include both 'pilot' and 'both' roles
    const query = `
      SELECT 
        u.id,
        u.name,
        u.avatar_url as avatar,
        u.rating,
        u.total_rides,
        ST_Y(pl.location::geometry) as latitude,
        ST_X(pl.location::geometry) as longitude,
        ST_Distance(
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
          pl.location::geography
        ) as distance
      FROM users u
      INNER JOIN pilot_locations pl ON u.id = pl.pilot_id
      WHERE (u.role = 'pilot' OR u.role = 'both')
        AND pl.is_available = true
        AND pl.updated_at > NOW() - INTERVAL '10 minutes'
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
          pl.location::geography,
          $3
        )
      ORDER BY distance ASC
      LIMIT 20
    `;

    const result = await pool.query(query, [parseFloat(lat), parseFloat(lng), parseFloat(radius)]);

    console.log(`✅ Found ${result.rows.length} pilots`);

    res.json({
      success: true,
      count: result.rows.length,
      pilots: result.rows.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        rating: parseFloat(p.rating) || 5.0,
        totalRides: parseInt(p.total_rides) || 0,
        latitude: parseFloat(p.latitude),
        longitude: parseFloat(p.longitude),
        distance: Math.round(parseFloat(p.distance)),
        vehicle: { type: 'Car', model: 'Sedan' },
      })),
    });
  } catch (error) {
    console.error('❌ Get nearby pilots error:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching nearby pilots',
      error: error.message 
    });
  }
};