#!/bin/bash

# ====================================================================
# SCRIPT DIAGNOSTICO: Verifica stato utenti e configurazione JWT
# ====================================================================
# Questo script interroga il database Supabase per diagnosticare
# il problema "user_role mancante" nel JWT token
# ====================================================================

# Configurazione (da chat precedenti)
SUPABASE_URL="https://qjtaqrlpronohgpfdxsi.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0"

echo "========================================="
echo "🔍 DIAGNOSTIC: JWT user_role Issue"
echo "========================================="
echo ""

# 1. Verifica utenti in auth.users (via admin API)
echo "📊 1. Verificando utenti in auth.users..."
echo "   Email: agenziaseocagliari@gmail.com, webproseoid@gmail.com"
echo ""

# 2. Verifica profili in public.profiles
echo "📊 2. Verificando profili in public.profiles..."
curl -s -X GET "${SUPABASE_URL}/rest/v1/profiles?select=id,email,full_name,user_role,role,organization_id&email=in.(agenziaseocagliari@gmail.com,webproseoid@gmail.com)" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" | jq '.'
echo ""

# 3. Conta tutti i profili con/senza user_role
echo "📊 3. Statistiche user_role in profiles..."
curl -s -X GET "${SUPABASE_URL}/rest/v1/profiles?select=user_role,role" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" | jq 'group_by(.user_role // .role // "NULL") | map({role: .[0].user_role // .[0].role // "NULL", count: length})'
echo ""

# 4. Verifica esistenza funzione custom_access_token_hook
echo "📊 4. Verificando funzione custom_access_token_hook..."
curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/pg_get_functiondef" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"funcname": "custom_access_token_hook"}' 2>/dev/null || echo "⚠️  Impossibile verificare funzione via API (normale, richiede accesso diretto al DB)"
echo ""

# 5. Cerca utenti senza profilo
echo "📊 5. Cercando utenti in auth.users senza profilo..."
# Nota: questo richiede accesso diretto al database, non disponibile via REST API
echo "   ⚠️  Questa verifica richiede accesso SQL diretto"
echo ""

echo "========================================="
echo "📋 PROSSIMI STEP:"
echo "========================================="
echo "1. Controlla i risultati sopra"
echo "2. Se i profili non hanno 'user_role' o 'role' → PROBLEMA TROVATO"
echo "3. Esegui il fix SQL per aggiungere user_role agli utenti"
echo "4. Configura auth hook in Supabase Dashboard"
echo "5. Forza re-login degli utenti"
echo ""

