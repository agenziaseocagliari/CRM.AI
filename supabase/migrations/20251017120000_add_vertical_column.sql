-- Add vertical support
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS vertical TEXT DEFAULT 'standard';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vertical TEXT DEFAULT 'standard';

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_organizations_vertical ON organizations(vertical);
CREATE INDEX IF NOT EXISTS idx_profiles_vertical ON profiles(vertical);

-- Update existing records
UPDATE organizations SET vertical = 'standard' WHERE vertical IS NULL;
UPDATE profiles SET vertical = 'standard' WHERE vertical IS NULL;