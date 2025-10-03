-- =====================================================
-- Add window_end column to api_rate_limits table
-- =====================================================
-- This migration adds the window_end computed column to api_rate_limits
-- if it doesn't already exist. The window_end is calculated as
-- window_start + window_duration_minutes.
--
-- This ensures compatibility with Phase 3 performance indexes
-- that reference window_end for query optimization.
-- =====================================================

-- Add window_end column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'api_rate_limits'
    AND column_name = 'window_end'
  ) THEN
    -- Add the computed column
    ALTER TABLE api_rate_limits
      ADD COLUMN window_end TIMESTAMPTZ 
      GENERATED ALWAYS AS (window_start + (window_duration_minutes || ' minutes')::INTERVAL) STORED;
    
    RAISE NOTICE 'Added window_end column to api_rate_limits table';
  ELSE
    RAISE NOTICE 'window_end column already exists in api_rate_limits table';
  END IF;
END $$;

-- Comment on the new column
COMMENT ON COLUMN api_rate_limits.window_end IS 
  'Computed end time of the rate limit window (window_start + window_duration_minutes)';
