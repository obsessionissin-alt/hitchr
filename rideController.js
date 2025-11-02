// backend/src/controllers/rideController.js
const pool = require('../config/database');

// Create a ride request (SIMPLIFIED FOR DEMO)
exports.createRide = async (req, res) => {
  try {
    const { pilotId } = req.body;
    const riderId = req.user.id;

    // Validate inputs
    if (!pilotId) {
      return res.status(400).json({ error: 'Pilot ID is required' });
    }

    // Check if pilot exists and is available
    const pilotCheck = await pool.query(
      'SELECT id, is_available, role FROM users WHERE id = $1',
      [pilotId]
    );

    if (pilotCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Pilot not found' });
    }

    if (pilotCheck.rows[0].role !== 'pilot') {
      return res.status(400).json({ error: 'User is not a pilot' });
    }

    // Create ride with minimal columns (no origin_lat/lng)
    const result = await pool.query(
      `INSERT INTO rides (rider_id, pilot_id, status, created_at, updated_at) 
       VALUES ($1, $2, $3, NOW(), NOW()) 
       RETURNING *`,
      [riderId, pilotId, 'pending']
    );

    res.status(201).json({
      success: true,
      ride: result.rows[0]
    });

  } catch (error) {
    console.error('Create ride error:', error);
    res.status(500).json({ error: 'Failed to create ride' });
  }
};

// Get ride by ID
exports.getRideById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT r.*, 
              ru.name as rider_name, ru.phone as rider_phone,
              pu.name as pilot_name, pu.phone as pilot_phone
       FROM rides r
       LEFT JOIN users ru ON r.rider_id = ru.id
       LEFT JOIN users pu ON r.pilot_id = pu.id
       WHERE r.id = $1 AND (r.rider_id = $2 OR r.pilot_id = $2)`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get ride error:', error);
    res.status(500).json({ error: 'Failed to get ride' });
  }
};

// Accept ride (pilot only)
exports.acceptRide = async (req, res) => {
  try {
    const { id } = req.params;
    const pilotId = req.user.id;

    // Verify pilot owns this ride
    const rideCheck = await pool.query(
      'SELECT * FROM rides WHERE id = $1 AND pilot_id = $2 AND status = $3',
      [id, pilotId, 'pending']
    );

    if (rideCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Ride not found or already accepted' });
    }

    // Update ride status
    const result = await pool.query(
      `UPDATE rides SET status = $1, updated_at = NOW() 
       WHERE id = $2 RETURNING *`,
      ['accepted', id]
    );

    res.json({
      success: true,
      ride: result.rows[0]
    });

  } catch (error) {
    console.error('Accept ride error:', error);
    res.status(500).json({ error: 'Failed to accept ride' });
  }
};

// Start ride
exports.startRide = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify user is part of this ride
    const rideCheck = await pool.query(
      'SELECT * FROM rides WHERE id = $1 AND (rider_id = $2 OR pilot_id = $2) AND status = $3',
      [id, userId, 'accepted']
    );

    if (rideCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Ride not found or not ready to start' });
    }

    const result = await pool.query(
      `UPDATE rides SET status = $1, updated_at = NOW() 
       WHERE id = $2 RETURNING *`,
      ['active', id]
    );

    res.json({
      success: true,
      ride: result.rows[0]
    });

  } catch (error) {
    console.error('Start ride error:', error);
    res.status(500).json({ error: 'Failed to start ride' });
  }
};

// End ride
exports.endRide = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { rating, tokens_earned = 10 } = req.body;

    // Verify user is part of this ride
    const rideCheck = await pool.query(
      'SELECT * FROM rides WHERE id = $1 AND (rider_id = $2 OR pilot_id = $2) AND status = $3',
      [id, userId, 'active']
    );

    if (rideCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Ride not found or not active' });
    }

    const ride = rideCheck.rows[0];

    // Update ride status
    await pool.query(
      `UPDATE rides SET status = $1, updated_at = NOW() 
       WHERE id = $2`,
      ['completed', id]
    );

    // Award tokens to both rider and pilot (simplified)
    await pool.query(
      'UPDATE users SET token_balance = token_balance + $1, total_rides = total_rides + 1 WHERE id = $2 OR id = $3',
      [tokens_earned, ride.rider_id, ride.pilot_id]
    );

    // Insert token transactions
    await pool.query(
      `INSERT INTO token_transactions (user_id, amount, type, category, source, created_at)
       VALUES ($1, $2, 'earn', 'ride', 'ride_completion', NOW()),
              ($3, $4, 'earn', 'ride', 'ride_completion', NOW())`,
      [ride.rider_id, tokens_earned, ride.pilot_id, tokens_earned]
    );

    res.json({
      success: true,
      tokens_earned,
      message: 'Ride completed successfully'
    });

  } catch (error) {
    console.error('End ride error:', error);
    res.status(500).json({ error: 'Failed to end ride' });
  }
};

// Get user's rides
exports.getUserRides = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT r.*, 
              ru.name as rider_name,
              pu.name as pilot_name
       FROM rides r
       LEFT JOIN users ru ON r.rider_id = ru.id
       LEFT JOIN users pu ON r.pilot_id = pu.id
       WHERE r.rider_id = $1 OR r.pilot_id = $1
       ORDER BY r.created_at DESC
       LIMIT 20`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get user rides error:', error);
    res.status(500).json({ error: 'Failed to get rides' });
  }
};

// Log all exported functions for debugging
console.log('✅ RideController exports:', Object.keys(exports));