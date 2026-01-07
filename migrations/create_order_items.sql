-- Migration: Create order_items table for multiple services per order
-- This allows customers to have multiple services in a single order
-- Example: "Lavar 5kg" + "Lavar e Passar 3kg" in the same order

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id),
    service_name TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 0,
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Add comments for documentation
COMMENT ON TABLE order_items IS 'Line items for orders - allows multiple services per order';
COMMENT ON COLUMN order_items.order_id IS 'Foreign key to orders table';
COMMENT ON COLUMN order_items.service_id IS 'Foreign key to services table (nullable for custom services)';
COMMENT ON COLUMN order_items.service_name IS 'Service name at time of order (persisted for history)';
COMMENT ON COLUMN order_items.quantity IS 'Quantity (e.g., kg, units)';
COMMENT ON COLUMN order_items.unit_price IS 'Price per unit at time of order';
COMMENT ON COLUMN order_items.subtotal IS 'Calculated: quantity * unit_price';

-- Migrate existing orders to order_items
-- This creates one order_item for each existing order
INSERT INTO order_items (order_id, service_name, quantity, unit_price, subtotal)
SELECT 
    id,
    COALESCE(service_type, 'Serviço'),
    1 as quantity,
    value as unit_price,
    value as subtotal
FROM orders
WHERE NOT EXISTS (
    SELECT 1 FROM order_items WHERE order_items.order_id = orders.id
);

-- Note: We keep the old 'service' and 'quantity' columns in orders table
-- for backward compatibility. New orders will use order_items exclusively.
