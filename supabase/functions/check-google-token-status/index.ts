// File: supabase/functions/check-google-token-status/index.ts

declare const Deno: {
  env: { get(key: string): string | undefined; };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

const TARGET_ORGANIZATION_ID = 'a4a71877-bddf-44ee-9f3a-c3c36c53c24e';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) {
        throw new Error("La chiave SUPABASE_SERVICE_ROLE_KEY non è impostata.");
    }

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

    const diagnosticReport = {
        checked_at: new Date().toISOString(),
        organization_id: TARGET_ORGANIZATION_ID,
        record_exists: false,
        token_status: 'missing' as 'missing' | 'null' | 'empty' | 'corrupted' | 'invalid_structure' | 'valid' | 'expired',
        token_data_preview: null as string | null,
        expiry_date: null as string | null,
        is_expired: null as boolean | null,
        needs_reconnection: true,
        suggested_action: 'Il record per questa organizzazione non è stato trovato nella tabella `organization_settings`. L\'utente deve completare il flusso di autenticazione Google per la prima volta.',
    };

    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('organization_settings')
      .select('google_auth_token')
      .eq('organization_id', TARGET_ORGANIZATION_ID)
      .maybeSingle();

    if (settingsError) throw settingsError;

    if (!settings) {
      // Il record non esiste, il report di default è già corretto.
      return new Response(JSON.stringify(diagnosticReport), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    diagnosticReport.record_exists = true;
    const token = settings.google_auth_token;

    if (token === null) {
        diagnosticReport.token_status = 'null';
        diagnosticReport.suggested_action = 'Il record esiste, ma il campo `google_auth_token` è nullo. L\'utente deve connettere o riconnettere il proprio account Google.';
    } else if (token === '') {
        diagnosticReport.token_status = 'empty';
        diagnosticReport.suggested_action = 'Il campo `google_auth_token` è una stringa vuota. L\'utente deve riconnettere il proprio account Google.';
    } else {
        diagnosticReport.token_data_preview = token.substring(0, 50) + (token.length > 50 ? '...' : '');
        try {
            const tokenData = JSON.parse(token);

            if (!tokenData.access_token || !tokenData.refresh_token || !tokenData.expiry_date) {
                diagnosticReport.token_status = 'invalid_structure';
                diagnosticReport.suggested_action = 'Il token è un JSON valido ma mancano campi essenziali (access_token, refresh_token, o expiry_date). L\'utente deve riconnettere il suo account.';
            } else {
                diagnosticReport.expiry_date = tokenData.expiry_date;
                const isExpired = new Date(tokenData.expiry_date).getTime() < Date.now();
                diagnosticReport.is_expired = isExpired;
                
                if (isExpired) {
                    diagnosticReport.token_status = 'expired';
                    diagnosticReport.needs_reconnection = false; // Il sistema dovrebbe provare a rinfrescarlo
                    diagnosticReport.suggested_action = 'Il token è valido ma scaduto. Il sistema tenterà di rinfrescarlo automaticamente. Se le chiamate API continuano a fallire, l\'utente potrebbe dover riconnettere il suo account.';
                } else {
                    diagnosticReport.token_status = 'valid';
                    diagnosticReport.needs_reconnection = false;
                    diagnosticReport.suggested_action = 'Il token è valido e attivo. L\'integrazione con Google Calendar dovrebbe funzionare correttamente.';
                }
            }
        } catch (e) {
            diagnosticReport.token_status = 'corrupted';
            diagnosticReport.suggested_action = 'Il contenuto del campo `google_auth_token` non è un JSON valido. L\'utente deve riconnettere il suo account Google per generare un token valido.';
        }
    }

    return new Response(JSON.stringify(diagnosticReport), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Errore in check-google-token-status:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
