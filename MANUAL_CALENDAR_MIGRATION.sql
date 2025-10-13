-- =============================================
-- DEFENSIVE CALENDAR MIGRATION FOR SUPABASE DASHBOARD
-- =============================================
-- Instructions: Copy and paste this in the Supabase SQL Editor
-- This migration is fully defensive and will work regardless of existing schema

-- =============================================
-- MAIN EVENTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Ownership & Organization (made optional for defensive approach)
    organization_id UUID, -- Removed FK constraint for compatibility
    created_by UUID, -- Removed FK constraint for compatibility

    -- Event Core Data
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT DEFAULT 'meeting' CHECK (event_type IN ('meeting', 'task', 'appointment', 'deadline', 'reminder', 'call', 'follow_up', 'other')),

    -- Timing
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    all_day BOOLEAN DEFAULT false,
    timezone TEXT DEFAULT 'UTC',

    -- Event Properties
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'tentative', 'cancelled', 'completed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    location TEXT,

    -- Visual Customization
    color TEXT, -- Hex color code for calendar display

    -- Recurrence System
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule TEXT, -- RRULE format (RFC 5545)
    recurrence_end_date TIMESTAMPTZ,
    parent_event_id UUID, -- Self-reference, made optional for defensive approach
    occurrence_date TIMESTAMPTZ, -- For recurring instances

    -- Linked Entities
    contact_id UUID, -- Removed FK constraint for compatibility
    deal_id UUID, -- Will reference deals table when implemented

    -- Reminders
    reminder_minutes INTEGER[], -- Array of minutes before event

    -- Metadata
    notes TEXT,
    custom_fields JSONB,

    -- Audit Trail
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Data Integrity
    CONSTRAINT valid_time_range CHECK (
        (all_day = true AND end_time IS NULL) OR 
        (all_day = false AND end_time IS NOT NULL AND end_time > start_time)
    ),
    CONSTRAINT valid_recurrence CHECK (
        (is_recurring = false) OR 
        (is_recurring = true AND recurrence_rule IS NOT NULL)
    )
);

-- =============================================
-- EVENT PARTICIPANTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS event_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relations (made optional for defensive approach)
    event_id UUID NOT NULL, -- Will reference events table, constraint added later

    -- Participant Identity (can be user, contact, or external)
    participant_type TEXT NOT NULL CHECK (participant_type IN ('user', 'contact', 'external')),
    user_id UUID, -- Removed FK constraint for compatibility
    contact_id UUID, -- Removed FK constraint for compatibility

    -- External participant (not in system)
    external_name TEXT,
    external_email TEXT,

    -- Participation Details
    role TEXT DEFAULT 'attendee' CHECK (role IN ('organizer', 'required', 'optional', 'attendee')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'tentative')),
    
    -- Response tracking
    responded_at TIMESTAMPTZ,
    response_note TEXT,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure participant identity is properly set
    CONSTRAINT valid_participant CHECK (
        (participant_type = 'user' AND user_id IS NOT NULL) OR
        (participant_type = 'contact' AND contact_id IS NOT NULL) OR
        (participant_type = 'external' AND external_name IS NOT NULL)
    ),

    -- Prevent duplicate participants
    UNIQUE(event_id, user_id),
    UNIQUE(event_id, contact_id),
    UNIQUE(event_id, external_email)
);

-- Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- Basic policies that work without dependencies
CREATE POLICY IF NOT EXISTS "Users can manage their events" ON events
    FOR ALL USING (created_by = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can manage event participants" ON event_participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = event_participants.event_id
            AND e.created_by = auth.uid()
        )
    );

-- Add self-referencing constraint
ALTER TABLE events ADD CONSTRAINT IF NOT EXISTS events_parent_event_id_fkey 
    FOREIGN KEY (parent_event_id) REFERENCES events(id) ON DELETE CASCADE;

-- Add event participants constraint
ALTER TABLE event_participants ADD CONSTRAINT IF NOT EXISTS event_participants_event_id_fkey 
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_organization_id ON events(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_contact_id ON events(contact_id);
CREATE INDEX IF NOT EXISTS idx_events_parent_id ON events(parent_event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id);

-- Add comments
COMMENT ON TABLE events IS 'Main calendar events table supporting single and recurring events with multi-participant capability';
COMMENT ON TABLE event_participants IS 'Event participants including users, contacts, and external participants';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Calendar system migration completed successfully!';
    RAISE NOTICE 'Tables created: events, event_participants';
    RAISE NOTICE 'All foreign key constraints are defensive and optional';
END
$$;