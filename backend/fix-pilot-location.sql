-- Fix pilot locations to be near user location (30.395359, 77.966561 - Aligarh)
-- Run this in your PostgreSQL database

-- Update existing pilots with correct locations
UPDATE pilot_locations 
SET 
  location = ST_SetSRID(ST_MakePoint(77.968, 30.397), 4326),
  updated_at = NOW()
WHERE pilot_id = (SELECT id FROM users WHERE phone = '+919876543210' LIMIT 1);

UPDATE pilot_locations 
SET 
  location = ST_SetSRID(ST_MakePoint(77.969, 30.394), 4326),
  updated_at = NOW()
WHERE pilot_id = (SELECT id FROM users WHERE phone = '+919876543211' LIMIT 1);

UPDATE pilot_locations 
SET 
  location = ST_SetSRID(ST_MakePoint(77.965, 30.398), 4326),
  updated_at = NOW()
WHERE pilot_id = (SELECT id FROM users WHERE phone = '+919876543212' LIMIT 1);

-- OR: Delete and recreate with correct locations
DELETE FROM pilot_locations;

-- Insert pilots with locations near Aligarh (30.39, 77.96)
INSERT INTO pilot_locations (pilot_id, location, is_available, updated_at)
SELECT 
  id,
  ST_SetSRID(ST_MakePoint(77.968, 30.397), 4326), -- ~0.3 km away
  true,
  NOW()
FROM users WHERE phone = '+919876543210';

INSERT INTO pilot_locations (pilot_id, location, is_available, updated_at)
SELECT 
  id,
  ST_SetSRID(ST_MakePoint(77.969, 30.394), 4326), -- ~0.2 km away
  true,
  NOW()
FROM users WHERE phone = '+919876543211';

INSERT INTO pilot_locations (pilot_id, location, is_available, updated_at)
SELECT 
  id,
  ST_SetSRID(ST_MakePoint(77.965, 30.398), 4326), -- ~0.4 km away
  true,
  NOW()
FROM users WHERE phone = '+919876543212';

-- Verify the locations
SELECT 
  u.name,
  u.phone,
  ST_Y(pl.location) as latitude,
  ST_X(pl.location) as longitude,
  pl.is_available
FROM users u
JOIN pilot_locations pl ON u.id = pl.pilot_id
WHERE u.role = 'pilot';

-- Check distances from user location (30.395359, 77.966561)
SELECT 
  u.name,
  u.phone,
  ROUND(
    ST_Distance(
      pl.location::geography,
      ST_SetSRID(ST_MakePoint(77.966561, 30.395359), 4326)::geography
    )::numeric, 
    2
  ) as distance_meters
FROM users u
JOIN pilot_locations pl ON u.id = pl.pilot_id
WHERE u.role = 'pilot'
ORDER BY distance_meters;