-- Migration to create forms table and submissions table
-- Created: 2025-10-07 for FormMaster functionality

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create forms table
CREATE TABLE IF NOT EXISTS public.forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    name TEXT NOT NULL,
    fields JSONB NOT NULL DEFAULT '[]',
    organization_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create form submissions table
CREATE TABLE IF NOT EXISTS public.form_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_forms_organization_id ON public.forms(organization_id);
CREATE INDEX IF NOT EXISTS idx_forms_user_id ON public.forms(user_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON public.form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_at ON public.form_submissions(submitted_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for forms table
CREATE POLICY "Users can view their own forms" ON public.forms
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own forms" ON public.forms
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own forms" ON public.forms
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own forms" ON public.forms
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for form submissions (forms are public for submissions)
CREATE POLICY "Anyone can view form submissions for their forms" ON public.form_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.forms 
            WHERE forms.id = form_submissions.form_id 
            AND forms.user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can submit to public forms" ON public.form_submissions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.forms 
            WHERE forms.id = form_submissions.form_id
        )
    );

-- Create RPC function for form submissions (used by PublicForm component)
CREATE OR REPLACE FUNCTION public.create_submission(
    form_id_param UUID,
    submission_data JSONB,
    ip_address_param INET DEFAULT NULL,
    user_agent_param TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    submission_id UUID;
BEGIN
    -- Verify form exists
    IF NOT EXISTS (SELECT 1 FROM public.forms WHERE id = form_id_param) THEN
        RAISE EXCEPTION 'Form not found';
    END IF;
    
    -- Insert submission
    INSERT INTO public.form_submissions (form_id, data, ip_address, user_agent)
    VALUES (form_id_param, submission_data, ip_address_param, user_agent_param)
    RETURNING id INTO submission_id;
    
    RETURN submission_id;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT ON public.forms TO authenticated;
GRANT SELECT, INSERT ON public.form_submissions TO anon, authenticated; 
GRANT EXECUTE ON FUNCTION public.create_submission TO anon, authenticated;

COMMENT ON TABLE public.forms IS 'Stores form definitions created by FormMaster AI';
COMMENT ON TABLE public.form_submissions IS 'Stores submissions from public forms';
COMMENT ON FUNCTION public.create_submission IS 'Function to create form submissions from public forms';