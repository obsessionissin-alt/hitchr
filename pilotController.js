const pool = require('../config/database');
const redis = require('../config/redis');

exports.updateLocation = async (req, res) => {
  try {
    const pilotId = req.user.userId;
    const { latitude, longitude, heading, speed } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude required',
      });
    }

    await pool.query(
      `INSERT INTO pilot_locations (pilot_id, location, heading, speed, is_available, updated_at)
       VALUES ($1, ST_SetSRID(ST_MakePoint($3, $2), 4326), $4, $5, true, NOW())
       ON CONFLICT (pilot_id) 
       DO UPDATE SET 
         location = ST_SetSRID(ST_MakePoint($3, $2), 4326),
         heading = $4,
         speed = $5,
         is_available = true,
         updated_at = NOW()`,
      [pilotId, latitude, longitude, heading || null, speed || null]
    );

    res.json({ success: true, message: 'Location updated' });
  } catch (error) {
    console.error('❌ Update location error:', error);
    res.status(500).json({ success: false, message: 'Error' });
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

    // FIXED: Only look for role = 'pilot' (not 'both')
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
      WHERE u.role = 'pilot'
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
    res.status(500).json({ success: false, message: 'Error' });
  }
};