-- Update user account to Enterprise tier
-- This SQL script upgrades webproseoid@gmail.com to enterprise level

-- First, let's check current user data
SELECT 
  id,
  email,
  user_metadata,
  app_metadata
FROM auth.users 
WHERE email = 'webproseoid@gmail.com';

-- Update the user's metadata to include enterprise role
UPDATE auth.users 
SET 
  app_metadata = jsonb_set(
    COALESCE(app_metadata, '{}'::jsonb),
    '{user_role}',
    '"enterprise"'::jsonb
  ),
  user_metadata = jsonb_set(
    COALESCE(user_metadata, '{}'::jsonb),
    '{subscription_tier}',
    '"enterprise"'::jsonb
  ),
  updated_at = now()
WHERE email = 'webproseoid@gmail.com';

-- Create organization record if not exists
INSERT INTO organizations (
  id,
  name,
  subscription_tier,
  created_at,
  updated_at,
  settings
) VALUES (
  gen_random_uuid(),
  'Guardian AI Development',
  'enterprise',
  now(),
  now(),
  '{
    "ai_agents_quota": {
      "daily": 1000,
      "monthly": 30000
    },
    "features": {
      "whatsapp_module": true,
      "email_marketing": true,
      "advanced_analytics": true,
      "ai_chat_engine": true,
      "custom_branding": true
    }
  }'::jsonb
) ON CONFLICT DO NOTHING;

-- Verify the update
SELECT 
  email,
  app_metadata->>'user_role' as user_role,
  user_metadata->>'subscription_tier' as subscription_tier,
  updated_at
FROM auth.users 
WHERE email = 'webproseoid@gmail.com';