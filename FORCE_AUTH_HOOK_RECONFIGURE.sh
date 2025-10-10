#!/bin/bash

# ====================================================================
# FORCE AUTH HOOK RECONFIGURATION
# ====================================================================
# Questo script forza la riconfigurazione dell'Auth Hook
# usando multiple strategie
# ====================================================================

SUPABASE_PROJECT_REF="qjtaqrlpronohgpfdxsi"
SUPABASE_ACCESS_TOKEN="sbp_e07c1443bcf5bd2abc264b6e2740abb92ce411e3"
MANAGEMENT_API_URL="https://api.supabase.com/v1"

echo "========================================="
echo "🔧 FORCE AUTH HOOK RECONFIGURATION"
echo "========================================="
echo ""

# STEP 1: Disabilita temporaneamente l'hook
echo "1️⃣ Disabilitazione temporanea hook..."
curl -s -X PATCH "${MANAGEMENT_API_URL}/projects/${SUPABASE_PROJECT_REF}/config/auth" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "hook_custom_access_token_enabled": false
  }' | jq '.hook_custom_access_token_enabled'

echo "   Attendo 3 secondi..."
sleep 3

# STEP 2: Riabilita l'hook
echo ""
echo "2️⃣ Riabilitazione hook con URI corretto..."
curl -s -X PATCH "${MANAGEMENT_API_URL}/projects/${SUPABASE_PROJECT_REF}/config/auth" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "hook_custom_access_token_enabled": true,
    "hook_custom_access_token_uri": "pg-functions://postgres/public/custom_access_token_hook"
  }' | jq '{enabled: .hook_custom_access_token_enabled, uri: .hook_custom_access_token_uri}'

echo ""
echo "   Attendo 5 secondi per propagazione configurazione..."
sleep 5

# STEP 3: Verifica finale
echo ""
echo "3️⃣ Verifica configurazione finale..."
curl -s -X GET "${MANAGEMENT_API_URL}/projects/${SUPABASE_PROJECT_REF}/config/auth" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" | jq '{
    hook_enabled: .hook_custom_access_token_enabled,
    hook_uri: .hook_custom_access_token_uri,
    external_email_enabled: .external_email_enabled,
    site_url: .site_url
  }'

echo ""
echo "========================================="
echo "✅ Riconfigurazione completata"
echo "========================================="
echo ""
echo "PROSSIMI STEP:"
echo "1. Aspetta 1-2 minuti per propagazione configurazione"
echo "2. Vai su: https://crm-ai-rho.vercel.app"
echo "3. PULISCI CACHE BROWSER (Ctrl+Shift+Delete)"
echo "4. Fai LOGOUT completo"
echo "5. Fai LOGIN di nuovo"
echo ""
echo "Se il problema persiste, esegui:"
echo "   ./TEST_AUTH_HOOK_RUNTIME.sql nel SQL Editor"
echo ""
