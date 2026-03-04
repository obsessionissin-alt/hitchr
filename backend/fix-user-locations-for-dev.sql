-- Remove foreign key constraint so dev users can update location without being in users table
ALTER TABLE user_locations DROP CONSTRAINT IF EXISTS user_locations_user_id_fkey;

-- Change user_id to TEXT to accept any identifier (dev tokens or UUIDs)
ALTER TABLE user_locations ALTER COLUMN user_id TYPE TEXT;
