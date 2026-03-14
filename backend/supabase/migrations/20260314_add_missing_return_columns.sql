-- Add missing columns to returns table
ALTER TABLE returns ADD COLUMN IF NOT EXISTS order_item_id uuid REFERENCES order_items(id) ON DELETE CASCADE;
ALTER TABLE returns ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';
ALTER TABLE returns ADD COLUMN IF NOT EXISTS return_type text DEFAULT 'exchange' CHECK (return_type IN ('exchange', 'refund'));
ALTER TABLE returns ADD COLUMN IF NOT EXISTS previous_return_id uuid REFERENCES returns(id) ON DELETE SET NULL;

-- Fix existing returns: set return_type = 'exchange' for all first-time returns
UPDATE returns SET return_type = 'exchange'
WHERE previous_return_id IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_returns_order_item ON returns(order_item_id);
