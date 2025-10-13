-- =============================================
-- CALENDAR EVENTS SYSTEM - ENTERPRISE SCHEMA
-- =============================================
-- Created: 2025-10-13
-- Purpose: Complete calendar/events foundation with enterprise scalability
-- Requirements: 10k+ events, sub-100ms queries, recurring events, multi-timezone

-- =============================================
-- MAIN EVENTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Ownership & Organization
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,

    -- Event Core Data
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    location_type TEXT CHECK (location_type IN ('physical', 'virtual', 'phone', 'other')),
    meeting_url TEXT,

    -- Event Type & Classification
    event_type TEXT NOT NULL DEFAULT 'meeting' CHECK (event_type IN (
        'meeting', 'call', 'task', 'deadline', 'reminder',
        'appointment', 'demo', 'follow_up', 'other'
    )),

    -- Timing (ALL times stored in UTC)
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    all_day BOOLEAN DEFAULT false,
    timezone TEXT DEFAULT 'Europe/Rome', -- User's display timezone

    -- Status & Priority
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
        'scheduled', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled'
    )),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN (
        'low', 'medium', 'high', 'urgent'
    )),

    -- Visual Customization
    color TEXT, -- Hex color code for calendar display

    -- Recurrence System
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule TEXT, -- RRULE format (RFC 5545)
    recurrence_end_date TIMESTAMPTZ,
    parent_event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    occurrence_date TIMESTAMPTZ, -- For recurring instances

    -- Linked Entities
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
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

    -- Data Integrity Constraints
    CONSTRAINT valid_time_range CHECK (end_time > start_time OR all_day = true),
    CONSTRAINT valid_recurrence CHECK (
        (is_recurring = false AND recurrence_rule IS NULL) OR
        (is_recurring = true AND recurrence_rule IS NOT NULL)
    )
);

-- =============================================
-- EVENT PARTICIPANTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS event_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relations
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

    -- Participant Identity (can be user, contact, or external)
    participant_type TEXT NOT NULL CHECK (participant_type IN ('user', 'contact', 'external')),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,

    -- External participant (not in system)
    external_name TEXT,
    external_email TEXT,

    -- Participation Details
    role TEXT DEFAULT 'attendee' CHECK (role IN ('organizer', 'required', 'optional', 'attendee')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'tentative', 'no_response')),

    -- Response Tracking
    responded_at TIMESTAMPTZ,
    response_note TEXT,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure participant has valid identity
    CONSTRAINT participant_identity CHECK (
        (participant_type = 'user' AND user_id IS NOT NULL) OR
        (participant_type = 'contact' AND contact_id IS NOT NULL) OR
        (participant_type = 'external' AND external_email IS NOT NULL)
    )
);

-- =============================================
-- EVENT REMINDERS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS event_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relations
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Reminder Timing
    remind_at TIMESTAMPTZ NOT NULL,
    minutes_before INTEGER NOT NULL, -- Minutes before event

    -- Delivery Method
    delivery_method TEXT NOT NULL CHECK (delivery_method IN ('email', 'push', 'sms', 'in_app')),

    -- Status
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'failed', 'cancelled')),
    sent_at TIMESTAMPTZ,
    error_message TEXT,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PERFORMANCE INDEXES
-- =============================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_events_org_time_range ON events(organization_id, start_time, end_time)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by, start_time DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_events_contact ON events(contact_id, start_time DESC)
    WHERE contact_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_events_type_status ON events(event_type, status)
    WHERE deleted_at IS NULL;

-- Recurring events indexes
CREATE INDEX IF NOT EXISTS idx_events_recurring ON events(parent_event_id, occurrence_date)
    WHERE parent_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_recurrence_end ON events(recurrence_end_date)
    WHERE is_recurring = true;

