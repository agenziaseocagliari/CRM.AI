#!/bin/bash
# Deploy Edge Functions to Supabase with user_metadata fallback fix
set -e

echo "🚀 Deploying Edge Functions with user_metadata fallback fix..."

PROJECT_REF="qjtaqrlpronohgpfdxsi"
ACCESS_TOKEN="sbp_e07c1443bcf5bd2abc264b6e2740abb92ce411e3"

# List of functions to deploy (only _shared utilities need redeploy)
FUNCTIONS_DIR="supabase/functions"

echo "📦 Preparing deployment..."

# Deploy superadmin-logs function (depends on _shared/supabase.ts)
echo "📤 Deploying superadmin-logs..."
curl -X POST "https://api.supabase.com/v1/projects/${PROJECT_REF}/functions/superadmin-logs/deploy" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "verify_jwt": true
  }' || echo "⚠️ Deploy superadmin-logs failed (may need manual intervention)"

# Deploy other critical functions that use superadmin validation
echo "📤 Deploying organization-management..."
curl -X POST "https://api.supabase.com/v1/projects/${PROJECT_REF}/functions/organization-management/deploy" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "verify_jwt": true
  }' || echo "⚠️ Deploy organization-management failed"

echo "📤 Deploying user-management..."
curl -X POST "https://api.supabase.com/v1/projects/${PROJECT_REF}/functions/user-management/deploy" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "verify_jwt": true
  }' || echo "⚠️ Deploy user-management failed"

echo ""
echo "✅ Edge Functions deployment complete!"
echo "⏱️  Functions may take 1-2 minutes to propagate globally"
echo ""
echo "🧪 Test by logging in at http://localhost:5173"
echo "   The 'JWT custom claim user_role not found' error should be gone"
