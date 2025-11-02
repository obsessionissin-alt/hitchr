// backend/src/routes/pilots.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const pool = require('../config/database');

// All pilot routes require authentication
router.use(authMiddleware);

// Update pilot location
router.post('/location', async (req, res) => {
  try {
    const pilotId = req.user.id;
    const { latitude, longitude, heading, speed } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    // Check if pilot exists
    const userCheck = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [pilotId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userCheck.rows[0].role !== 'pilot') {
      return res.status(403).json({ error: 'Only pilots can update location' });
    }

    // Upsert pilot location using PostGIS
    const result = await pool.query(
      `INSERT INTO pilot_locations (pilot_id, location, heading, speed, is_available, updated_at)
       VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5, true, NOW())
       ON CONFLICT (pilot_id) 
       DO UPDATE SET 
         location = ST_SetSRID(ST_MakePoint($2, $3), 4326),
         heading = $4,
         speed = $5,
         is_available = true,
         updated_at = NOW()
       RETURNING pilot_id, ST_Y(location) as latitude, ST_X(location) as longitude`,
      [pilotId, longitude, latitude, heading || null, speed || null]
    );

    res.json({
      success: true,
      location: result.rows[0]
    });
  } catch (error) {
    console.error('Update pilot location error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// Get nearby pilots
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query; // radius in meters, default 5km

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    // Find pilots within radius using PostGIS
    const result = await pool.query(
      `SELECT 
         u.id,
         u.name,
         u.phone,
         u.rating,
         u.total_rides,
         u.token_balance,
         ST_Y(pl.location) as latitude,
         ST_X(pl.location) as longitude,
         ST_Distance(
           pl.location::geography,
           ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
         ) as distance
       FROM users u
       INNER JOIN pilot_locations pl ON u.id = pl.pilot_id
       WHERE u.role = 'pilot'
         AND pl.is_available = true
         AND ST_DWithin(
           pl.location::geography,
           ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
           $3
         )
       ORDER BY distance ASC
       LIMIT 20`,
      [parseFloat(lat), parseFloat(lng), parseFloat(radius)]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get nearby pilots error:', error);
    res.status(500).json({ error: 'Failed to get nearby pilots' });
  }
});

module.exports = router;