#!/bin/bash

# ====================================================================
# SCRIPT: Configurazione Auth Hook via Supabase Management API
# ====================================================================
# Tenta di configurare il custom_access_token_hook via API
# se le credenziali sono disponibili
# ====================================================================

# Da chat precedenti
SUPABASE_PROJECT_REF="qjtaqrlpronohgpfdxsi"
SUPABASE_ACCESS_TOKEN="sbp_e07c1443bcf5bd2abc264b6e2740abb92ce411e3"
MANAGEMENT_API_URL="https://api.supabase.com/v1"

echo "========================================="
echo "🔧 Configurazione Auth Hook"
echo "========================================="
echo ""

# Tentativo 1: Configurare via Management API (se supportato)
echo "📡 Tentativo configurazione via Management API..."
echo "   Project: ${SUPABASE_PROJECT_REF}"
echo ""

# Verifica configurazione corrente
echo "1️⃣ Verifico configurazione corrente auth hooks..."
curl -s -X GET "${MANAGEMENT_API_URL}/projects/${SUPABASE_PROJECT_REF}/config/auth" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" | jq '.hook' 2>/dev/null || echo "⚠️  API non accessibile o endpoint non supportato"
echo ""

# Tentativo configurazione
echo "2️⃣ Tento configurazione hook custom_access_token..."
HOOK_CONFIG=$(cat <<EOF
{
  "HOOK_CUSTOM_ACCESS_TOKEN_URI": "pg-functions://postgres/public/custom_access_token_hook",
  "HOOK_CUSTOM_ACCESS_TOKEN_ENABLED": true
}
EOF
)

curl -s -X PATCH "${MANAGEMENT_API_URL}/projects/${SUPABASE_PROJECT_REF}/config/auth" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${HOOK_CONFIG}" 2>&1 | head -20

echo ""
echo ""
echo "========================================="
echo "📋 NOTA IMPORTANTE:"
echo "========================================="
echo ""
echo "Se l'API non supporta questa configurazione,"
echo "DEVI configurare manualmente tramite Dashboard:"
echo ""
echo "1. Vai su: https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi"
echo "2. Naviga: Authentication → Hooks"
echo "3. Abilita: Custom Access Token"
echo "4. Seleziona: custom_access_token_hook"
echo "5. Salva"
echo ""
echo "DOPO la configurazione:"
echo "- Tutti gli utenti devono fare LOGOUT e RE-LOGIN"
echo ""

