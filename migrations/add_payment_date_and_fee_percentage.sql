-- Migration: Add payment_date and fee_percentage to orders table
-- This ensures we store when payment was made and what fee was applied

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS fee_percentage NUMERIC(5, 2) DEFAULT 0;

-- Add index for better query performance on payment_date
CREATE INDEX IF NOT EXISTS idx_orders_payment_date ON orders(payment_date);

-- Add comments for documentation
COMMENT ON COLUMN orders.payment_date IS 'Date and time when payment was confirmed';
COMMENT ON COLUMN orders.fee_percentage IS 'Fee percentage applied at time of payment (e.g., 3.5 for 3.5%)';
