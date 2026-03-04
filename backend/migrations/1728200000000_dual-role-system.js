// migrations/1728200000000_dual-role-system.js
// Converts single-role system to dual-role (user can be both pilot and rider)

exports.up = (pgm) => {
  console.log('🔄 Starting dual-role system migration...');

  // 1. Add dual availability flags to users table
  pgm.sql(`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS is_pilot_available BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_rider_available BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS pilot_vehicle_type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS pilot_plate_number VARCHAR(20),
    ADD COLUMN IF NOT EXISTS total_rides_as_pilot INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_rides_as_rider INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_ride_date DATE,
    ADD COLUMN IF NOT EXISTS fcm_token TEXT;
  `);

  // 2. Migrate existing role data to availability flags
  pgm.sql(`
    UPDATE users 
    SET is_pilot_available = (role = 'pilot' OR role = 'both'),
        is_rider_available = (role = 'rider' OR role = 'both')
    WHERE role IS NOT NULL;
  `);

  // 3. Create composite index for availability filtering
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_users_availability 
    ON users(is_pilot_available, is_rider_available);
  `);

  // 4. Rename pilot_locations to user_locations and add dual tracking
  // Rename legacy table only if it exists and target doesn't
  pgm.sql(`
    DO $$
    BEGIN
      IF to_regclass('public.pilot_locations') IS NOT NULL
         AND to_regclass('public.user_locations') IS NULL THEN
        ALTER TABLE pilot_locations RENAME TO user_locations;
      END IF;
    END $$;
  `);

  // Rename column only when present
  pgm.sql(`
    DO $$
    BEGIN
      IF to_regclass('public.user_locations') IS NOT NULL
         AND EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_schema = 'public' 
             AND table_name = 'user_locations' 
             AND column_name = 'pilot_id'
         ) THEN
        ALTER TABLE user_locations RENAME COLUMN pilot_id TO user_id;
      END IF;
    END $$;
  `);

  pgm.sql(`
    ALTER TABLE user_locations 
    ADD COLUMN IF NOT EXISTS is_pilot_available BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_rider_available BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT NOW();
  `);

  // 5. Update indexes
  pgm.sql(`
    DROP INDEX IF EXISTS idx_pilot_locations_geo;
    DROP INDEX IF EXISTS idx_pilot_locations_available;
    
    CREATE INDEX IF NOT EXISTS idx_user_locations_geo ON user_locations USING GIST(location);
    CREATE INDEX IF NOT EXISTS idx_user_locations_availability 
    ON user_locations(is_pilot_available, is_rider_available, last_updated);
  `);

  // 6. Update rides table to support bidirectional flow
  pgm.sql(`
    ALTER TABLE rides 
    ADD COLUMN IF NOT EXISTS initiated_by VARCHAR(10) CHECK (initiated_by IN ('rider', 'pilot')),
    ADD COLUMN IF NOT EXISTS tokens_awarded_to_rider INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tokens_awarded_to_pilot INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ride_hash VARCHAR(64),
    ADD COLUMN IF NOT EXISTS rider_confirmed_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS pilot_confirmed_at TIMESTAMP;
  `);

  // 7. Update status enum to include new states
  pgm.sql(`
    ALTER TABLE rides 
    DROP CONSTRAINT IF EXISTS rides_status_check;
    
    ALTER TABLE rides 
    ADD CONSTRAINT rides_status_check 
    CHECK (status IN ('notified', 'offered', 'pending_confirm', 'confirmed', 'active', 'completed', 'cancelled', 'expired'));
  `);

  // 8. Update active_notifications table
  pgm.sql(`
    ALTER TABLE active_notifications 
    ADD COLUMN IF NOT EXISTS initiator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS initiator_location GEOGRAPHY(POINT, 4326),
    ADD COLUMN IF NOT EXISTS notification_type VARCHAR(20) CHECK (notification_type IN ('notify_pilot', 'offer_ride')),
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'proximity_detected', 'expired')),
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '5 minutes';
  `);

  // 9. Create RTO plates table for gamification
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS rto_plates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      rto_code VARCHAR(10) NOT NULL,
      state VARCHAR(50),
      district VARCHAR(100),
      collected_at TIMESTAMP DEFAULT NOW(),
      ride_id UUID REFERENCES rides(id) ON DELETE SET NULL,
      UNIQUE(user_id, rto_code)
    );
  `);

  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_rto_plates_user ON rto_plates(user_id);
    CREATE INDEX IF NOT EXISTS idx_rto_plates_collected ON rto_plates(user_id, collected_at);
  `);

  // 10. Create badges table
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS user_badges (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      badge_type VARCHAR(50) NOT NULL,
      earned_at TIMESTAMP DEFAULT NOW(),
      metadata JSONB,
      UNIQUE(user_id, badge_type)
    );
  `);

  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_badges_user ON user_badges(user_id);
  `);

  // 11. Add origin/destination geography points to rides
  pgm.sql(`
    ALTER TABLE rides 
    ADD COLUMN IF NOT EXISTS origin GEOGRAPHY(POINT, 4326),
    ADD COLUMN IF NOT EXISTS destination GEOGRAPHY(POINT, 4326);
  `);

  // 12. Update existing rides to have geography points
  pgm.sql(`
    UPDATE rides 
    SET origin = ST_SetSRID(ST_MakePoint(origin_lng, origin_lat), 4326)::geography
    WHERE origin IS NULL AND origin_lng IS NOT NULL;
    
    UPDATE rides 
    SET destination = ST_SetSRID(ST_MakePoint(destination_lng, destination_lat), 4326)::geography
    WHERE destination IS NULL AND destination_lng IS NOT NULL;
  `);

  console.log('✅ Dual-role system migration completed successfully!');
};

exports.down = (pgm) => {
  console.log('🔄 Rolling back dual-role system migration...');

  // Reverse the changes
  pgm.sql(`DROP TABLE IF EXISTS user_badges CASCADE;`);
  pgm.sql(`DROP TABLE IF EXISTS rto_plates CASCADE;`);
  
  pgm.sql(`
    ALTER TABLE rides 
    DROP COLUMN IF EXISTS origin,
    DROP COLUMN IF EXISTS destination,
    DROP COLUMN IF EXISTS initiated_by,
    DROP COLUMN IF EXISTS tokens_awarded_to_rider,
    DROP COLUMN IF EXISTS tokens_awarded_to_pilot,
    DROP COLUMN IF EXISTS ride_hash,
    DROP COLUMN IF EXISTS rider_confirmed_at,
    DROP COLUMN IF EXISTS pilot_confirmed_at;
  `);

  pgm.sql(`
    ALTER TABLE user_locations 
    DROP COLUMN IF EXISTS is_pilot_available,
    DROP COLUMN IF EXISTS is_rider_available,
    DROP COLUMN IF EXISTS last_updated;
  `);

  pgm.sql(`ALTER TABLE user_locations RENAME COLUMN user_id TO pilot_id;`);
  pgm.sql(`ALTER TABLE user_locations RENAME TO pilot_locations;`);

  pgm.sql(`
    ALTER TABLE users 
    DROP COLUMN IF EXISTS is_pilot_available,
    DROP COLUMN IF EXISTS is_rider_available,
    DROP COLUMN IF EXISTS pilot_vehicle_type,
    DROP COLUMN IF EXISTS pilot_plate_number,
    DROP COLUMN IF EXISTS total_rides_as_pilot,
    DROP COLUMN IF EXISTS total_rides_as_rider,
    DROP COLUMN IF EXISTS streak_days,
    DROP COLUMN IF EXISTS last_ride_date,
    DROP COLUMN IF EXISTS fcm_token;
  `);

  console.log('✅ Rollback completed');
};








