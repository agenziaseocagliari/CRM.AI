// File: supabase/functions/process-scheduled-reminders/index.ts

declare const Deno: {
  env: { get(key: string): string | undefined; };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

const MAX_ATTEMPTS = 3;

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Sicurezza: solo le richieste con una chiave segreta (impostata nel Cron Job) possono eseguire la funzione.
  const cronSecret = Deno.env.get("CRON_SECRET");
  const authHeader = req.headers.get("Authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "Accesso non autorizzato." }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) throw new Error("La chiave SUPABASE_SERVICE_ROLE_KEY non è impostata.");
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
    
    const now = new Date().toISOString();

    // Query per trovare promemoria da inviare:
    // 1. Quelli schedulati il cui `scheduled_at` è nel passato.
    // 2. Quelli falliti che non hanno superato il numero massimo di tentativi.
    const { data: reminders, error: queryError } = await supabaseAdmin
      .from('event_reminders')
      .select(`
        *,
        contacts (*),
        crm_events (event_summary)
      `)
      .lt('scheduled_at', now)
      .in('status', ['scheduled', 'failed'])
      .lt('attempt_count', MAX_ATTEMPTS);

    if (queryError) throw queryError;
    if (!reminders || reminders.length === 0) {
      return new Response(JSON.stringify({ message: "Nessun promemoria da processare." }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`Trovati ${reminders.length} promemoria da processare.`);
    let successCount = 0;
    let failureCount = 0;
    
    // Itera su ogni promemoria e tenta di inviarlo.
    for (const r of reminders) {
      const { id, channel, message, contacts: contact, crm_events: crmEvent, organization_id, attempt_count } = r;

      try {
        if (!contact || !crmEvent) throw new Error("Dati di contatto o evento mancanti.");

        const subject = `Promemoria: ${crmEvent.event_summary}`;

        if (channel === 'WhatsApp') {
          const { error } = await supabaseAdmin.functions.invoke('send-whatsapp-message', {
            body: { organization_id, contact_phone: contact.phone, message, isReminder: true }, // isReminder per bypassare il consumo crediti
          });
          if (error) throw new Error(error.message);
        } else { // Email
          const { error } = await supabaseAdmin.functions.invoke('send-email', {
            body: { organization_id, recipient_email: contact.email, recipient_name: contact.name, subject, html_content: message },
          });
          if (error) throw new Error(error.message);
        }

        // Successo: aggiorna lo stato a 'sent'
        await supabaseAdmin.from('event_reminders').update({ status: 'sent', attempt_count: attempt_count + 1, last_attempt_at: new Date().toISOString() }).eq('id', id);
        successCount++;
        console.log(`Promemoria ${id} inviato con successo.`);

      } catch (err) {
        // Fallimento: aggiorna lo stato a 'failed' e incrementa il contatore dei tentativi.
        failureCount++;
        console.error(`Fallito invio promemoria ${id}:`, err.message);
        await supabaseAdmin.from('event_reminders').update({ status: 'failed', error_message: err.message, attempt_count: attempt_count + 1, last_attempt_at: new Date().toISOString() }).eq('id', id);
      }
    }

    return new Response(JSON.stringify({ 
      message: "Processo completato.",
      processed: reminders.length,
      success: successCount,
      failures: failureCount
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Errore critico in process-scheduled-reminders:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});