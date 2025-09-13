// File: supabase/functions/send-email/index.ts

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
    const { organization_id, recipient_email, recipient_name, subject, html_content } = await req.json();
    if (!organization_id || !recipient_email || !subject || !html_content) {
      throw new Error("Parametri `organization_id`, `recipient_email`, `subject`, e `html_content` sono obbligatori.");
    }
    
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) throw new Error("La chiave SUPABASE_SERVICE_ROLE_KEY non è impostata.");
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

    // Recupera la chiave API Brevo per l'organizzazione
    const { data: settings, error: settingsError } = await supabaseAdmin
        .from('organization_settings')
        .select('brevo_api_key')
        .eq('organization_id', organization_id)
        .single();

    if (settingsError) throw new Error(`Impossibile recuperare le impostazioni: ${settingsError.message}`);
    if (!settings || !settings.brevo_api_key) {
        throw new Error(`Nessuna chiave API Brevo configurata per questa organizzazione.`);
    }
    const brevoApiKey = settings.brevo_api_key;
    
    // Recupera le credenziali del mittente dalle variabili d'ambiente globali
    const brevoSenderEmail = Deno.env.get("BREVO_SENDER_EMAIL");
    const brevoSenderName = Deno.env.get("BREVO_SENDER_NAME");
    if (!brevoSenderEmail || !brevoSenderName) {
        throw new Error("Le variabili d'ambiente BREVO_SENDER_EMAIL e BREVO_SENDER_NAME sono necessarie.");
    }
    
    // Invia l'email tramite l'API di Brevo
    const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "accept": "application/json",
            "api-key": brevoApiKey,
            "content-type": "application/json",
        },
        body: JSON.stringify({
            sender: { name: brevoSenderName, email: brevoSenderEmail },
            to: [{ email: recipient_email, name: recipient_name }],
            subject: subject,
            // Sostituisce i newline con <br> per la formattazione HTML
            htmlContent: `<p>${html_content.replace(/\n/g, '<br>')}</p>`,
        }),
    });

    if (!brevoResponse.ok) {
        const errorBody = await brevoResponse.json();
        throw new Error(`Errore API Brevo (${brevoResponse.status}): ${JSON.stringify(errorBody)}`);
    }

    return new Response(JSON.stringify({ success: true, message: `Email inviata a ${recipient_email}.` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
    });

  } catch (error) {
    console.error("Errore in send-email:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
    });
  }
});