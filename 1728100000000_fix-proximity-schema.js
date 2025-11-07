// Migration to add missing columns to active_notifications for proximity service
exports.up = (pgm) => {
  // Add rider_location (GEOGRAPHY) column for storing rider's location
  pgm.sql(`
    ALTER TABLE active_notifications 
    ADD COLUMN IF NOT EXISTS rider_location GEOGRAPHY(POINT, 4326);
  `);

  // Add expires_at column for notification expiration
  pgm.sql(`
    ALTER TABLE active_notifications 
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
  `);

  // Create spatial index for rider_location
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_notifications_rider_location 
    ON active_notifications USING GIST(rider_location);
  `);

  // Create index for expires_at for faster expiration queries
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_notifications_expires_at 
    ON active_notifications(expires_at);
  `);

  console.log('✅ Added rider_location and expires_at columns to active_notifications');
};

exports.down = (pgm) => {
  pgm.sql('DROP INDEX IF EXISTS idx_notifications_expires_at;');
  pgm.sql('DROP INDEX IF EXISTS idx_notifications_rider_location;');
  pgm.sql('ALTER TABLE active_notifications DROP COLUMN IF EXISTS expires_at;');
  pgm.sql('ALTER TABLE active_notifications DROP COLUMN IF EXISTS rider_location;');
  
  console.log('✅ Removed rider_location and expires_at columns from active_notifications');
};
