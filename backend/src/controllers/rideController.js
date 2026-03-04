// backend/src/controllers/rideController.js
const pool = require('../config/database');
const { calculateDistance } = require('../utils/haversine');
const socketService = require('../services/socketService');

// Create notification (Rider → Pilot flow)
exports.createNotification = async (req, res) => {
  try {
    const { pilotId, origin, destination } = req.body;
    const riderId = req.user.userId;

    // Validate inputs
    if (!pilotId || !origin || !destination) {
      return res.status(400).json({ error: 'pilotId, origin, and destination are required' });
    }

    // Check if pilot is available
    const pilotCheck = await pool.query(
      'SELECT id, is_pilot_available, kyc_status FROM users WHERE id = $1',
      [pilotId]
    );

    if (pilotCheck.rows.length === 0 || !pilotCheck.rows[0].is_pilot_available) {
      return res.status(400).json({ error: 'Pilot not available' });
    }

    // Calculate distance
    const distanceMeters = calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);

    // Create ride
    const rideResult = await pool.query(
      `INSERT INTO rides (
        rider_id, pilot_id, 
        origin, origin_lat, origin_lng,
        destination, destination_lat, destination_lng,
        distance_meters, status, initiated_by,
        created_at, updated_at
      ) 
      VALUES ($1, $2, 
        ST_SetSRID(ST_MakePoint($4, $3), 4326)::geography, $3, $4,
        ST_SetSRID(ST_MakePoint($6, $5), 4326)::geography, $5, $6,
        $7, 'notified', 'rider', NOW(), NOW()
      ) 
      RETURNING *`,
      [riderId, pilotId, origin.lat, origin.lng, destination.lat, destination.lng, Math.round(distanceMeters)]
    );

    const ride = rideResult.rows[0];

    // Create active notification
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await pool.query(
      `INSERT INTO active_notifications (
        ride_id, initiator_id, recipient_id,
        initiator_location, notification_type, status, expires_at
      )
      VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($5, $4), 4326)::geography, 'notify_pilot', 'pending', $6)`,
      [ride.id, riderId, pilotId, origin.lat, origin.lng, expiresAt]
    );

    // Emit socket event to pilot
    const riderData = await pool.query('SELECT name, avatar_url, rating FROM users WHERE id = $1', [riderId]);
    socketService.emitToUser(pilotId, 'ride:notification', {
      rideId: ride.id,
      rider: riderData.rows[0],
      origin,
      destination,
      distance: distanceMeters,
    });

    res.status(201).json(ride);
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: 'Failed to create notification', details: error.message });
  }
};

// Create offer (Pilot → Rider flow)
exports.createOffer = async (req, res) => {
  try {
    const { riderId, origin, destination } = req.body;
    const pilotId = req.user.userId;

    // Validate inputs
    if (!riderId || !origin || !destination) {
      return res.status(400).json({ error: 'riderId, origin, and destination are required' });
    }

    // Check if rider is available
    const riderCheck = await pool.query(
      'SELECT id, is_rider_available FROM users WHERE id = $1',
      [riderId]
    );

    if (riderCheck.rows.length === 0 || !riderCheck.rows[0].is_rider_available) {
      return res.status(400).json({ error: 'Rider not available' });
    }

    // Verify pilot is available and KYC verified
    const pilotCheck = await pool.query(
      'SELECT kyc_status, is_pilot_available FROM users WHERE id = $1',
      [pilotId]
    );

    if (!pilotCheck.rows[0].is_pilot_available || pilotCheck.rows[0].kyc_status !== 'verified') {
      return res.status(403).json({ error: 'Pilot must be available and KYC verified' });
    }

    // Calculate distance
    const distanceMeters = calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);

    // Create ride
    const rideResult = await pool.query(
      `INSERT INTO rides (
        rider_id, pilot_id, 
        origin, origin_lat, origin_lng,
        destination, destination_lat, destination_lng,
        distance_meters, status, initiated_by,
        created_at, updated_at
      ) 
      VALUES ($1, $2, 
        ST_SetSRID(ST_MakePoint($4, $3), 4326)::geography, $3, $4,
        ST_SetSRID(ST_MakePoint($6, $5), 4326)::geography, $5, $6,
        $7, 'offered', 'pilot', NOW(), NOW()
      ) 
      RETURNING *`,
      [riderId, pilotId, origin.lat, origin.lng, destination.lat, destination.lng, Math.round(distanceMeters)]
    );

    const ride = rideResult.rows[0];

    // Create active notification
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await pool.query(
      `INSERT INTO active_notifications (
        ride_id, initiator_id, recipient_id,
        initiator_location, notification_type, status, expires_at
      )
      VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($5, $4), 4326)::geography, 'offer_ride', 'pending', $6)`,
      [ride.id, pilotId, riderId, origin.lat, origin.lng, expiresAt]
    );

    // Emit socket event to rider
    const pilotData = await pool.query(
      'SELECT name, avatar_url, rating, pilot_vehicle_type, pilot_plate_number FROM users WHERE id = $1',
      [pilotId]
    );
    socketService.emitToUser(riderId, 'ride:offer-received', {
      rideId: ride.id,
      pilot: pilotData.rows[0],
      origin,
      destination,
      distance: distanceMeters,
    });

    res.status(201).json(ride);
  } catch (error) {
    console.error('Create offer error:', error);
    res.status(500).json({ error: 'Failed to create offer', details: error.message });
  }
};

