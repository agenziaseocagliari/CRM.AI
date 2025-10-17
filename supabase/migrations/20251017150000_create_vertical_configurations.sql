-- ====================================================================
-- VERTICAL CONFIGURATIONS TABLE
-- ====================================================================
-- Master configuration for each CRM vertical (Standard, Real Estate, etc.)
-- Stores UI settings, enabled modules, and default configurations
-- Used by frontend to dynamically adapt interface based on vertical type
-- ====================================================================

-- Create vertical_configurations table
CREATE TABLE IF NOT EXISTS vertical_configurations (
  -- Primary key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Vertical identification
  vertical TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  
  -- UI Configuration (JSONB for flexibility)
  sidebar_config JSONB NOT NULL,
  dashboard_config JSONB DEFAULT '{}',
  theme_config JSONB DEFAULT '{}',
  
  -- Features
  enabled_modules TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Settings
  default_settings JSONB DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- INDEXES
-- ====================================================================

-- Index for fast lookup by vertical type (most common query)
CREATE INDEX IF NOT EXISTS idx_vertical_configurations_vertical
ON vertical_configurations(vertical);

-- Index for active configurations only (filtered index for better performance)
CREATE INDEX IF NOT EXISTS idx_vertical_configurations_active
ON vertical_configurations(is_active)
WHERE is_active = true;

-- ====================================================================
-- COMMENTS
-- ====================================================================

COMMENT ON TABLE vertical_configurations IS 'Master configuration table for CRM verticals. Defines UI layout, enabled modules, and default settings for each vertical type (Standard, Real Estate, etc.)';

COMMENT ON COLUMN vertical_configurations.vertical IS 'Unique identifier for vertical type (e.g., standard, real_estate, automotive)';
COMMENT ON COLUMN vertical_configurations.display_name IS 'Human-readable name for the vertical (e.g., "Real Estate CRM")';
COMMENT ON COLUMN vertical_configurations.sidebar_config IS 'JSONB configuration for sidebar menu items and structure';
COMMENT ON COLUMN vertical_configurations.dashboard_config IS 'JSONB configuration for dashboard layout and widgets';
COMMENT ON COLUMN vertical_configurations.theme_config IS 'JSONB configuration for theme colors and styling';
COMMENT ON COLUMN vertical_configurations.enabled_modules IS 'Array of enabled feature modules for this vertical';
COMMENT ON COLUMN vertical_configurations.default_settings IS 'JSONB default settings and preferences for this vertical';