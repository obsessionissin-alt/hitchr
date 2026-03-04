const pool = require('../config/database');
const path = require('path');
const fs = require('fs');
const { matchPilots } = require('../services/directionalMatchingService');
const { projectPoint, calculateBearing } = require('../utils/haversine');

// Load mock users from JSON file
const mockUsersPath = path.join(__dirname, '../data/mockUsers.json');
let mockUsers = { pilots: [], riders: [] };
try {
  mockUsers = JSON.parse(fs.readFileSync(mockUsersPath, 'utf8'));
  console.log(`Loaded ${mockUsers.pilots.length} mock pilots and ${mockUsers.riders.length} mock riders`);
} catch (err) {
  console.warn('Could not load mock users:', err.message);
}

// Helper to calculate distance between two points (haversine)
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Helper function to format user response
const formatUserResponse = (user, includeSensitive = false) => {
  const response = {
    id: user.id,
    name: user.name,
    phone: includeSensitive ? user.phone : undefined,
    email: user.email,
    avatar_url: user.avatar_url,
    kyc_status: user.kyc_status,
    is_pilot_available: user.is_pilot_available || false,
    is_rider_available: user.is_rider_available || false,
    pilot_vehicle_type: user.pilot_vehicle_type,
    pilot_plate_number: user.pilot_plate_number,
    token_balance: parseInt(user.token_balance) || 0,
    total_rides_as_pilot: parseInt(user.total_rides_as_pilot) || 0,
    total_rides_as_rider: parseInt(user.total_rides_as_rider) || 0,
    total_km: parseFloat(user.total_km) || 0,
    rating: parseFloat(user.rating) || 0,
    rating_count: parseInt(user.rating_count) || 0,
    streak_days: parseInt(user.streak_days) || 0,
    last_ride_date: user.last_ride_date,
    created_at: user.created_at,
  };

  // Remove undefined values
  return Object.fromEntries(Object.entries(response).filter(([_, v]) => v !== undefined));
};

