-- Create contact_notes table for enhanced contact detail functionality
-- This supports the world-class 360° contact view

CREATE TABLE IF NOT EXISTS contact_notes (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    contact_id UUID NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        created_by UUID REFERENCES auth.users (id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_notes_contact_id ON contact_notes (contact_id);

CREATE INDEX IF NOT EXISTS idx_contact_notes_created_at ON contact_notes (created_at DESC);

-- Enable Row Level Security
ALTER TABLE contact_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contact_notes
DROP POLICY IF EXISTS "Users can view notes for their organization's contacts" ON contact_notes;

CREATE POLICY "Users can view notes for their organization's contacts" ON contact_notes FOR
SELECT TO public USING (
        EXISTS (
            SELECT 1
            FROM contacts c
            WHERE
                c.id = contact_notes.contact_id
                AND c.organization_id = (
                    SELECT organization_id
                    FROM profiles
                    WHERE
                        id = auth.uid ()
                )
        )
    );

DROP POLICY IF EXISTS "Users can create notes for their organization's contacts" ON contact_notes;

CREATE POLICY "Users can create notes for their organization's contacts" ON contact_notes FOR
INSERT
    TO public
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM contacts c
            WHERE
                c.id = contact_notes.contact_id
                AND c.organization_id = (
                    SELECT organization_id
                    FROM profiles
                    WHERE
                        id = auth.uid ()
                )
        )
    );

DROP POLICY IF EXISTS "Users can update their own notes" ON contact_notes;

CREATE POLICY "Users can update their own notes" ON contact_notes FOR
UPDATE TO public USING (created_by = auth.uid ());

DROP POLICY IF EXISTS "Users can delete their own notes" ON contact_notes;

CREATE POLICY "Users can delete their own notes" ON contact_notes FOR DELETE TO public USING (created_by = auth.uid ());

-- Update trigger for updated_at
DROP TRIGGER IF EXISTS update_contact_notes_updated_at ON contact_notes;

DROP FUNCTION IF EXISTS update_contact_notes_updated_at ();

CREATE OR REPLACE FUNCTION update_contact_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contact_notes_updated_at
    BEFORE UPDATE ON contact_notes
    FOR EACH ROW EXECUTE FUNCTION update_contact_notes_updated_at();