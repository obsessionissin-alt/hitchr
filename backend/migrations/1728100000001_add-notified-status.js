// migrations/1728100000001_add-notified-status.js
exports.up = (pgm) => {
  // Drop the old constraint
  pgm.sql(`
    ALTER TABLE rides 
    DROP CONSTRAINT IF EXISTS rides_status_check;
  `);

  // Add new constraint with 'notified' status
  pgm.sql(`
    ALTER TABLE rides 
    ADD CONSTRAINT rides_status_check 
    CHECK (status IN ('pending', 'notified', 'accepted', 'confirmed', 'active', 'completed', 'cancelled'));
  `);

  console.log('✅ Added "notified" status to rides table');
};

exports.down = (pgm) => {
  // Revert to original constraint
  pgm.sql(`
    ALTER TABLE rides 
    DROP CONSTRAINT IF EXISTS rides_status_check;
  `);

  pgm.sql(`
    ALTER TABLE rides 
    ADD CONSTRAINT rides_status_check 
    CHECK (status IN ('pending', 'accepted', 'confirmed', 'active', 'completed', 'cancelled'));
  `);

  console.log('✅ Removed "notified" status from rides table');
};

