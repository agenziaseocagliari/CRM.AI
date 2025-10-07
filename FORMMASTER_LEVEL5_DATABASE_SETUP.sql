-- ============================================================================
-- 🚀 FORMMASTER LEVEL 5 - COMPLETE DATABASE SETUP
-- ============================================================================
-- Execute this script in Supabase SQL Editor to enable all FormMaster features
-- Created: 2025-10-07 | Engineering Fellow Level 5 Strategy

-- 1. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE FORMS TABLE
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

-- 3. CREATE FORM SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.form_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- 4. CREATE PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_forms_organization_id ON public.forms(organization_id);
CREATE INDEX IF NOT EXISTS idx_forms_user_id ON public.forms(user_id);
CREATE INDEX IF NOT EXISTS idx_forms_created_at ON public.forms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON public.form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_at ON public.form_submissions(submitted_at DESC);

-- 5. CREATE TRIGGER FOR UPDATED_AT
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_forms_updated_at 
    BEFORE UPDATE ON public.forms 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- 6. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- 7. RLS POLICIES FOR FORMS TABLE
DROP POLICY IF EXISTS "Users can view their own forms" ON public.forms;
CREATE POLICY "Users can view their own forms" ON public.forms
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own forms" ON public.forms;
CREATE POLICY "Users can insert their own forms" ON public.forms
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own forms" ON public.forms;
CREATE POLICY "Users can update their own forms" ON public.forms
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own forms" ON public.forms;
CREATE POLICY "Users can delete their own forms" ON public.forms  
    FOR DELETE USING (auth.uid() = user_id);

-- 8. RLS POLICIES FOR FORM SUBMISSIONS (Public access for submissions)
DROP POLICY IF EXISTS "Form owners can view submissions" ON public.form_submissions;
CREATE POLICY "Form owners can view submissions" ON public.form_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.forms 
            WHERE forms.id = form_submissions.form_id 
            AND forms.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Anyone can submit to public forms" ON public.form_submissions;
CREATE POLICY "Anyone can submit to public forms" ON public.form_submissions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.forms 
            WHERE forms.id = form_submissions.form_id
        )
    );

-- 9. CREATE SUBMISSION FUNCTION (Used by PublicForm component)
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
    form_exists BOOLEAN;
BEGIN
    -- Verify form exists and is accessible
    SELECT EXISTS(SELECT 1 FROM public.forms WHERE id = form_id_param) INTO form_exists;
    
    IF NOT form_exists THEN
        RAISE EXCEPTION 'Form not found or not accessible';
    END IF;
    
    -- Insert submission
    INSERT INTO public.form_submissions (form_id, data, ip_address, user_agent)
    VALUES (form_id_param, submission_data, ip_address_param, user_agent_param)
    RETURNING id INTO submission_id;
    
    RETURN submission_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error creating submission: %', SQLERRM;
END;
$$;

-- 10. GRANT PERMISSIONS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forms TO authenticated;
GRANT SELECT, INSERT ON public.form_submissions TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_submission TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column TO authenticated;

-- 11. ADD COMMENTS FOR DOCUMENTATION
COMMENT ON TABLE public.forms IS 'FormMaster AI generated forms - Level 5 Engineering Fellow';
COMMENT ON TABLE public.form_submissions IS 'Public form submissions with analytics tracking';
COMMENT ON FUNCTION public.create_submission IS 'Secure function for public form submissions';

-- 12. VERIFY SETUP
DO $$ 
BEGIN
    RAISE NOTICE '🎯 FormMaster Level 5 Database Setup Complete!';
    RAISE NOTICE '✅ Tables created: forms, form_submissions';
    RAISE NOTICE '✅ Indexes optimized for performance';  
    RAISE NOTICE '✅ RLS policies configured';
    RAISE NOTICE '✅ Submission function ready';
    RAISE NOTICE '🚀 FormMaster is now fully operational!';
END $$;