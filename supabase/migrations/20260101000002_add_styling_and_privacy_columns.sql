-- Migration: Add styling and privacy_policy_url columns to forms table
-- Created: 2026-01-01 for advanced design customization support

-- Add styling column to store FormStyle data
ALTER TABLE public.forms 
ADD COLUMN IF NOT EXISTS styling JSONB;

-- Add privacy_policy_url column
ALTER TABLE public.forms 
ADD COLUMN IF NOT EXISTS privacy_policy_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.forms.styling IS 'Form styling configuration including colors, borders, fonts, padding, shadows (FormStyle interface)';
COMMENT ON COLUMN public.forms.privacy_policy_url IS 'URL to privacy policy for forms that require privacy consent';

-- Create index for styling queries (optional but helpful for performance)
CREATE INDEX IF NOT EXISTS idx_forms_styling ON public.forms USING GIN (styling);