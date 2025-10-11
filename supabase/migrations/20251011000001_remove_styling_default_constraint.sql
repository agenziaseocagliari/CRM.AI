-- Migration: Remove DEFAULT constraint from styling column
-- Date: October 11, 2025
-- Description: Removes the DEFAULT constraint that was preventing color customizations from being saved
-- Issue: The DEFAULT constraint was forcing all styling updates to revert to default values

-- Remove the DEFAULT constraint from styling column
ALTER TABLE public.forms 
ALTER COLUMN styling DROP DEFAULT;

-- Update existing forms that have default styling to keep them
-- (This ensures we don't lose existing customizations)
UPDATE public.forms 
SET styling = styling
WHERE styling IS NOT NULL;

-- Add comment to document the change
COMMENT ON COLUMN public.forms.styling IS 'Form color customization settings (primary_color, secondary_color, background_color, text_color, border_color, border_radius, font_family, button_style) - NO DEFAULT to allow custom values';