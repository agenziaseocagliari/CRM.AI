// File: supabase/functions/create-crm-event/index.ts

declare const Deno: {
  env: { get(key: string): string | undefined; };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getOrganizationId } from "../_shared/supabase.ts"; // Importa il nuovo helper

const ACTION_TYPE = 'create_crm_event';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // organization_id viene ora recuperato in modo sicuro dal token JWT
    const organization_id = await getOrganizationId(req);

    const {
      contact_id,
      event_summary,
      event_description,
      event_start_time,
      event_end_time,
      google_event_id
    } = await req.json();

    if (!contact_id || !event_summary || !event_start_time || !event_end_time) {
      throw new Error("Parametri `contact_id`, `event_summary`, `event_start_time`, e `event_end_time` sono obbligatori.");
    }
    
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) throw new Error("La chiave SUPABASE_SERVICE_ROLE_KEY non è impostata.");
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
    
    // --- Integrazione Sistema a Crediti ---
    const { data: creditData, error: creditError } = await supabaseAdmin.functions.invoke('consume-credits', {
        body: { organization_id, action_type: ACTION_TYPE },
    });
    if (creditError) throw new Error(`Errore di rete nella verifica dei crediti: ${creditError.message}`);
    if (creditData && creditData.error) throw new Error(`Errore nella verifica dei crediti: ${creditData.error}`);
    if (creditData && !creditData.success) throw new Error("Crediti insufficienti per creare un evento.");
    console.log(`[${ACTION_TYPE}] Crediti verificati per ${organization_id}. Rimanenti: ${creditData.remaining_credits}`);
    // --- Fine Integrazione ---

    const { data: newEvent, error: insertError } = await supabaseAdmin
      .from('crm_events')
      .insert({
        organization_id, // Usiamo l'ID sicuro recuperato dal token
        contact_id,
        event_summary,
        event_description,
        event_start_time,
        event_end_time,
        google_event_id,
        status: 'confirmed'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ crmEvent: newEvent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Errore in create-crm-event:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});