-- Date-based indexes for common queries
CREATE INDEX IF NOT EXISTS idx_events_date ON events(DATE(start_time AT TIME ZONE 'UTC'))
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_events_upcoming ON events(start_time)
    WHERE start_time >= NOW() AND deleted_at IS NULL;

-- Participant indexes
CREATE INDEX IF NOT EXISTS idx_participants_event ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON event_participants(user_id)
    WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_participants_contact ON event_participants(contact_id)
    WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_participants_status ON event_participants(event_id, status);

-- Reminder indexes
CREATE INDEX IF NOT EXISTS idx_reminders_pending ON event_reminders(remind_at, status)
    WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_reminders_event ON event_reminders(event_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user ON event_reminders(user_id);

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_events_search ON events USING gin(
    to_tsvector('italian',
        coalesce(title, '') || ' ' ||
        coalesce(description, '') || ' ' ||
        coalesce(location, '') || ' ' ||
        coalesce(notes, '')
    )
) WHERE deleted_at IS NULL;

-- =============================================
-- UNIQUENESS CONSTRAINTS
-- =============================================

-- Prevent duplicate participants
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_participant
    ON event_participants(event_id, user_id)
    WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_contact_participant
    ON event_participants(event_id, contact_id)
    WHERE contact_id IS NOT NULL;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function: Get events for date range with participants
CREATE OR REPLACE FUNCTION get_calendar_events(
    p_organization_id UUID,
    p_user_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_include_participants BOOLEAN DEFAULT true
)
RETURNS TABLE (
    event_id UUID,
    title TEXT,
    description TEXT,
    event_type TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    all_day BOOLEAN,
    status TEXT,
    priority TEXT,
    color TEXT,
    location TEXT,
    contact_name TEXT,
    participant_count BIGINT,
    is_organizer BOOLEAN,
    participants JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.title,
        e.description,
        e.event_type,
        e.start_time,
        e.end_time,
        e.all_day,
        e.status,
        e.priority,
        e.color,
        e.location,
        c.name as contact_name,
        (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id) as participant_count,
        e.created_by = p_user_id as is_organizer,
        CASE
            WHEN p_include_participants THEN
                (SELECT jsonb_agg(jsonb_build_object(
                    'id', ep.id,
                    'type', ep.participant_type,
                    'name', COALESCE(u.full_name, ct.name, ep.external_name),
                    'email', COALESCE(u.email, ct.email, ep.external_email),
                    'role', ep.role,
                    'status', ep.status
                ))
                FROM event_participants ep
                LEFT JOIN profiles u ON u.id = ep.user_id
                LEFT JOIN contacts ct ON ct.id = ep.contact_id
                WHERE ep.event_id = e.id)
            ELSE NULL
        END as participants
    FROM events e
    LEFT JOIN contacts c ON c.id = e.contact_id
    WHERE e.organization_id = p_organization_id
        AND e.deleted_at IS NULL
        AND (
            -- Event overlaps with date range
            (e.start_time BETWEEN p_start_date AND p_end_date) OR
            (e.end_time BETWEEN p_start_date AND p_end_date) OR
            (e.start_time <= p_start_date AND e.end_time >= p_end_date)
        )
        -- User is organizer or participant
        AND (
            e.created_by = p_user_id OR
            EXISTS (
                SELECT 1 FROM event_participants ep
                WHERE ep.event_id = e.id AND ep.user_id = p_user_id
            )
        )
    ORDER BY e.start_time ASC, e.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Check for scheduling conflicts
CREATE OR REPLACE FUNCTION check_event_conflicts(
    p_organization_id UUID,
    p_user_id UUID,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ,
    p_exclude_event_id UUID DEFAULT NULL
)
RETURNS TABLE (
    conflict_event_id UUID,
    conflict_title TEXT,
    conflict_start TIMESTAMPTZ,
    conflict_end TIMESTAMPTZ,
    conflict_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.title,
        e.start_time,
        e.end_time,
        e.event_type
    FROM events e
    WHERE e.organization_id = p_organization_id
        AND e.deleted_at IS NULL
        AND e.status NOT IN ('cancelled', 'completed')
        AND (p_exclude_event_id IS NULL OR e.id != p_exclude_event_id)
        AND (
            -- User is organizer or required participant
            e.created_by = p_user_id OR
            EXISTS (
                SELECT 1 FROM event_participants ep
                WHERE ep.event_id = e.id 
                    AND ep.user_id = p_user_id
                    AND ep.role IN ('organizer', 'required')
            )
        )
        -- Time overlap check
        AND (e.start_time, e.end_time) OVERLAPS (p_start_time, p_end_time)
    ORDER BY e.start_time ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Generate recurring event instances
CREATE OR REPLACE FUNCTION generate_recurring_instances(
    p_event_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_max_instances INTEGER DEFAULT 100
)
RETURNS TABLE (
    instance_date TIMESTAMPTZ,
    instance_end_time TIMESTAMPTZ
) AS $$
DECLARE
    v_event RECORD;
    v_duration INTERVAL;
    v_current_date TIMESTAMPTZ;
    v_instance_count INTEGER := 0;
BEGIN
    -- Get event details
    SELECT * INTO v_event FROM events WHERE id = p_event_id;
    
    IF NOT v_event.is_recurring THEN
        RETURN;
    END IF;
    
    -- Calculate event duration
    v_duration := v_event.end_time - v_event.start_time;
    v_current_date := v_event.start_time;
    
    -- Simple daily/weekly recurrence (enhance with RRULE parser later)
    -- This is a placeholder - full RRULE parsing would go here
    WHILE v_current_date <= COALESCE(v_event.recurrence_end_date, p_end_date) 
          AND v_instance_count < p_max_instances LOOP
        
        IF v_current_date >= p_start_date THEN
            instance_date := v_current_date;
            instance_end_time := v_current_date + v_duration;
            RETURN NEXT;
            v_instance_count := v_instance_count + 1;
        END IF;
        
        -- Increment by 1 day (simplified - would parse RRULE in production)
        v_current_date := v_current_date + INTERVAL '1 day';
    END LOOP;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Users can view organization events" ON events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.organization_id = events.organization_id
        )
    );

CREATE POLICY "Users can create events in their organization" ON events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.organization_id = events.organization_id
        )
    );

