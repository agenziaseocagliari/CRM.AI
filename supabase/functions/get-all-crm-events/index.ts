// File: supabase/functions/get-all-crm-events/index.ts

declare const Deno: {
  env: { get(key: string): string | undefined; };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { organization_id } = await req.json();
    if (!organization_id) {
      throw new Error("Il parametro 'organization_id' è obbligatorio.");
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) {
        throw new Error("La chiave SUPABASE_SERVICE_ROLE_KEY non è impostata.");
    }

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

    // La query seleziona gli eventi e unisce i dati correlati da 'contacts' e 'event_reminders'
    const { data: events, error } = await supabaseAdmin
        .from('crm_events')
        .select(`
            id,
            google_event_id,
            contact_id,
            event_summary,
            event_start_time,
            event_end_time,
            status,
            created_at,
            contacts (
                name,
                email
            ),
            event_reminders (
                id,
                channel,
                scheduled_at,
                status,
                error_message
            )
        `)
        .eq('organization_id', organization_id)
        .order('event_start_time', { ascending: false });

    if (error) throw error;

    return new Response(JSON.stringify({ events }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Errore in get-all-crm-events:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