// Get current user (authenticated)
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT u.*,
        (SELECT COUNT(*) FROM rto_plates WHERE user_id = u.id) as collected_plates_count,
        (SELECT json_agg(json_build_object('badge_type', badge_type, 'earned_at', earned_at))
         FROM user_badges WHERE user_id = u.id) as badges
       FROM users u WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const user = result.rows[0];
    const formattedUser = formatUserResponse(user, true);
    formattedUser.badges = user.badges || [];
    formattedUser.collected_plates_count = parseInt(user.collected_plates_count) || 0;

    res.json(formattedUser);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get user by ID (public profile)
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT u.*,
        (SELECT COUNT(*) FROM rto_plates WHERE user_id = u.id) as collected_plates_count,
        (SELECT json_agg(json_build_object('badge_type', badge_type, 'earned_at', earned_at))
         FROM user_badges WHERE user_id = u.id) as badges
       FROM users u WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const user = result.rows[0];
    const formattedUser = formatUserResponse(user, false); // Don't include sensitive data
    formattedUser.badges = user.badges || [];
    formattedUser.collected_plates_count = parseInt(user.collected_plates_count) || 0;

    res.json(formattedUser);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, avatar_url, pilot_vehicle_type, pilot_plate_number } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (avatar_url !== undefined) {
      updates.push(`avatar_url = $${paramCount}`);
      values.push(avatar_url);
      paramCount++;
    }

    if (pilot_vehicle_type !== undefined) {
      updates.push(`pilot_vehicle_type = $${paramCount}`);
      values.push(pilot_vehicle_type);
      paramCount++;
    }

    if (pilot_plate_number !== undefined) {
      updates.push(`pilot_plate_number = $${paramCount}`);
      values.push(pilot_plate_number);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
      });
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    const user = result.rows[0];

    res.json(formatUserResponse(user, true));
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Update availability status (dual-role system)
exports.updateAvailability = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { isPilotAvailable, isRiderAvailable, location } = req.body;

    // Validate boolean values
    if (typeof isPilotAvailable !== 'boolean' || typeof isRiderAvailable !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isPilotAvailable and isRiderAvailable must be boolean values',
      });
    }

    // If setting pilot available, check KYC status
    if (isPilotAvailable) {
      const userCheck = await pool.query(
        'SELECT kyc_status FROM users WHERE id = $1',
        [userId]
      );

      if (userCheck.rows[0].kyc_status !== 'verified') {
        return res.status(403).json({
          success: false,
          message: 'KYC verification required to become available as pilot',
        });
      }
    }

    // Update user availability
    const result = await pool.query(
      `UPDATE users 
       SET is_pilot_available = $1, is_rider_available = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [isPilotAvailable, isRiderAvailable, userId]
    );

    const user = result.rows[0];

    // Update or insert into user_locations if location provided
    if (location && (isPilotAvailable || isRiderAvailable)) {
      await pool.query(
        `INSERT INTO user_locations (user_id, location, latitude, longitude, is_pilot_available, is_rider_available, last_updated)
         VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, $3, $2, $4, $5, NOW())
         ON CONFLICT (user_id) 
         DO UPDATE SET 
           location = ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
           latitude = $3,
           longitude = $2,
           is_pilot_available = $4,
           is_rider_available = $5,
           last_updated = NOW()`,
        [userId, location.lng, location.lat, isPilotAvailable, isRiderAvailable]
      );
    } else if (!isPilotAvailable && !isRiderAvailable) {
      // If both off, remove from user_locations or mark as unavailable
      await pool.query(
        `UPDATE user_locations 
         SET is_pilot_available = false, is_rider_available = false, last_updated = NOW()
         WHERE user_id = $1`,
        [userId]
      );
    }

    res.json({
      success: true,
      user: formatUserResponse(user, true),
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Update location
exports.updateLocation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { lat, lng, heading, speed, isPilotAvailable, isRiderAvailable } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    await pool.query(
      `INSERT INTO user_locations (user_id, location, latitude, longitude, heading, speed, is_pilot_available, is_rider_available, last_updated)
       VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, $3, $2, $4, $5, $6, $7, NOW())
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         location = ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
         latitude = $3,
         longitude = $2,
         heading = $4,
         speed = $5,
         is_pilot_available = $6,
         is_rider_available = $7,
         last_updated = NOW()`,
      [userId, lng, lat, heading || null, speed || null, isPilotAvailable, isRiderAvailable]
    );

    res.json({
      success: true,
      message: 'Location updated successfully',
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Set or update a pilot's destination
exports.updateDestination = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { destinationLat, destinationLng, originLat, originLng } = req.body;

    if (
      destinationLat === undefined ||
      destinationLng === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'destinationLat and destinationLng are required',
      });
    }

    const destLat = parseFloat(destinationLat);
    const destLng = parseFloat(destinationLng);

    // Ensure we have a current origin (existing row or provided in payload)
    const existing = await pool.query(
      'SELECT latitude, longitude, is_pilot_available, is_rider_available FROM user_locations WHERE user_id = $1',
      [userId]
    );

    let currentLat = existing.rows[0]?.latitude;
    let currentLng = existing.rows[0]?.longitude;
    const currentPilotAvailable = existing.rows[0]?.is_pilot_available ?? true;
    const currentRiderAvailable = existing.rows[0]?.is_rider_available ?? false;

    if ((currentLat === null || currentLat === undefined) && originLat !== undefined) {
      currentLat = parseFloat(originLat);
    }
    if ((currentLng === null || currentLng === undefined) && originLng !== undefined) {
      currentLng = parseFloat(originLng);
    }

    if (currentLat === null || currentLat === undefined || currentLng === null || currentLng === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Origin latitude and longitude are required to set a destination',
      });
    }

    await pool.query(
      `INSERT INTO user_locations (
        user_id, location, latitude, longitude,
        destination_lat, destination_lng, destination, destination_set_at,
        is_pilot_available, is_rider_available, last_updated
      )
      VALUES (
        $1,
        ST_SetSRID(ST_MakePoint($3, $2), 4326)::geography,
        $2, $3,
        $4, $5,
        ST_SetSRID(ST_MakePoint($5, $4), 4326)::geography,
        NOW(),
        $6, $7, NOW()
      )
      ON CONFLICT (user_id)
      DO UPDATE SET
        destination_lat = EXCLUDED.destination_lat,
        destination_lng = EXCLUDED.destination_lng,
        destination = EXCLUDED.destination,
        destination_set_at = NOW(),
        last_updated = NOW()`,
      [
        userId,
        parseFloat(currentLat),
        parseFloat(currentLng),
        destLat,
        destLng,
        currentPilotAvailable,
        currentRiderAvailable,
      ]
    );

    return res.json({
      success: true,
      destination: { lat: destLat, lng: destLng },
    });
  } catch (error) {
    console.error('Update destination error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// UNIFIED ENDPOINT - Get all nearby users (pilots + riders combined)
exports.getNearbyUsers = async (req, res) => {
  try {
    const { lat, lng, radius = 5000, withMocks = 'true' } = req.query;
    const includeMocks = withMocks === 'true';

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const radiusMeters = parseInt(radius);

    // Fetch real pilots from database
    let realPilots = [];
    try {
      const pilotResult = await pool.query(
        `SELECT u.id, u.name, u.avatar_url, u.rating, u.pilot_vehicle_type, u.pilot_plate_number,
           u.total_rides_as_pilot, u.total_km,
           ul.latitude, ul.longitude, ul.heading, ul.speed,
           ST_Distance(ul.location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) as distance,
           'pilot' as role,
           false as is_mock
         FROM users u
         JOIN user_locations ul ON u.id = ul.user_id
         WHERE ul.is_pilot_available = true
           AND ST_DWithin(ul.location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $3)
           AND ul.last_updated > NOW() - INTERVAL '5 minutes'
         ORDER BY distance ASC
         LIMIT 50`,
        [userLat, userLng, radiusMeters]
      );
      realPilots = pilotResult.rows;
    } catch (dbError) {
      console.warn('Database query for pilots failed:', dbError.message);
    }

    // Fetch real riders from database
    let realRiders = [];
    try {
      const riderResult = await pool.query(
        `SELECT u.id, u.name, u.avatar_url, u.rating,
           u.total_rides_as_rider,
           ul.latitude, ul.longitude,
           ST_Distance(ul.location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) as distance,
           'rider' as role,
           false as is_mock
         FROM users u
         JOIN user_locations ul ON u.id = ul.user_id
         WHERE ul.is_rider_available = true
           AND ST_DWithin(ul.location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $3)
           AND ul.last_updated > NOW() - INTERVAL '5 minutes'
         ORDER BY distance ASC
         LIMIT 50`,
        [userLat, userLng, radiusMeters]
      );
      realRiders = riderResult.rows;
    } catch (dbError) {
      console.warn('Database query for riders failed:', dbError.message);
    }

    // Combine real pilots and riders
    let allUsers = [...realPilots, ...realRiders];

    // Include dev-mode users that don't exist in users table (user_locations only)
    try {
      const devResult = await pool.query(
        `SELECT 
           ul.user_id AS id,
           ul.latitude,
           ul.longitude,
           ul.heading,
           ul.speed,
           ul.is_pilot_available,
           ul.is_rider_available,
           ST_Distance(ul.location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) as distance
         FROM user_locations ul
         WHERE ul.last_updated > NOW() - INTERVAL '5 minutes'
           AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id::text = ul.user_id)
           AND ST_DWithin(ul.location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $3)
         ORDER BY distance ASC
         LIMIT 50`,
        [userLat, userLng, radiusMeters]
      );

      const devUsers = devResult.rows.map((dev) => {
        const role = dev.is_pilot_available ? 'pilot' : 'rider';
        return {
          id: dev.id,
          name: dev.id?.replace('dev_mock_token_', '').replace('dev-', '') || 'Dev User',
          avatar_url: null,
          rating: 5.0,
          total_rides_as_pilot: role === 'pilot' ? 0 : undefined,
          total_rides_as_rider: role === 'rider' ? 0 : undefined,
          total_km: 0,
          latitude: parseFloat(dev.latitude),
          longitude: parseFloat(dev.longitude),
          heading: dev.heading,
          speed: dev.speed,
          distance: parseFloat(dev.distance),
          role,
          is_mock: false,
        };
      });

      allUsers = [...allUsers, ...devUsers];
    } catch (devError) {
      console.warn('Dev users inclusion failed:', devError.message);
    }

    // Add mock data if requested
    if (includeMocks) {
      // Mock pilots
      if (mockUsers.pilots.length > 0) {
        const pilotOffsets = [
          { lat: 0.005, lng: 0.003 },
          { lat: -0.003, lng: 0.006 },
          { lat: 0.008, lng: -0.004 },
          { lat: -0.006, lng: -0.005 },
          { lat: 0.002, lng: 0.007 },
        ];

        const mockPilotsWithDistance = mockUsers.pilots.map((pilot, index) => {
          const offset = pilotOffsets[index % pilotOffsets.length];
          const mockLat = userLat + offset.lat;
          const mockLng = userLng + offset.lng;
          const distance = calculateDistance(userLat, userLng, mockLat, mockLng);

          return {
            ...pilot,
            role: 'pilot',
            latitude: mockLat,
            longitude: mockLng,
            distance: Math.round(distance),
            is_mock: true,
          };
        }).filter(p => p.distance <= radiusMeters);

        allUsers = [...allUsers, ...mockPilotsWithDistance];
      }

      // Mock riders
      if (mockUsers.riders.length > 0) {
        const riderOffsets = [
          { lat: 0.004, lng: -0.002 },
          { lat: -0.005, lng: 0.004 },
          { lat: 0.003, lng: 0.006 },
          { lat: -0.002, lng: -0.007 },
          { lat: 0.007, lng: 0.001 },
        ];

        const mockRidersWithDistance = mockUsers.riders.map((rider, index) => {
          const offset = riderOffsets[index % riderOffsets.length];
          const mockLat = userLat + offset.lat;
          const mockLng = userLng + offset.lng;
          const distance = calculateDistance(userLat, userLng, mockLat, mockLng);

          return {
            ...rider,
            role: 'rider',
            latitude: mockLat,
            longitude: mockLng,
            distance: Math.round(distance),
            is_mock: true,
          };
        }).filter(r => r.distance <= radiusMeters);

        allUsers = [...allUsers, ...mockRidersWithDistance];
      }
    }

    // Sort by distance
    allUsers.sort((a, b) => a.distance - b.distance);

    res.json(allUsers);
  } catch (error) {
    console.error('Get nearby users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Directional matching: return only pilots whose path/direction aligns with rider route
exports.getMatchedPilots = async (req, res) => {
  try {
    const { origin, destination, radius = 5000, withMocks = 'false', riderRoute } = req.body || {};

    if (!origin || !destination || origin.lat === undefined || origin.lng === undefined || destination.lat === undefined || destination.lng === undefined) {
      return res.status(400).json({
        success: false,
        message: 'origin and destination with lat/lng are required',
      });
    }

    const riderOrigin = { lat: parseFloat(origin.lat), lng: parseFloat(origin.lng) };
    const riderDestination = { lat: parseFloat(destination.lat), lng: parseFloat(destination.lng) };
    const radiusMeters = parseInt(radius);
    const includeMocks = withMocks === 'true';

    // Fetch available pilots in radius
    let realPilots = [];
    try {
      const pilotResult = await pool.query(
        `SELECT u.id, u.name, u.avatar_url, u.rating, u.pilot_vehicle_type, u.pilot_plate_number,
           u.total_rides_as_pilot, u.total_km,
           ul.latitude, ul.longitude, ul.heading, ul.speed,
           ul.destination_lat, ul.destination_lng,
           ST_Distance(ul.location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) as distance,
           'pilot' as role,
           false as is_mock
         FROM users u
         JOIN user_locations ul ON u.id = ul.user_id
         WHERE ul.is_pilot_available = true
           AND ST_DWithin(ul.location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $3)
           AND ul.last_updated > NOW() - INTERVAL '5 minutes'
         ORDER BY distance ASC
         LIMIT 80`,
        [riderOrigin.lat, riderOrigin.lng, radiusMeters]
      );
      realPilots = pilotResult.rows;
    } catch (dbError) {
      console.warn('Database query for matched pilots failed:', dbError.message);
    }

    let pilotsPool = [...realPilots];

    // Optionally include mock pilots for demo
    if (includeMocks && mockUsers.pilots.length > 0) {
      const offsets = [
        { lat: 0.003, lng: 0.003, heading: 45 },
        { lat: -0.005, lng: 0.002, heading: 135 },
        { lat: 0.008, lng: -0.004, heading: 315 },
        { lat: -0.007, lng: -0.006, heading: 225 },
      ];

      const mocks = mockUsers.pilots.map((pilot, idx) => {
        const offset = offsets[idx % offsets.length];
        const mockLat = riderOrigin.lat + offset.lat;
        const mockLng = riderOrigin.lng + offset.lng;
        const distance = calculateDistance(riderOrigin.lat, riderOrigin.lng, mockLat, mockLng);
        return {
          ...pilot,
          role: 'pilot',
          latitude: mockLat,
          longitude: mockLng,
          heading: offset.heading,
          destination_lat: null,
          destination_lng: null,
          distance: Math.round(distance),
          is_mock: true,
        };
      }).filter((p) => p.distance <= radiusMeters);

      pilotsPool = [...pilotsPool, ...mocks];
    }

    // If still no pilots and mocks are allowed, generate nearby demo pilots aligned to rider destination
    if (includeMocks && pilotsPool.length === 0) {
      const destLat = riderDestination.lat;
      const destLng = riderDestination.lng;
      const demoPilots = Array.from({ length: 3 }).map((_, idx) => {
        const distanceMeters = 500 + idx * 300; // 0.5km, 0.8km, 1.1km
        const bearing = 45 + idx * 60;
        const projected = projectPoint(riderOrigin.lat, riderOrigin.lng, bearing, distanceMeters);
        const headingToDest = calculateBearing(projected.lat, projected.lon, destLat, destLng);
        return {
          id: `demo-pilot-${idx}`,
          name: `Demo Pilot ${idx + 1}`,
          latitude: projected.lat,
          longitude: projected.lon,
          heading: headingToDest,
          destination_lat: destLat,
          destination_lng: destLng,
          distance: Math.round(distanceMeters),
          role: 'pilot',
          is_mock: true,
        };
      });
      pilotsPool = demoPilots;
    }

    const riderRouteParsed = Array.isArray(riderRoute)
      ? riderRoute.map((pt) => ({ lat: parseFloat(pt.lat), lng: parseFloat(pt.lng) }))
      : null;

    console.log(`🔍 Matching pilots: ${pilotsPool.length} pilots found, route points: ${riderRouteParsed?.length || 0}`);

    const matches = matchPilots({
      riderOrigin,
      riderDestination,
      riderRoute: riderRouteParsed,
      pilots: pilotsPool,
    });

    console.log(`✅ Matched ${matches.length} pilots out of ${pilotsPool.length} candidates`);
    if (matches.length === 0 && pilotsPool.length > 0) {
      console.log('⚠️ No matches found. Pilot details:', pilotsPool.slice(0, 3).map(p => ({
        name: p.name,
        location: `${p.latitude}, ${p.longitude}`,
        heading: p.heading,
        destination: p.destination_lat ? `${p.destination_lat}, ${p.destination_lng}` : 'none',
        distance: p.distance
      })));
    }

    return res.json({
      success: true,
      count: matches.length,
      pilots: matches,
    });
  } catch (error) {
    console.error('Get matched pilots error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get nearby pilots (supports ?withMocks=true for demo)
exports.getNearbyPilots = async (req, res) => {
  try {
    const { lat, lng, radius = 5000, withMocks = 'true' } = req.query;
    const includeMocks = withMocks === 'true';

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const radiusMeters = parseInt(radius);

    // Fetch real pilots from database
    let realPilots = [];
    try {
      const result = await pool.query(
        `SELECT u.id, u.name, u.avatar_url, u.rating, u.pilot_vehicle_type, u.pilot_plate_number,
           u.total_rides_as_pilot, u.total_km,
           ul.latitude, ul.longitude, ul.heading, ul.speed,
           ST_Distance(ul.location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) as distance,
           false as is_mock
         FROM users u
         JOIN user_locations ul ON u.id = ul.user_id
         WHERE ul.is_pilot_available = true
           AND ST_DWithin(ul.location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $3)
           AND ul.last_updated > NOW() - INTERVAL '5 minutes'
         ORDER BY distance ASC
         LIMIT 50`,
        [userLat, userLng, radiusMeters]
      );
      realPilots = result.rows;
    } catch (dbError) {
      console.warn('Database query failed, using mocks only:', dbError.message);
    }

    // Add mock pilots if requested - position them around user's location
    let allPilots = [...realPilots];
    if (includeMocks && mockUsers.pilots.length > 0) {
      // Calculate offsets based on radius to ensure mocks are always within range
      // Use 20-80% of radius to spread them nicely
      const minRadiusPercent = 0.2;
      const maxRadiusPercent = 0.8;
      const minDist = radiusMeters * minRadiusPercent;
      const maxDist = radiusMeters * maxRadiusPercent;
      
      // Generate offsets that will place mocks within the radius
      const offsets = [
        { lat: 0.003, lng: 0.003 },    // NE
        { lat: -0.005, lng: 0.002 },   // SE
        { lat: 0.008, lng: -0.004 },   // NW
        { lat: -0.007, lng: -0.006 },  // SW
        { lat: 0.015, lng: 0.01 },     // NE far
      ];
      
      const mockPilotsWithDistance = mockUsers.pilots.map((pilot, idx) => {
        const offset = offsets[idx % offsets.length];
        // Scale offset to ensure distance is within range
        let mockLat = userLat + offset.lat;
        let mockLng = userLng + offset.lng;
        let distance = calculateDistance(userLat, userLng, mockLat, mockLng);
        
        // If too close or too far, adjust
        if (distance < minDist) {
          const scale = minDist / distance;
          mockLat = userLat + (offset.lat * scale);
          mockLng = userLng + (offset.lng * scale);
          distance = calculateDistance(userLat, userLng, mockLat, mockLng);
        } else if (distance > maxDist) {
          const scale = maxDist / distance;
          mockLat = userLat + (offset.lat * scale);
          mockLng = userLng + (offset.lng * scale);
          distance = calculateDistance(userLat, userLng, mockLat, mockLng);
        }
        
        return {
          ...pilot,
          latitude: mockLat,
          longitude: mockLng,
          distance: Math.round(distance),
          is_mock: true,
        };
      });
      
      // Filter to ensure all mocks are within radius
      const mocksInRange = mockPilotsWithDistance.filter(p => p.distance <= radiusMeters);
      allPilots = [...realPilots, ...mocksInRange];
    }

    // Sort by distance
    allPilots.sort((a, b) => a.distance - b.distance);

    res.json(allPilots);
  } catch (error) {
    console.error('Get nearby pilots error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get nearby riders (supports ?withMocks=true for demo)
exports.getNearbyRiders = async (req, res) => {
  try {
    const { lat, lng, radius = 5000, withMocks = 'true' } = req.query;
    const includeMocks = withMocks === 'true';

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const radiusMeters = parseInt(radius);

    // Fetch real riders from database
    let realRiders = [];
    try {
      const result = await pool.query(
        `SELECT u.id, u.name, u.avatar_url, u.rating,
           u.total_rides_as_rider,
           ul.latitude, ul.longitude,
           ST_Distance(ul.location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) as distance,
           false as is_mock
         FROM users u
         JOIN user_locations ul ON u.id = ul.user_id
         WHERE ul.is_rider_available = true
           AND ST_DWithin(ul.location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $3)
           AND ul.last_updated > NOW() - INTERVAL '5 minutes'
         ORDER BY distance ASC
         LIMIT 50`,
        [userLat, userLng, radiusMeters]
      );
      realRiders = result.rows;
    } catch (dbError) {
      console.warn('Database query failed, using mocks only:', dbError.message);
    }

    // Add mock riders if requested - position them around user's location
    let allRiders = [...realRiders];
    if (includeMocks && mockUsers.riders.length > 0) {
      // Calculate offsets based on radius to ensure mocks are always within range
      const minRadiusPercent = 0.25;
      const maxRadiusPercent = 0.75;
      const minDist = radiusMeters * minRadiusPercent;
      const maxDist = radiusMeters * maxRadiusPercent;
      
      // Generate offsets that will place mocks within the radius
      const offsets = [
        { lat: 0.004, lng: -0.002 },   // NW
        { lat: -0.003, lng: 0.005 },   // SE
        { lat: 0.006, lng: 0.006 },    // NE
        { lat: -0.009, lng: -0.003 },  // SW
        { lat: 0.012, lng: -0.008 },   // W
      ];
      
      const mockRidersWithDistance = mockUsers.riders.map((rider, idx) => {
        const offset = offsets[idx % offsets.length];
        // Scale offset to ensure distance is within range
        let mockLat = userLat + offset.lat;
        let mockLng = userLng + offset.lng;
        let distance = calculateDistance(userLat, userLng, mockLat, mockLng);
        
        // If too close or too far, adjust
        if (distance < minDist) {
          const scale = minDist / distance;
          mockLat = userLat + (offset.lat * scale);
          mockLng = userLng + (offset.lng * scale);
          distance = calculateDistance(userLat, userLng, mockLat, mockLng);
        } else if (distance > maxDist) {
          const scale = maxDist / distance;
          mockLat = userLat + (offset.lat * scale);
          mockLng = userLng + (offset.lng * scale);
          distance = calculateDistance(userLat, userLng, mockLat, mockLng);
        }
        
        return {
          ...rider,
          latitude: mockLat,
          longitude: mockLng,
          distance: Math.round(distance),
          is_mock: true,
        };
      });
      
      // Filter to ensure all mocks are within radius
      const mocksInRange = mockRidersWithDistance.filter(r => r.distance <= radiusMeters);
      allRiders = [...realRiders, ...mocksInRange];
    }

    // Sort by distance
    allRiders.sort((a, b) => a.distance - b.distance);

    res.json(allRiders);
  } catch (error) {
    console.error('Get nearby riders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
