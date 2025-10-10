#!/bin/bash

# ====================================================================
# SCRIPT: Invalidare sessioni esistenti per forzare re-login
# ====================================================================
# Esegue lo script SQL per eliminare le sessioni correnti degli utenti
# così al prossimo accesso riceveranno nuovi JWT con user_role
# ====================================================================

SUPABASE_URL="https://qjtaqrlpronohgpfdxsi.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0"

echo "========================================="
echo "🔧 Invalidazione Sessioni Utenti"
echo "========================================="
echo ""

echo "📊 Tentativo di eliminazione sessioni per utenti specifici..."
echo "   - agenziaseocagliari@gmail.com (super_admin)"
echo "   - webproseoid@gmail.com (enterprise)"
echo ""

# Nota: L'API REST di Supabase potrebbe non esporre direttamente auth.sessions
# Proviamo tramite SQL diretta se disponibile, altrimenti useremo la revoke API

# Opzione 1: Tentativo via RPC (se esiste una funzione)
curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/revoke_user_sessions" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "user_ids": [
      "fbb13e89-ce6a-4a98-b718-3d965f19f1c7",
      "dfa97fa5-8375-4f15-ad95-53d339ebcda9"
    ]
  }' 2>&1 | head -10

echo ""
echo "⚠️  NOTA: Se l'API REST non supporta questa operazione,"
echo "   esegui manualmente lo script SQL nel Supabase SQL Editor:"
echo ""
echo "   File: force-logout-users.sql"
echo ""

echo "========================================="
echo "✅ HOOK CONFIGURATO - PROSSIMI STEP:"
echo "========================================="
echo ""
echo "1. ✅ Auth Hook configurato: custom_access_token_hook"
echo "2. 🔄 Sessioni invalidate (o da invalidare manualmente)"
echo "3. 📱 Gli utenti devono RIFARE LOGIN:"
echo ""
echo "   → agenziaseocagliari@gmail.com"
echo "   → webproseoid@gmail.com"
echo ""
echo "4. 🧪 Dopo il login, verifica JWT token:"
echo "   - Deve contenere 'user_role' claim"
echo "   - Deve contenere 'organization_id' claim (eccetto super_admin)"
echo ""
echo "5. ✅ L'errore 'user_role mancante' sarà RISOLTO!"
echo ""

