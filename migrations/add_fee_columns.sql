-- Migration: Add fee and net_value columns to orders table
-- This allows us to persist the calculated fee and net value when payment is confirmed

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS fee NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_value NUMERIC(10, 2) DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN orders.fee IS 'Payment method fee/tax amount deducted from order value';
COMMENT ON COLUMN orders.net_value IS 'Net amount received after fee deduction';