// Confirm ride (both users must confirm)
exports.confirmRide = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Get ride details
    const rideCheck = await pool.query(
      'SELECT * FROM rides WHERE id = $1 AND (rider_id = $2 OR pilot_id = $2) AND status IN (\'pending_confirm\', \'notified\', \'offered\')',
      [id, userId]
    );

    if (rideCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Ride not found or cannot be confirmed' });
    }

    const ride = rideCheck.rows[0];
    const isRider = ride.rider_id === userId;
    const confirmField = isRider ? 'rider_confirmed_at' : 'pilot_confirmed_at';

    // Update confirmation timestamp
    await pool.query(
      `UPDATE rides SET ${confirmField} = NOW(), updated_at = NOW() WHERE id = $1`,
      [id]
    );

    // Check if both confirmed
    const updatedRide = await pool.query(
      'SELECT * FROM rides WHERE id = $1',
      [id]
    );

    const rideData = updatedRide.rows[0];
    const bothConfirmed = rideData.rider_confirmed_at && rideData.pilot_confirmed_at;

    if (bothConfirmed) {
      // Update status to confirmed
      await pool.query(
        `UPDATE rides SET status = 'confirmed', updated_at = NOW() WHERE id = $1`,
        [id]
      );

      // Update active_notifications
      await pool.query(
        `UPDATE active_notifications SET status = 'proximity_detected' WHERE ride_id = $1`,
        [id]
      );

      // Emit to both users
      socketService.emitToUsers([ride.rider_id, ride.pilot_id], 'ride:both-confirmed', {
        rideId: id,
        status: 'confirmed',
      });

      res.json({ confirmed: true, waitingForOther: false, status: 'confirmed' });
    } else {
      res.json({ confirmed: true, waitingForOther: true, status: 'pending_confirm' });
    }
  } catch (error) {
    console.error('Confirm ride error:', error);
    res.status(500).json({ error: 'Failed to confirm ride' });
  }
};

