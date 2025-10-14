-- ============================================================================
-- PHASE 1: DATABASE FOUNDATION SCRIPTS
-- Execute these in Supabase Dashboard -> SQL Editor
-- ============================================================================

-- SCRIPT 1: Create contact_notes table (CRITICAL - this is missing!)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contact_notes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    note text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_notes_contact_id ON public.contact_notes(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_notes_created_at ON public.contact_notes(created_at DESC);

-- Enable RLS (simple policy for MVP)
ALTER TABLE public.contact_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can do everything (simplify for now)
DROP POLICY IF EXISTS "contact_notes_all_authenticated" ON public.contact_notes;
CREATE POLICY "contact_notes_all_authenticated"
ON public.contact_notes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Verify creation
SELECT 'SUCCESS: contact_notes table created' as result;

-- ============================================================================

-- SCRIPT 2: Ensure opportunities table exists with correct structure
-- ----------------------------------------------------------------------------
-- First check if opportunities table exists, if not create it
CREATE TABLE IF NOT EXISTS public.opportunities (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_name text NOT NULL,
    contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
    value decimal(12,2) DEFAULT 0,
    stage text NOT NULL DEFAULT 'New Lead',
    assigned_to text,
    close_date date,
    organization_id uuid,
    status text DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost')),
    source text DEFAULT 'manual',
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON public.opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_opportunities_contact_id ON public.opportunities(contact_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON public.opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_created_at ON public.opportunities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_organization_id ON public.opportunities(organization_id);

-- Enable RLS
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- Simple policy for MVP
DROP POLICY IF EXISTS "opportunities_all_authenticated" ON public.opportunities;
CREATE POLICY "opportunities_all_authenticated"
ON public.opportunities
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Updated_at trigger
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

SELECT 'SUCCESS: opportunities table ready' as result;

-- ============================================================================

-- SCRIPT 3: Ensure pipeline_stages exist
-- ----------------------------------------------------------------------------
-- Create pipeline_stages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text UNIQUE NOT NULL,
    display_order integer NOT NULL,
    color text DEFAULT '#3B82F6',
    organization_id uuid
);

-- Insert default stages (only if they don't exist)
INSERT INTO public.pipeline_stages (name, display_order, color) VALUES 
    ('New Lead', 1, '#3B82F6'),
    ('Contacted', 2, '#8B5CF6'), 
    ('Proposal Sent', 3, '#F59E0B'),
    ('Won', 4, '#10B981'),
    ('Lost', 5, '#EF4444')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

-- Simple policy
DROP POLICY IF EXISTS "pipeline_stages_read_authenticated" ON public.pipeline_stages;
CREATE POLICY "pipeline_stages_read_authenticated"
ON public.pipeline_stages
FOR SELECT
TO authenticated
USING (true);

-- Show the stages and their IDs (IMPORTANT - document these!)
SELECT 
    'STAGE_ID: ' || id || ' - NAME: ' || name as stage_info,
    display_order,
    color
FROM public.pipeline_stages 
ORDER BY display_order;

-- ============================================================================

-- SCRIPT 4: Verification queries
-- ----------------------------------------------------------------------------
-- Check that everything was created correctly

-- Count tables
SELECT 
    'contact_notes' as table_name,
    COUNT(*) as row_count,
    'Table exists and accessible' as status
FROM public.contact_notes
UNION ALL
SELECT 
    'opportunities' as table_name,
    COUNT(*) as row_count,
    'Table exists and accessible' as status
FROM public.opportunities
UNION ALL
SELECT 
    'pipeline_stages' as table_name,
    COUNT(*) as row_count,
    'Table exists and accessible' as status
FROM public.pipeline_stages;

-- Show pipeline stage IDs (COPY THESE TO PHASE0_DISCOVERY_RESULTS.md)
SELECT 
    'NEW_LEAD_ID = ' || id as new_lead_info
FROM public.pipeline_stages 
WHERE name = 'New Lead';

-- ============================================================================
-- EXECUTION INSTRUCTIONS:
-- 
-- 1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi
-- 2. Click "SQL Editor" (left sidebar)
-- 3. Click "New Query"
-- 4. Copy and paste each SCRIPT section (1-4) ONE AT A TIME
-- 5. Click "Run" after each script
-- 6. DOCUMENT the "NEW_LEAD_ID" output from Script 4
-- 7. Verify all tables show "Table exists and accessible"
--
-- Expected results:
-- - Script 1: "SUCCESS: contact_notes table created"
-- - Script 2: "SUCCESS: opportunities table ready" 
-- - Script 3: List of stages with IDs
-- - Script 4: All tables accessible + NEW_LEAD_ID
-- ============================================================================