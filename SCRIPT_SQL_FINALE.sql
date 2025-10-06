-- ===================================================================
-- SCRIPT SQL FINALE - DA ESEGUIRE IN SUPABASE STUDIO
-- Progetto: qjtaqrlpronohgpfdxsi
-- URL: https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi/sql
-- ===================================================================

-- STEP 1: Aggiungi constraint UNIQUE se non esiste
ALTER TABLE organization_credits 
ADD CONSTRAINT organization_credits_organization_id_unique 
UNIQUE (organization_id);

-- STEP 2: Elimina tutte le versioni esistenti della funzione
DROP FUNCTION IF EXISTS consume_credits_rpc(UUID, TEXT);
DROP FUNCTION IF EXISTS consume_credits_rpc(p_organization_id UUID, p_action_type TEXT);

-- STEP 3: Crea la funzione corretta
CREATE OR REPLACE FUNCTION consume_credits_rpc(
    p_organization_id UUID,
    p_action_type TEXT
) RETURNS JSON AS $$
DECLARE
    v_credits_cost INTEGER;
    v_current_credits INTEGER;
    v_new_remaining INTEGER;
    v_result JSON;
BEGIN
    -- STEP 1: Ottieni il costo dell'azione
    SELECT credits_cost INTO v_credits_cost
    FROM credit_actions 
    WHERE action_type = p_action_type;
    
    -- Se l'azione non esiste, usa costo default 1
    IF v_credits_cost IS NULL THEN
        v_credits_cost := 1;
    END IF;
    
    -- STEP 2: Ottieni crediti attuali per l'organizzazione
    SELECT credits_remaining INTO v_current_credits
    FROM organization_credits 
    WHERE organization_id = p_organization_id;
    
    -- Se non esiste record, creane uno con 100 crediti
    IF v_current_credits IS NULL THEN
        INSERT INTO organization_credits (organization_id, credits_remaining, created_at, updated_at)
        VALUES (p_organization_id, 100, NOW(), NOW());
        v_current_credits := 100;
    END IF;
    
    -- STEP 3: Verifica se ci sono crediti sufficienti
    IF v_current_credits < v_credits_cost THEN
        v_result := json_build_object(
            'success', false,
            'error', 'Crediti insufficienti',
            'remaining_credits', v_current_credits,
            'required_credits', v_credits_cost
        );
        RETURN v_result;
    END IF;
    
    -- STEP 4: Consuma i crediti
    v_new_remaining := v_current_credits - v_credits_cost;
    
    UPDATE organization_credits 
    SET credits_remaining = v_new_remaining,
        updated_at = NOW()
    WHERE organization_id = p_organization_id;
    
    -- STEP 5: Ritorna risultato di successo
    v_result := json_build_object(
        'success', true,
        'credits_consumed', v_credits_cost,
        'remaining_credits', v_new_remaining
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Assegna i permessi
GRANT EXECUTE ON FUNCTION consume_credits_rpc(UUID, TEXT) TO public;

-- Test con il tuo organization_id
SELECT consume_credits_rpc('a4a71877-bddf-44ee-9f3a-c3c36c53c24e'::UUID, 'form_generation');