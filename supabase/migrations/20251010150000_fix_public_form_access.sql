-- ============================================================================
-- 🔧 FIX: Abilita accesso pubblico ai form per PublicForm component
-- ============================================================================
-- PROBLEMA: RLS policy attuale blocca accesso anonimo (anon role)
-- SOLUZIONE: Aggiungi policy che permette SELECT a tutti (per lettura form pubblici)
--
-- Date: 2025-10-10
-- Purpose: Allow anonymous users to view forms via public link
-- Impact: Forms table can be read by anyone (necessary for public forms feature)
-- Security: Solo SELECT, non INSERT/UPDATE/DELETE
-- ============================================================================

-- Drop vecchia policy restrittiva se esiste (opzionale, per sicurezza)
-- La manteniamo per utenti autenticati

-- ✅ CRITICAL FIX: Aggiungi nuova policy per accesso pubblico (anonymous)
-- NOTA: PostgreSQL non supporta IF NOT EXISTS su CREATE POLICY
-- Soluzione: DROP IF EXISTS prima di CREATE

DROP POLICY IF EXISTS "Public forms can be viewed by anyone" ON public.forms;

CREATE POLICY "Public forms can be viewed by anyone" ON public.forms
    FOR SELECT
    USING (true);  -- Permette a chiunque (incluso anon role) di leggere tutti i form

-- Commento per documentazione
COMMENT ON POLICY "Public forms can be viewed by anyone" ON public.forms 
IS 'Allows anonymous users to view forms via public sharing links. Required for PublicForm component.';

-- ============================================================================
-- 🔍 VERIFICA POLICIES
-- ============================================================================
-- Per verificare le policies attive:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'forms';
--
-- Expected output:
-- - "Users can view their own forms" (FOR SELECT, auth.uid() = user_id)
-- - "Public forms can be viewed by anyone" (FOR SELECT, true)
-- ============================================================================