// Start ride (pilot only)
exports.startRide = async (req, res) => {
  try {
    const { id } = req.params;
    const pilotId = req.user.userId;

    const result = await pool.query(
      `UPDATE rides 
       SET status = 'active', started_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND pilot_id = $2 AND status = 'confirmed'
       RETURNING *`,
      [id, pilotId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ride not found or cannot be started' });
    }

    const ride = result.rows[0];

    // Emit to both users
    socketService.emitToUsers([ride.rider_id, ride.pilot_id], 'ride:started', {
      rideId: id,
      startedAt: ride.started_at,
    });

    res.json(ride);
  } catch (error) {
    console.error('Start ride error:', error);
    res.status(500).json({ error: 'Failed to start ride' });
  }
};

// End ride
exports.endRide = async (req, res) => {
  try {
    const { id } = req.params;
    const { endLocation } = req.body;
    const userId = req.user.userId;

    // Get ride details
    const rideCheck = await pool.query(
      'SELECT * FROM rides WHERE id = $1 AND (rider_id = $2 OR pilot_id = $2) AND status = \'active\'',
      [id, userId]
    );

    if (rideCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Ride not found or not active' });
    }

    const ride = rideCheck.rows[0];

    // Calculate final distance
    const finalDistance = calculateDistance(
      ride.origin_lat,
      ride.origin_lng,
      endLocation.lat,
      endLocation.lng
    );

    // Calculate tokens
    const { calculateRideTokens } = require('../services/tokenService');
    const { riderTokens, pilotTokens, bonuses } = await calculateRideTokens(
      ride.rider_id,
      ride.pilot_id,
      Math.round(finalDistance)
    );

    // Update ride
    await pool.query(
      `UPDATE rides 
       SET status = 'completed', ended_at = NOW(), distance_meters = $1,
           tokens_awarded_to_rider = $2, tokens_awarded_to_pilot = $3, updated_at = NOW()
       WHERE id = $4`,
      [Math.round(finalDistance), riderTokens, pilotTokens, id]
    );

    // Award tokens
    await pool.query(
      `INSERT INTO tokens (user_id, amount, type, category, source, ride_id, created_at)
       VALUES 
         ($1, $2, 'earn', 'ride', 'Ride completed', $3, NOW()),
         ($4, $5, 'earn', 'ride', 'Ride completed', $3, NOW())`,
      [ride.rider_id, riderTokens, id, ride.pilot_id, pilotTokens]
    );

    // Update user balances and stats
    await pool.query(
      `UPDATE users 
       SET token_balance = token_balance + $1,
           total_rides_as_rider = total_rides_as_rider + 1,
           total_km = total_km + $2,
           last_ride_date = CURRENT_DATE
       WHERE id = $3`,
      [riderTokens, finalDistance / 1000, ride.rider_id]
    );

    await pool.query(
      `UPDATE users 
       SET token_balance = token_balance + $1,
           total_rides_as_pilot = total_rides_as_pilot + 1,
           total_km = total_km + $2,
           last_ride_date = CURRENT_DATE
       WHERE id = $3`,
      [pilotTokens, finalDistance / 1000, ride.pilot_id]
    );

    // Check for RTO plate collection (mock implementation)
    // In production, this would use actual RTO code detection

    // Emit completion event
    socketService.emitToUsers([ride.rider_id, ride.pilot_id], 'ride:completed', {
      rideId: id,
      distance: Math.round(finalDistance),
      tokensAwarded: {
        rider: riderTokens,
        pilot: pilotTokens,
      },
    });

    res.json({
      success: true,
      tokensAwarded: {
        rider: riderTokens,
        pilot: pilotTokens,
      },
      distance: Math.round(finalDistance),
      bonuses,
    });
  } catch (error) {
    console.error('End ride error:', error);
    res.status(500).json({ error: 'Failed to end ride', details: error.message });
  }
};

// Cancel ride
exports.cancelRide = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      `UPDATE rides 
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND (rider_id = $2 OR pilot_id = $2) AND status NOT IN ('completed', 'cancelled')
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ride not found or cannot be cancelled' });
    }

    const ride = result.rows[0];

    // Clean up active notifications
    await pool.query('DELETE FROM active_notifications WHERE ride_id = $1', [id]);

    // Emit cancellation to other user
    const otherUserId = ride.rider_id === userId ? ride.pilot_id : ride.rider_id;
    socketService.emitToUser(otherUserId, 'ride:cancelled', {
      rideId: id,
      cancelledBy: userId,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Cancel ride error:', error);
    res.status(500).json({ error: 'Failed to cancel ride' });
  }
};

// Get ride by ID
exports.getRideById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT r.*, 
              row_to_json(rider.*) as rider,
              row_to_json(pilot.*) as pilot
       FROM rides r
       LEFT JOIN users rider ON r.rider_id = rider.id
       LEFT JOIN users pilot ON r.pilot_id = pilot.id
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

// Get ride history
exports.getRideHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20, offset = 0, role } = req.query;

    let whereClause = '';
    if (role === 'rider') {
      whereClause = 'WHERE r.rider_id = $1';
    } else if (role === 'pilot') {
      whereClause = 'WHERE r.pilot_id = $1';
    } else {
      whereClause = 'WHERE (r.rider_id = $1 OR r.pilot_id = $1)';
    }

    const result = await pool.query(
      `SELECT r.*, 
              row_to_json(rider.*) as rider,
              row_to_json(pilot.*) as pilot
       FROM rides r
       LEFT JOIN users rider ON r.rider_id = rider.id
       LEFT JOIN users pilot ON r.pilot_id = pilot.id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get ride history error:', error);
    res.status(500).json({ error: 'Failed to get ride history' });
  }
};

// Send telemetry
exports.sendTelemetry = async (req, res) => {
  try {
    const { id } = req.params;
    const { points } = req.body;
    const userId = req.user.userId;

    if (!Array.isArray(points) || points.length === 0) {
      return res.status(400).json({ error: 'Points array is required' });
    }

    // Verify user is part of this ride
    const rideCheck = await pool.query(
      'SELECT * FROM rides WHERE id = $1 AND (rider_id = $2 OR pilot_id = $2) AND status = \'active\'',
      [id, userId]
    );

    if (rideCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Ride not found or not active' });
    }

    // Insert telemetry points
    const values = points
      .map((p, i) => `($1, $2, ${p.lat}, ${p.lng}, ${p.speed || 0}, ${p.heading || 0}, ${p.accuracy || 0}, '${p.timestamp}', NOW())`)
      .join(',');

    await pool.query(
      `INSERT INTO telemetry (ride_id, user_id, latitude, longitude, speed, heading, accuracy, recorded_at, received_at)
       VALUES ${values.replace(/\$1/g, `'${id}'`).replace(/\$2/g, `'${userId}'`)}`
    );

    res.json({ success: true, pointsReceived: points.length });
  } catch (error) {
    console.error('Send telemetry error:', error);
    res.status(500).json({ error: 'Failed to send telemetry' });
  }
};
