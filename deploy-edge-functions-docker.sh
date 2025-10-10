#!/bin/bash
# Deploy Edge Functions using Supabase CLI via Docker
set -e

echo "🚀 Deploying Edge Functions with user_metadata fallback fix..."

PROJECT_REF="qjtaqrlpronohgpfdxsi"
ACCESS_TOKEN="sbp_e07c1443bcf5bd2abc264b6e2740abb92ce411e3"

# Use Supabase CLI via Docker
echo "📦 Using Supabase CLI via Docker..."

# Login to Supabase
echo "${ACCESS_TOKEN}" | docker run --rm -i \
  -v "$(pwd):/workspace" \
  -w /workspace \
  supabase/cli:latest \
  supabase login --token

# Deploy all functions
echo "📤 Deploying all Edge Functions..."
docker run --rm \
  -v "$(pwd):/workspace" \
  -w /workspace \
  -e SUPABASE_ACCESS_TOKEN="${ACCESS_TOKEN}" \
  supabase/cli:latest \
  supabase functions deploy --project-ref "${PROJECT_REF}" --no-verify-jwt

echo ""
echo "✅ Edge Functions deployment complete!"
echo "⏱️  Functions may take 1-2 minutes to propagate globally"
echo ""
echo "🧪 Test by:"
echo "   1. Logout from http://localhost:5173"
echo "   2. Login again with agenziaseocagliari@gmail.com"
echo "   3. The 'JWT custom claim user_role not found' error should be gone"
