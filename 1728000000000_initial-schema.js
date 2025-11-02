// migrations/1728000000000_initial-schema.js
exports.up = (pgm) => {
  // Enable PostGIS extension for geospatial queries
  pgm.sql('CREATE EXTENSION IF NOT EXISTS postgis;');
  pgm.sql('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

  // Users table
  pgm.sql(`
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      firebase_uid VARCHAR(128) UNIQUE,
      phone VARCHAR(20) UNIQUE NOT NULL,
      name VARCHAR(100),
      role VARCHAR(20) DEFAULT 'rider' CHECK (role IN ('rider', 'pilot', 'both')),
      avatar_url TEXT,
      kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
      kyc_document TEXT,
      token_balance INTEGER DEFAULT 0,
      total_rides INTEGER DEFAULT 0,
      total_km NUMERIC DEFAULT 0,
      rating NUMERIC DEFAULT 0,
      rating_count INTEGER DEFAULT 0,
      completed_rides INTEGER DEFAULT 0,
      trust_score DECIMAL(3, 2) DEFAULT 5.00,
      subscription_plan VARCHAR(50),
      subscription_expires_at TIMESTAMP,
      is_available BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Create indexes for users
  pgm.sql(`
    CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
    CREATE INDEX idx_users_phone ON users(phone);
    CREATE INDEX idx_users_role ON users(role);
  `);

  // Pilot locations table (PostGIS for geospatial queries)
  pgm.sql(`
    CREATE TABLE pilot_locations (
      pilot_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      location GEOGRAPHY(POINT, 4326) NOT NULL,
      latitude DECIMAL(10, 8) NOT NULL,
      longitude DECIMAL(11, 8) NOT NULL,
      heading DECIMAL(5, 2),
      speed DECIMAL(5, 2),
      is_available BOOLEAN DEFAULT true,
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Create spatial index for fast proximity searches
  pgm.sql(`
    CREATE INDEX idx_pilot_locations_geo ON pilot_locations USING GIST(location);
    CREATE INDEX idx_pilot_locations_available ON pilot_locations(is_available);
  `);

  // Rides table
  pgm.sql(`
    CREATE TABLE rides (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      rider_id UUID REFERENCES users(id) ON DELETE CASCADE,
      pilot_id UUID REFERENCES users(id) ON DELETE CASCADE,
      origin_lat DECIMAL(10, 8) NOT NULL,
      origin_lng DECIMAL(11, 8) NOT NULL,
      origin_address TEXT,
      destination_lat DECIMAL(10, 8) NOT NULL,
      destination_lng DECIMAL(11, 8) NOT NULL,
      destination_address TEXT,
      distance_meters INTEGER,
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'confirmed', 'active', 'completed', 'cancelled')),
      rider_confirmed BOOLEAN DEFAULT false,
      pilot_confirmed BOOLEAN DEFAULT false,
      tokens_awarded INTEGER DEFAULT 0,
      started_at TIMESTAMP,
      ended_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Create indexes for rides
  pgm.sql(`
    CREATE INDEX idx_rides_rider ON rides(rider_id);
    CREATE INDEX idx_rides_pilot ON rides(pilot_id);
    CREATE INDEX idx_rides_status ON rides(status);
    CREATE INDEX idx_rides_created ON rides(created_at);
  `);

  // Active notifications (proximity matching queue)
  pgm.sql(`
    CREATE TABLE active_notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
      rider_id UUID REFERENCES users(id) ON DELETE CASCADE,
      pilot_id UUID REFERENCES users(id) ON DELETE CASCADE,
      notification_sent BOOLEAN DEFAULT false,
      proximity_matched BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  pgm.sql(`
    CREATE INDEX idx_notifications_ride ON active_notifications(ride_id);
    CREATE INDEX idx_notifications_pilot ON active_notifications(pilot_id);
    CREATE INDEX idx_notifications_proximity ON active_notifications(proximity_matched);
  `);

  // Tokens table (transaction history)
  pgm.sql(`
    CREATE TABLE tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      type VARCHAR(20) CHECK (type IN ('earn', 'spend', 'bonus', 'penalty')),
      category VARCHAR(50),
      source VARCHAR(100),
      ride_id UUID REFERENCES rides(id) ON DELETE SET NULL,
      metadata JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  pgm.sql(`
    CREATE INDEX idx_tokens_user ON tokens(user_id);
    CREATE INDEX idx_tokens_type ON tokens(type);
    CREATE INDEX idx_tokens_created ON tokens(created_at);
  `);

  // Telemetry table (GPS tracking during rides)
  pgm.sql(`
    CREATE TABLE telemetry (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      latitude DECIMAL(10, 8) NOT NULL,
      longitude DECIMAL(11, 8) NOT NULL,
      speed DECIMAL(5, 2),
      heading DECIMAL(5, 2),
      accuracy DECIMAL(5, 2),
      device_id VARCHAR(100),
      timestamp TIMESTAMP DEFAULT NOW()
    );
  `);

  pgm.sql(`
    CREATE INDEX idx_telemetry_ride ON telemetry(ride_id);
    CREATE INDEX idx_telemetry_user ON telemetry(user_id);
    CREATE INDEX idx_telemetry_timestamp ON telemetry(timestamp);
  `);

  console.log('✅ All tables created successfully');
};

exports.down = (pgm) => {
  pgm.sql('DROP TABLE IF EXISTS telemetry CASCADE;');
  pgm.sql('DROP TABLE IF EXISTS tokens CASCADE;');
  pgm.sql('DROP TABLE IF EXISTS active_notifications CASCADE;');
  pgm.sql('DROP TABLE IF EXISTS rides CASCADE;');
  pgm.sql('DROP TABLE IF EXISTS pilot_locations CASCADE;');
  pgm.sql('DROP TABLE IF EXISTS users CASCADE;');
  pgm.sql('DROP EXTENSION IF EXISTS postgis;');
  pgm.sql('DROP EXTENSION IF EXISTS "uuid-ossp";');
  
  console.log('✅ All tables dropped');
};