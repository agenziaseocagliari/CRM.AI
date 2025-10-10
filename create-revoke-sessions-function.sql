-- ====================================================================
-- CREATE HELPER FUNCTION: Revoke User Sessions
-- ====================================================================
-- Questa funzione può essere chiamata via RPC API per invalidare sessioni
-- ====================================================================

CREATE OR REPLACE FUNCTION public.revoke_user_sessions(user_ids uuid[])
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Elimina le sessioni per gli user_ids specificati
  DELETE FROM auth.sessions
  WHERE user_id = ANY(user_ids);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN json_build_object(
    'success', true,
    'deleted_sessions', deleted_count,
    'message', format('Invalidate %s sessioni', deleted_count)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Errore durante l''invalidazione delle sessioni'
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.revoke_user_sessions(uuid[]) TO service_role;

COMMENT ON FUNCTION public.revoke_user_sessions IS
'Invalida le sessioni degli utenti specificati, forzandoli a rifare login.
Utilizzare con cautela - invalida TUTTE le sessioni attive degli utenti.';

-- ====================================================================
-- TEST: Eseguire questa query per invalidare le sessioni
-- ====================================================================

SELECT public.revoke_user_sessions(ARRAY[
  'fbb13e89-ce6a-4a98-b718-3d965f19f1c7'::uuid,  -- agenziaseocagliari@gmail.com
  'dfa97fa5-8375-4f15-ad95-53d339ebcda9'::uuid   -- webproseoid@gmail.com
]);

-- ====================================================================
-- ALTERNATIVA: Invalidare solo se necessario (check prima)
-- ====================================================================

DO $$
DECLARE
  session_count integer;
BEGIN
  -- Conta sessioni esistenti per questi utenti
  SELECT COUNT(*) INTO session_count
  FROM auth.sessions
  WHERE user_id IN (
    'fbb13e89-ce6a-4a98-b718-3d965f19f1c7',
    'dfa97fa5-8375-4f15-ad95-53d339ebcda9'
  );
  
  RAISE NOTICE 'Sessioni attive trovate: %', session_count;
  
  IF session_count > 0 THEN
    RAISE NOTICE 'Invalidando % sessioni...', session_count;
    
    DELETE FROM auth.sessions
    WHERE user_id IN (
      'fbb13e89-ce6a-4a98-b718-3d965f19f1c7',
      'dfa97fa5-8375-4f15-ad95-53d339ebcda9'
    );
    
    RAISE NOTICE '✅ Sessioni invalidate con successo';
  ELSE
    RAISE NOTICE '✅ Nessuna sessione attiva da invalidare';
  END IF;
END $$;

-- ====================================================================
-- RISULTATO ATTESO:
-- - Le sessioni vengono eliminate dal database
-- - Gli utenti devono rifare login
-- - I nuovi JWT conterranno user_role grazie al hook configurato
-- ====================================================================
