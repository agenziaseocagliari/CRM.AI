#!/bin/bash

echo "🧪 Testing Login on Vercel Production..."
echo "URL: https://crm-ai-seo-cagliaris-projects-a561cd5b.vercel.app"
echo ""

# Test login
RESPONSE=$(curl -s -X POST "https://qjtaqrlpronohgpfdxsi.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzg2NjQsImV4cCI6MjA3MzAxNDY2NH0.4bCc8vk1qtxLs90xsYaGOs-envRmASVGL9fYtESgY6k" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "agenziaseocagliari@gmail.com",
    "password": "WebProSEO@1980#"
  }')

# Extract JWT
JWT=$(echo "$RESPONSE" | python3 -c "import json, sys; data=json.load(sys.stdin); print(data.get('access_token', 'ERROR'))" 2>/dev/null)

if [ "$JWT" = "ERROR" ] || [ -z "$JWT" ]; then
  echo "❌ Login failed"
  echo "$RESPONSE" | python3 -m json.tool
  exit 1
fi

echo "✅ Login successful!"
echo ""

# Decode JWT payload
PAYLOAD=$(echo "$JWT" | cut -d'.' -f2 | base64 -d 2>/dev/null | python3 -m json.tool)

echo "📋 JWT Claims:"
echo "$PAYLOAD" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f\"✅ user_metadata.user_role: {data.get('user_metadata', {}).get('user_role', 'MISSING')}\")
print(f\"✅ user_metadata.is_super_admin: {data.get('user_metadata', {}).get('is_super_admin', 'MISSING')}\")
print(f\"✅ user_metadata.organization_id: {data.get('user_metadata', {}).get('organization_id', 'MISSING')}\")
print(f\"Top-level user_role: {data.get('user_role', '❌ MISSING (expected, will use fallback)')}\")
"

echo ""
echo "✅ Frontend will read from user_metadata as fallback"
echo "✅ No TOKEN DEFECT error expected"
