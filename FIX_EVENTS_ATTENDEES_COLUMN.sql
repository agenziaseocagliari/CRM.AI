-- =============================================
-- FIX: Add attendees column to events table
-- =============================================
--
-- ISSUE: ContactDetailModal queries events.attendees but column doesn't exist
-- ERROR: 400 Bad Request when querying .contains('attendees', [email])
--
-- SOLUTION: Add attendees text[] column for backwards compatibility
--
-- NOTE: This provides a simple array column that works with .contains()
--       The event_participants table is the proper relational approach,
--       but this column allows quick filtering by email without joins.
--
-- =============================================

-- Add attendees column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND column_name = 'attendees'
    ) THEN
        ALTER TABLE events ADD COLUMN attendees TEXT[];
        RAISE NOTICE '✅ Added attendees column to events table';
    ELSE
        RAISE NOTICE '⚠️ attendees column already exists';
    END IF;
END $$;

-- Add index for performance on attendees queries
CREATE INDEX IF NOT EXISTS idx_events_attendees ON events USING GIN (attendees);

-- Add comment
COMMENT ON COLUMN events.attendees IS 'Array of attendee email addresses. Simplified alternative to event_participants join. Use .contains() for queries.';

-- =============================================
-- VERIFICATION QUERY
-- =============================================
-- Run this to verify the column was added:
--
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'events'
-- AND column_name = 'attendees';
--
-- Expected output:
-- column_name | data_type | is_nullable
-- attendees   | ARRAY     | YES
-- =============================================

RAISE NOTICE '✅ Events attendees column migration complete';