CREATE POLICY "Users can update their events or organization events" ON events
    FOR UPDATE USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.organization_id = events.organization_id
            AND p.role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Users can delete their events" ON events
    FOR DELETE USING (created_by = auth.uid());

-- Event participants policies
CREATE POLICY "Users can view participants of accessible events" ON event_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events e
            JOIN profiles p ON p.organization_id = e.organization_id
            WHERE e.id = event_participants.event_id
            AND p.id = auth.uid()
        )
    );

CREATE POLICY "Users can manage participants of their events" ON event_participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = event_participants.event_id
            AND e.created_by = auth.uid()
        )
    );

-- Event reminders policies
CREATE POLICY "Users can manage their own reminders" ON event_reminders
    FOR ALL USING (user_id = auth.uid());

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

-- Update timestamp trigger for events
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_participants_updated_at 
    BEFORE UPDATE ON event_participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- INITIAL DATA AND COMMENTS
-- =============================================

COMMENT ON TABLE events IS 'Main calendar events table supporting single and recurring events with multi-participant capability';
COMMENT ON TABLE event_participants IS 'Event participants including users, contacts, and external participants';
COMMENT ON TABLE event_reminders IS 'Event reminder system with multiple delivery methods';

COMMENT ON FUNCTION get_calendar_events IS 'Primary function for retrieving calendar events with participants for a date range';
COMMENT ON FUNCTION check_event_conflicts IS 'Detects scheduling conflicts for a user in a given time slot';
COMMENT ON FUNCTION generate_recurring_instances IS 'Generates instances of recurring events (placeholder for full RRULE support)';