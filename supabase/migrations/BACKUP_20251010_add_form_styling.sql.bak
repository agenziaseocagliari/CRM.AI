-- Migration: Add styling and privacy_policy_url to forms table
-- Date: October 10, 2025
-- Description: Adds color customization and privacy policy support to forms
-- Based on lost commits from October 8, 2025

-- Add styling column for color customization
ALTER TABLE public.forms 
ADD COLUMN IF NOT EXISTS styling JSONB DEFAULT '{
  "primary_color": "#6366f1",
  "secondary_color": "#f3f4f6",
  "background_color": "#ffffff",
  "text_color": "#1f2937",
  "border_color": "#6366f1",
  "border_radius": "8px",
  "font_family": "Inter, system-ui, sans-serif",
  "button_style": {
    "background_color": "#6366f1",
    "text_color": "#ffffff",
    "border_radius": "6px"
  }
}'::jsonb;

-- Add privacy policy URL column
ALTER TABLE public.forms 
ADD COLUMN IF NOT EXISTS privacy_policy_url TEXT;

-- Add comment to document the structure
COMMENT ON COLUMN public.forms.styling IS 'Form color customization settings (primary_color, secondary_color, background_color, text_color, border_color, border_radius, font_family, button_style)';
COMMENT ON COLUMN public.forms.privacy_policy_url IS 'URL to privacy policy page - if set, privacy checkbox will be automatically added to form';

-- Create index for performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_forms_styling ON public.forms USING gin (styling);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed: styling and privacy_policy_url columns added to forms table';
  RAISE NOTICE '🎨 Default colors: Primary=#6366f1 (Indigo), Background=#ffffff (White), Text=#1f2937 (Gray-800)';
END $$;
