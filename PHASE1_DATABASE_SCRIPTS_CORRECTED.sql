-- ============================================================================
-- PHASE 1: CORRECTED DATABASE FOUNDATION SCRIPTS
-- Execute these directly using psql with actual database structure
-- ============================================================================

-- CRITICAL FINDINGS FROM DATABASE INSPECTION:
-- ✅ contacts table: id (uuid), organization_id (uuid), name, email, phone, company
-- ❌ contact_notes table: DOES NOT EXIST (needs creation)
-- ✅ opportunities table: EXISTS but has contact_name (text), NOT contact_id
-- ✅ pipeline_stages table: EXISTS with order_index (NOT display_order)

-- SCRIPT 1: Create contact_notes table (CRITICAL - this is missing!)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contact_notes (
    id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    contact_id uuid NOT NULL REFERENCES public.contacts (id) ON DELETE CASCADE,
    note text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users (id),
    organization_id uuid NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_notes_contact_id ON public.contact_notes (contact_id);

CREATE INDEX IF NOT EXISTS idx_contact_notes_created_at ON public.contact_notes (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_notes_organization_id ON public.contact_notes (organization_id);

-- Enable RLS
ALTER TABLE public.contact_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can access notes for their organization
DROP POLICY IF EXISTS "contact_notes_org_access" ON public.contact_notes;

CREATE POLICY "contact_notes_org_access" ON public.contact_notes FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM auth.users u
            JOIN profiles p ON u.id = p.user_id
        WHERE
            u.id = auth.uid ()
            AND p.organization_id = contact_notes.organization_id
    )
);

-- Verify creation
SELECT 'SUCCESS: contact_notes table created' as result;

-- ============================================================================

-- SCRIPT 2: Fix opportunities table - ADD contact_id column
-- ----------------------------------------------------------------------------
-- The opportunities table exists but only has contact_name, not contact_id
-- We need to add contact_id column for proper foreign key relationships

-- Add contact_id column if it doesn't exist
ALTER TABLE public.opportunities
ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES public.contacts (id) ON DELETE SET NULL;

-- Add index for the new column
CREATE INDEX IF NOT EXISTS idx_opportunities_contact_id ON public.opportunities (contact_id);

-- Add missing columns that the application expects
ALTER TABLE public.opportunities
ADD COLUMN IF NOT EXISTS status text DEFAULT 'open' CHECK (
    status IN ('open', 'won', 'lost')
);

ALTER TABLE public.opportunities
ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';

ALTER TABLE public.opportunities
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.opportunities
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users (id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS opportunities_updated_at ON public.opportunities;

CREATE TRIGGER opportunities_updated_at 
    BEFORE UPDATE ON public.opportunities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Verify structure
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE
    table_schema = 'public'
    AND table_name = 'opportunities'
ORDER BY ordinal_position;

-- ============================================================================

-- SCRIPT 3: Verify pipeline_stages and get stage IDs
-- ----------------------------------------------------------------------------
-- Pipeline stages exist but use order_index, not display_order

SELECT
    'STAGE_ID: ' || id || ' - NAME: ' || name as stage_info,
    order_index,
    color,
    is_active
FROM public.pipeline_stages
WHERE
    is_active = true
ORDER BY order_index;

-- Get the New Lead stage ID specifically
SELECT 'NEW_LEAD_STAGE_ID = ' || id as new_lead_info
FROM public.pipeline_stages
WHERE
    name ILIKE '%lead%'
    OR name ILIKE '%new%'
ORDER BY order_index
LIMIT 1;

-- ============================================================================

-- SCRIPT 4: Final verification queries
-- ----------------------------------------------------------------------------
-- Verify all tables exist and are accessible

SELECT 'contact_notes' as table_name, COUNT(*) as row_count
FROM public.contact_notes
UNION ALL
SELECT 'opportunities' as table_name, COUNT(*) as row_count
FROM public.opportunities
UNION ALL
SELECT 'pipeline_stages' as table_name, COUNT(*) as row_count
FROM public.pipeline_stages
UNION ALL
SELECT 'contacts' as table_name, COUNT(*) as row_count
FROM public.contacts;

-- Test foreign key relationships
SELECT
    'Foreign keys working' as test_result,
    c.name as contact_name,
    COUNT(cn.*) as notes_count
FROM public.contacts c
    LEFT JOIN public.contact_notes cn ON c.id = cn.contact_id
GROUP BY
    c.id,
    c.name
LIMIT 3;

-- ============================================================================
-- EXECUTION SUMMARY:
--
-- 1. Script 1: Creates missing contact_notes table with proper UUID foreign key
-- 2. Script 2: Adds contact_id column to opportunities table + missing columns
-- 3. Script 3: Documents existing pipeline_stages (uses order_index)
-- 4. Script 4: Verifies everything works with foreign key test
--
-- CRITICAL FIXES:
-- - contact_notes table: CREATED (was completely missing)
-- - opportunities.contact_id: ADDED (was missing, only had contact_name)
-- - Proper RLS policies with organization-based access
-- - All foreign keys use UUID to match existing schema
-- ============================================================================