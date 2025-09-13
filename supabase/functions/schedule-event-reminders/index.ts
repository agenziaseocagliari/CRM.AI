// File: supabase/functions/schedule-event-reminders/index.ts

declare const Deno: {
  env: { get(key: string): string | undefined; };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

const ACTION_TYPE_PREFIX = 'schedule_reminder_'; // Es. schedule_reminder_email

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { organization_id, crm_event_id, event_start_time, reminders } = await req.json();
    if (!organization_id || !crm_event_id || !event_start_time || !reminders) {
      throw new Error("Parametri `organization_id`, `crm_event_id`, `event_start_time`, e `reminders` sono obbligatori.");
    }
    if (!Array.isArray(reminders) || reminders.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "Nessun promemoria da schedulare." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );
    
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) throw new Error("La chiave SUPABASE_SERVICE_ROLE_KEY non è impostata.");
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
    
    // Recupera il contact_id dall'evento CRM per associarlo al promemoria
    const { data: eventData, error: eventError } = await supabaseAdmin
        .from('crm_events')
        .select('contact_id')
        .eq('id', crm_event_id)
        .single();
    if (eventError || !eventData) throw new Error(`Evento CRM con ID ${crm_event_id} non trovato.`);


    const startTime = new Date(event_start_time);
    const recordsToInsert = [];

    for (const reminder of reminders) {
      // Consuma crediti per ogni promemoria schedulato
      const action_type = `${ACTION_TYPE_PREFIX}${reminder.channel.toLowerCase()}`;
      const { data: creditData, error: creditError } = await supabaseClient.functions.invoke('consume-credits', {
          body: { organization_id, action_type },
      });
      if (creditError) throw new Error(`Errore di rete nella verifica dei crediti: ${creditError.message}`);
      if (creditData.error) throw new Error(`Errore nella verifica crediti: ${creditData.error}`);
      if (!creditData.success) throw new Error(`Crediti insufficienti per schedulare un promemoria via ${reminder.channel}.`);

      const scheduledAt = new Date(startTime.getTime() - reminder.minutesBefore * 60 * 1000);
      recordsToInsert.push({
        organization_id,
        crm_event_id,
        contact_id: eventData.contact_id,
        channel: reminder.channel,
        scheduled_at: scheduledAt.toISOString(),
        message: reminder.message,
        status: 'scheduled',
      });
    }

    const { error: insertError } = await supabaseAdmin
        .from('event_reminders')
        .insert(recordsToInsert);

    if (insertError) throw insertError;
    
    return new Response(JSON.stringify({ success: true, message: `${recordsToInsert.length} promemoria schedulati.` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Errore in schedule-event-reminders:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});