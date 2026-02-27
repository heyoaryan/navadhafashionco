-- Create blacklist table for customers and areas
CREATE TABLE IF NOT EXISTS blacklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('customer', 'area')),
  entity_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  area_pincode text,
  area_city text,
  area_state text,
  reason text NOT NULL,
  blacklisted_by uuid REFERENCES profiles(id),
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraint to ensure either entity_id or area fields are provided
ALTER TABLE blacklist ADD CONSTRAINT blacklist_entity_check 
  CHECK (
    (entity_type = 'customer' AND entity_id IS NOT NULL) OR
    (entity_type = 'area' AND (area_pincode IS NOT NULL OR area_city IS NOT NULL))
  );

-- Create indexes for better query performance
CREATE INDEX idx_blacklist_entity_type ON blacklist(entity_type);
CREATE INDEX idx_blacklist_entity_id ON blacklist(entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX idx_blacklist_area ON blacklist(area_pincode, area_city, area_state) WHERE entity_type = 'area';
CREATE INDEX idx_blacklist_active ON blacklist(is_active);

-- Add return count tracking to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS return_count integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_returns_value numeric(10,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_blacklisted boolean DEFAULT false;

-- Function to update return statistics
CREATE OR REPLACE FUNCTION update_customer_return_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE profiles
    SET 
      return_count = (
        SELECT COUNT(*) 
        FROM returns 
        WHERE user_id = NEW.user_id
      ),
      total_returns_value = (
        SELECT COALESCE(SUM(refund_amount), 0)
        FROM returns 
        WHERE user_id = NEW.user_id AND status IN ('refunded', 'completed')
      )
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for return stats
DROP TRIGGER IF EXISTS trigger_update_return_stats ON returns;
CREATE TRIGGER trigger_update_return_stats
  AFTER INSERT OR UPDATE ON returns
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_return_stats();

-- Function to check if customer or area is blacklisted
CREATE OR REPLACE FUNCTION is_blacklisted(
  p_user_id uuid DEFAULT NULL,
  p_pincode text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_state text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  v_blacklisted boolean := false;
BEGIN
  -- Check customer blacklist
  IF p_user_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM blacklist 
      WHERE entity_type = 'customer' 
        AND entity_id = p_user_id 
        AND is_active = true
    ) INTO v_blacklisted;
    
    IF v_blacklisted THEN
      RETURN true;
    END IF;
  END IF;
  
  -- Check area blacklist
  IF p_pincode IS NOT NULL OR p_city IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM blacklist 
      WHERE entity_type = 'area' 
        AND is_active = true
        AND (
          (area_pincode = p_pincode) OR
          (area_city = p_city AND area_state = p_state)
        )
    ) INTO v_blacklisted;
  END IF;
  
  RETURN v_blacklisted;
END;
$$ LANGUAGE plpgsql;

-- Update existing profiles with return counts
UPDATE profiles p
SET 
  return_count = (SELECT COUNT(*) FROM returns WHERE user_id = p.id),
  total_returns_value = (
    SELECT COALESCE(SUM(refund_amount), 0)
    FROM returns 
    WHERE user_id = p.id AND status IN ('refunded', 'completed')
  );

-- RLS Policies for blacklist table
ALTER TABLE blacklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all blacklist entries"
  ON blacklist FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert blacklist entries"
  ON blacklist FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update blacklist entries"
  ON blacklist FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Comments for documentation
COMMENT ON TABLE blacklist IS 'Stores blacklisted customers and areas based on return patterns';
COMMENT ON COLUMN blacklist.entity_type IS 'Type of entity: customer or area';
COMMENT ON COLUMN blacklist.entity_id IS 'User ID if blacklisting a customer';
COMMENT ON COLUMN blacklist.area_pincode IS 'Pincode if blacklisting an area';
COMMENT ON COLUMN blacklist.reason IS 'Reason for blacklisting (e.g., excessive returns, fraud)';
COMMENT ON FUNCTION is_blacklisted IS 'Check if a customer or area is blacklisted';
