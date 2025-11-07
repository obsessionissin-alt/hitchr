const db = require('../config/database');

const PROXIMITY_THRESHOLD = parseInt(process.env.PROXIMITY_THRESHOLD_METERS) || 20;
const CHECK_INTERVAL = parseInt(process.env.PROXIMITY_CHECK_INTERVAL) || 2000;

let proximityCheckInterval = null;

const checkProximity = async () => {
  try {
    const result = await db.query(
      `SELECT 
         an.id as notification_id,
         an.ride_id,
         an.rider_id,
         an.pilot_id,
         ST_Y(an.rider_location::geometry) as rider_lat,
         ST_X(an.rider_location::geometry) as rider_lng,
         an.expires_at
       FROM active_notifications an
       WHERE an.expires_at > CURRENT_TIMESTAMP`
    );

    if (result.rows.length === 0) {
      return;
    }

    for (const notification of result.rows) {
      try {
        // Get pilot location from pilot_locations table instead of Redis
        const pilotLocationResult = await db.query(
          `SELECT 
            ST_Y(location::geometry) as latitude,
            ST_X(location::geometry) as longitude
           FROM pilot_locations
           WHERE pilot_id = $1 AND is_available = true
           LIMIT 1`,
          [notification.pilot_id]
        );

        if (pilotLocationResult.rows.length === 0) {
          console.log(`No location data for pilot ${notification.pilot_id}`);
          continue;
        }

        const pilotLocation = pilotLocationResult.rows[0];
        
        const distance = calculateDistance(
          notification.rider_lat,
          notification.rider_lng,
          pilotLocation.latitude,
          pilotLocation.longitude
        );

        console.log(`Ride ${notification.ride_id}: Distance ${distance.toFixed(2)}m`);

        if (distance <= PROXIMITY_THRESHOLD) {
          console.log(`Proximity match! Ride ${notification.ride_id}`);

          await db.query(
            `UPDATE rides SET status = 'pending' WHERE id = $1`,
            [notification.ride_id]
          );

          await db.query(
            `DELETE FROM active_notifications WHERE id = $1`,
            [notification.notification_id]
          );

          const io = getIO();
          io.to(`user:${notification.rider_id}`).emit('ride:proximity-match', {
            rideId: notification.ride_id,
            distance: Math.round(distance),
            pilotLocation: {
              lat: pilotLocation.latitude,
              lng: pilotLocation.longitude,
            }
          });

          io.to(`user:${notification.pilot_id}`).emit('ride:proximity-match', {
            rideId: notification.ride_id,
            distance: Math.round(distance),
            riderLocation: {
              lat: notification.rider_lat,
              lng: notification.rider_lng,
            }
          });

          console.log(`Proximity match emitted for ride ${notification.ride_id}`);
        }
      } catch (error) {
        console.error(`Error processing notification ${notification.notification_id}:`, error);
      }
    }

    const expiredResult = await db.query(
      `DELETE FROM active_notifications 
       WHERE expires_at <= CURRENT_TIMESTAMP
       RETURNING ride_id`
    );

    if (expiredResult.rows.length > 0) {
      console.log(`Cleaned up ${expiredResult.rows.length} expired notifications`);
      
      for (const expired of expiredResult.rows) {
        await db.query(
          `UPDATE rides SET status = 'cancelled' WHERE id = $1 AND status = 'notified'`,
          [expired.ride_id]
        );
      }
    }
  } catch (error) {
    console.error('Proximity check error:', error);
  }
};

const startProximityService = () => {
  if (proximityCheckInterval) {
    console.log('Proximity service already running');
    return; 
  }

  console.log(`Starting proximity service (checking every ${CHECK_INTERVAL}ms)`);
  proximityCheckInterval = setInterval(checkProximity, CHECK_INTERVAL);
  
  checkProximity();
};

const stopProximityService = () => {
  if (proximityCheckInterval) {
    clearInterval(proximityCheckInterval);
    proximityCheckInterval = null;
    console.log('Proximity service stopped');
  }
};

module.exports = {
  startProximityService,
  stopProximityService,
  checkProximity,
};

