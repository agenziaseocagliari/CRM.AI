-- Organizations Table - Base dependency
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON organizations(created_at);

-- Add RLS policy
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view organizations" ON organizations
  FOR SELECT TO public
  USING (TRUE);

CREATE POLICY "Users can manage organizations" ON organizations  
  FOR ALL TO public
  USING (TRUE);

-- Create profiles table if it doesn't exist (basic version)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles  
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view profiles" ON profiles
  FOR SELECT TO public  
  USING (TRUE);

CREATE POLICY "Users can manage profiles" ON profiles
  FOR ALL TO public
  USING (TRUE);

-- Create contacts table if it doesn't exist (basic version)
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on contacts
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contacts" ON contacts
  FOR SELECT TO public
  USING (TRUE);

CREATE POLICY "Users can manage contacts" ON contacts  
  FOR ALL TO public
  USING (TRUE);

-- Insert a default organization for development
INSERT INTO organizations (name, slug) VALUES ('CRM.AI Default', 'crm-ai-default') 
ON CONFLICT (slug) DO NOTHING;