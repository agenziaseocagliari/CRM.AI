#!/bin/bash
# Manual Edge Function deployment using zip upload
set -e

echo "🚀 Deploying Edge Functions with user_metadata fallback fix..."

PROJECT_REF="qjtaqrlpronohgpfdxsi"
ACCESS_TOKEN="sbp_e07c1443bcf5bd2abc264b6e2740abb92ce411e3"

# Function to deploy a single edge function
deploy_function() {
  local FUNCTION_NAME=$1
  echo "📤 Deploying ${FUNCTION_NAME}..."
  
  # Create temp directory
  TEMP_DIR=$(mktemp -d)
  
  # Copy function files
  cp -r "supabase/functions/${FUNCTION_NAME}" "${TEMP_DIR}/"
  cp -r "supabase/functions/_shared" "${TEMP_DIR}/_shared"
  
  # Create zip
  cd "${TEMP_DIR}"
  zip -r "/tmp/${FUNCTION_NAME}.zip" .
  cd -
  
  # Upload via API
  curl -X POST \
    "https://api.supabase.com/v1/projects/${PROJECT_REF}/functions/${FUNCTION_NAME}" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/x-zip-compressed" \
    --data-binary "@/tmp/${FUNCTION_NAME}.zip" \
    -w "\nHTTP Status: %{http_code}\n"
  
  # Cleanup
  rm -rf "${TEMP_DIR}" "/tmp/${FUNCTION_NAME}.zip"
  
  echo "✅ ${FUNCTION_NAME} deployed"
  echo ""
}

# Deploy critical functions that use superadmin validation
deploy_function "superadmin-logs"
deploy_function "organization-management"
deploy_function "user-management"

echo "✅ All Edge Functions deployed!"
echo "⏱️  Functions may take 1-2 minutes to propagate globally"
echo ""
echo "🧪 Test by logging in at http://localhost:5173"
