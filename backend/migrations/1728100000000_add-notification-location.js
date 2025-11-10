// migrations/1728100000000_add-notification-location.js
exports.up = (pgm) => {
  // Add rider_location column to active_notifications
  pgm.sql(`
    ALTER TABLE active_notifications
    ADD COLUMN IF NOT EXISTS rider_location GEOGRAPHY(POINT, 4326);
  `);

  // Add expires_at column to active_notifications
  pgm.sql(`
    ALTER TABLE active_notifications
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '10 minutes');
  `);

  // Create index on expires_at for faster cleanup queries
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_notifications_expires 
    ON active_notifications(expires_at);
  `);

  // Create spatial index for rider_location
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_notifications_rider_location 
    ON active_notifications USING GIST(rider_location);
  `);

  console.log('✅ Added rider_location and expires_at columns to active_notifications');
};

exports.down = (pgm) => {
  pgm.sql('DROP INDEX IF EXISTS idx_notifications_rider_location;');
  pgm.sql('DROP INDEX IF EXISTS idx_notifications_expires;');
  pgm.sql('ALTER TABLE active_notifications DROP COLUMN IF EXISTS expires_at;');
  pgm.sql('ALTER TABLE active_notifications DROP COLUMN IF EXISTS rider_location;');
  
  console.log('✅ Removed rider_location and expires_at columns from active_notifications');
};

