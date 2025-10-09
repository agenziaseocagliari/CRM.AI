-- ============================================================================
-- 🗄️ FORMMASTER LEVEL 5 - DATABASE SETUP FINALE
-- ============================================================================
-- Copy questo SQL intero in Supabase Studio > SQL Editor
-- Clicca "Run" per eseguire tutto insieme

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (clean setup)
DROP TABLE IF EXISTS public.form_submissions CASCADE;
DROP TABLE IF EXISTS public.forms CASCADE;

-- Create forms table
CREATE TABLE public.forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    name TEXT NOT NULL UNIQUE,
    fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    organization_id UUID NOT NULL,
    user_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create form_submissions table
CREATE TABLE public.form_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'processed', 'archived'))
);

-- Create performance indexes
CREATE INDEX idx_forms_organization_id ON public.forms(organization_id);
CREATE INDEX idx_forms_name ON public.forms(name);
CREATE INDEX idx_forms_created_at ON public.forms(created_at);
CREATE INDEX idx_form_submissions_form_id ON public.form_submissions(form_id);
CREATE INDEX idx_form_submissions_submitted_at ON public.form_submissions(submitted_at);
CREATE INDEX idx_form_submissions_status ON public.form_submissions(status);

-- Enable Row Level Security
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for forms table
CREATE POLICY "Allow public read access to forms" ON public.forms
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow authenticated users to insert forms" ON public.forms
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow users to update their own forms" ON public.forms
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- RLS Policies for form_submissions table  
CREATE POLICY "Allow public to insert form submissions" ON public.form_submissions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow form owners to read submissions" ON public.form_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.forms 
            WHERE forms.id = form_submissions.form_id 
            AND forms.user_id::text = auth.uid()::text
        )
    );

-- Insert test form for validation
INSERT INTO public.forms (title, name, organization_id, fields) 
VALUES (
    'Test GDPR Contact Form',
    'test-gdpr-form',
    '550e8400-e29b-41d4-a716-446655440000',
    '[
        {"name": "nome", "label": "Nome", "type": "text", "required": true},
        {"name": "email", "label": "Email", "type": "email", "required": true},
        {"name": "privacy_consent", "label": "Accetto informativa privacy", "type": "checkbox", "required": true}
    ]'::jsonb
);

-- Verification query - should show success message
SELECT 
    '✅ Database setup completed successfully!' as status,
    (SELECT COUNT(*) FROM public.forms) as forms_count,
    (SELECT COUNT(*) FROM public.form_submissions) as submissions_count,
    'Ready for GDPR FormMaster Level 5' as message;