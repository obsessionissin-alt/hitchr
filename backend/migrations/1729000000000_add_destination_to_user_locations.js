// Migration: add destination fields to user_locations for directional matching

exports.up = (pgm) => {
  // Add destination lat/lng and timestamp when destination was set
  pgm.sql(`
    ALTER TABLE user_locations
    ADD COLUMN IF NOT EXISTS destination_lat DECIMAL(10, 8),
    ADD COLUMN IF NOT EXISTS destination_lng DECIMAL(11, 8),
    ADD COLUMN IF NOT EXISTS destination_set_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS destination GEOGRAPHY(POINT, 4326)
  `);

  // Index to speed up matching queries involving destination geometry
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_user_locations_destination_geo
    ON user_locations USING GIST(destination);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE user_locations
    DROP COLUMN IF EXISTS destination,
    DROP COLUMN IF EXISTS destination_set_at,
    DROP COLUMN IF EXISTS destination_lng,
    DROP COLUMN IF EXISTS destination_lat
  `);

  pgm.sql(`
    DROP INDEX IF EXISTS idx_user_locations_destination_geo;
  `);
};


