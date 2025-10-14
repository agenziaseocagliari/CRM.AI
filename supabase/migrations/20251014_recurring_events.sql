-- Add recurring events support to events table
-- Migration: Add recurrence columns
-- Date: 2025-10-14

-- Add recurrence columns to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS rrule TEXT,
ADD COLUMN IF NOT EXISTS recurrence_id TEXT,
ADD COLUMN IF NOT EXISTS original_start_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_exception BOOLEAN DEFAULT FALSE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_recurrence_id ON events(recurrence_id);
CREATE INDEX IF NOT EXISTS idx_events_is_recurring ON events(is_recurring);
CREATE INDEX IF NOT EXISTS idx_events_original_start_time ON events(original_start_time);

-- Add column comments for documentation
COMMENT ON COLUMN events.is_recurring IS 'Whether this is a recurring event';
COMMENT ON COLUMN events.rrule IS 'RRULE string (RFC 5545 format)';
COMMENT ON COLUMN events.recurrence_id IS 'Parent event ID for recurring instances';
COMMENT ON COLUMN events.original_start_time IS 'Original start time for this occurrence';
COMMENT ON COLUMN events.is_exception IS 'Whether this occurrence is an exception (modified/deleted)';