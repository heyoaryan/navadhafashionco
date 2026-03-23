-- Add payment_id column to orders table to store Razorpay payment ID
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id TEXT;
