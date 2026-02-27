-- Update returns table to add new fields for enhanced return system
ALTER TABLE returns ADD COLUMN IF NOT EXISTS order_item_id uuid REFERENCES order_items(id) ON DELETE CASCADE;
ALTER TABLE returns ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';
ALTER TABLE returns ADD COLUMN IF NOT EXISTS return_type text DEFAULT 'refund' CHECK (return_type IN ('exchange', 'refund'));
ALTER TABLE returns ADD COLUMN IF NOT EXISTS previous_return_id uuid REFERENCES returns(id) ON DELETE SET NULL;

-- Add comment for clarity
COMMENT ON COLUMN returns.return_type IS 'First return is exchange, second return is refund';
COMMENT ON COLUMN returns.previous_return_id IS 'Links to previous return if this is a second return (refund after exchange)';
COMMENT ON COLUMN returns.images IS 'Array of image URLs uploaded by user for return proof';

-- Create index for order_item_id
CREATE INDEX IF NOT EXISTS idx_returns_order_item ON returns(order_item_id);
