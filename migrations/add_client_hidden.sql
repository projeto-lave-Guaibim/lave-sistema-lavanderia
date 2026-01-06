-- Migration: Add is_hidden column to clients table
-- This allows hiding inactive clients without deleting them

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_clients_is_hidden ON clients(is_hidden);

-- Add comment for documentation
COMMENT ON COLUMN clients.is_hidden IS 'Whether the client is hidden from the main list';
