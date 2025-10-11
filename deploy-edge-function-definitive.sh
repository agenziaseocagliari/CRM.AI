#!/bin/bash

# 🚀 DEPLOY DEFINITIVO EDGE FUNCTION
# Usa l'API Supabase Management per deploy robusto

echo "🚀 STARTING DEFINITIVE EDGE FUNCTION DEPLOYMENT"

# Credenziali reali dal progetto
SUPABASE_ACCESS_TOKEN="sbp_e07c1443bcf5bd2abc264b6e2740abb92ce411e3"
PROJECT_REF="qjtaqrlpronohgpfdxsi"
FUNCTION_NAME="generate-form-fields"

echo "📋 Project: $PROJECT_REF"
echo "🔧 Function: $FUNCTION_NAME"

# Prepara il codice della function (base64 encoded)
echo "📦 Preparing function code..."
FUNCTION_CODE=$(base64 -w 0 ./supabase/functions/generate-form-fields/index.ts)

# Crea il payload per l'API
echo "🛠️ Creating deployment payload..."
cat > deploy_payload.json << EOF
{
  "name": "$FUNCTION_NAME",
  "source_code": "$FUNCTION_CODE",
  "verify_jwt": false
}
EOF

echo "🌐 Deploying to Supabase via Management API..."

# Deploy via Management API
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "https://api.supabase.com/v1/projects/$PROJECT_REF/functions" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d @deploy_payload.json)

# Parse response
HTTP_BODY=$(echo "$RESPONSE" | sed -E '$d')
HTTP_STATUS=$(echo "$RESPONSE" | tail -n1 | sed -E 's/.*:([0-9]+)/\1/')

echo "📊 Response Status: $HTTP_STATUS"

if [ "$HTTP_STATUS" -eq 200 ] || [ "$HTTP_STATUS" -eq 201 ]; then
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo "📝 Response: $HTTP_BODY"
else
    echo "❌ DEPLOYMENT FAILED!"
    echo "📝 Error Response: $HTTP_BODY"
    
    # Fallback: Try updating existing function
    echo "🔄 Trying to UPDATE existing function..."
    UPDATE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
      -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/functions/$FUNCTION_NAME" \
      -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d @deploy_payload.json)
    
    UPDATE_HTTP_BODY=$(echo "$UPDATE_RESPONSE" | sed -E '$d')
    UPDATE_HTTP_STATUS=$(echo "$UPDATE_RESPONSE" | tail -n1 | sed -E 's/.*:([0-9]+)/\1/')
    
    echo "📊 Update Status: $UPDATE_HTTP_STATUS"
    
    if [ "$UPDATE_HTTP_STATUS" -eq 200 ] || [ "$UPDATE_HTTP_STATUS" -eq 201 ]; then
        echo "✅ UPDATE SUCCESSFUL!"
        echo "📝 Update Response: $UPDATE_HTTP_BODY"
    else
        echo "❌ UPDATE ALSO FAILED!"
        echo "📝 Update Error: $UPDATE_HTTP_BODY"
        exit 1
    fi
fi

# Cleanup
rm -f deploy_payload.json

echo "🧪 Testing deployed function..."
sleep 3

# Test the deployed function
TEST_RESPONSE=$(curl -s -X POST "https://qjtaqrlpronohgpfdxsi.supabase.co/functions/v1/generate-form-fields" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzg2NjQsImV4cCI6MjA3MzAxNDY2NH0.V9O8kPhCuIZiZaOOE-lLKv_yfUqwM9uMnXZojXANkzk" \
  -d '{
    "prompt": "Genera un form di contatto per: Realizzazione siti web\nTipo di business: Agenzia Web\nURL Privacy Policy: https://seo.cagliari.it/privacy-policy\nCampi richiesti: Nome completo, Email, Telefono, Servizi di interesse",
    "organization_id": "123e4567-e89b-12d3-a456-426614174000",
    "required_fields": ["Nome completo", "Email", "Telefono", "Servizi interesse"],
    "style_customizations": {
      "primaryColor": "#3B82F6",
      "backgroundColor": "#FFFFFF",
      "textColor": "#1F2937"
    }
  }')

echo "🧪 Test Response:"
echo "$TEST_RESPONSE" | jq .

# Check if the fixes are working
echo ""
echo "🔍 CHECKING FIXES:"
HAS_GDPR=$(echo "$TEST_RESPONSE" | jq -r '.fields[] | select(.name=="privacy_consent") | .name' 2>/dev/null)
HAS_SERVIZI=$(echo "$TEST_RESPONSE" | jq -r '.fields[] | select(.name=="servizi_interesse") | .name' 2>/dev/null)
SERVIZI_TYPE=$(echo "$TEST_RESPONSE" | jq -r '.fields[] | select(.name=="servizi_interesse") | .type' 2>/dev/null)
SERVIZI_OPTIONS=$(echo "$TEST_RESPONSE" | jq -r '.fields[] | select(.name=="servizi_interesse") | .options | length' 2>/dev/null)

if [ "$HAS_GDPR" = "privacy_consent" ]; then
    echo "✅ GDPR field present"
else
    echo "❌ GDPR field missing"
fi

if [ "$HAS_SERVIZI" = "servizi_interesse" ]; then
    echo "✅ Servizi interesse field present"
    if [ "$SERVIZI_TYPE" = "select" ]; then
        echo "✅ Servizi interesse is SELECT type"
        if [ "$SERVIZI_OPTIONS" -gt 0 ]; then
            echo "✅ Servizi interesse has $SERVIZI_OPTIONS options"
        else
            echo "❌ Servizi interesse has no options"
        fi
    else
        echo "❌ Servizi interesse is $SERVIZI_TYPE (should be select)"
    fi
else
    echo "❌ Servizi interesse field missing"
fi

echo "🏁 DEPLOYMENT COMPLETED!"