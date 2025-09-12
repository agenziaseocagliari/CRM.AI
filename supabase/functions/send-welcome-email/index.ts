// File: supabase/functions/send-welcome-email/index.ts

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// @deno-types="https://esm.sh/@google/genai@1.19.0/dist/index.d.ts"
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { GoogleGenAI, GenerateContentResponse } from "https://esm.sh/@google/genai@1.19.0";
import { handleCors, corsHeaders } from "shared/cors.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const brevoSenderEmail = Deno.env.get("BREVO_SENDER_EMAIL");
    const brevoSenderName = Deno.env.get("BREVO_SENDER_NAME");

    if (!geminiApiKey || !supabaseUrl || !serviceRoleKey) {
      throw new Error("Mancano le variabili d'ambiente necessarie (GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).");
    }
    if (!brevoSenderEmail || !brevoSenderName) {
        throw new Error("Le variabili d'ambiente BREVO_SENDER_EMAIL e BREVO_SENDER_NAME sono necessarie per inviare email. Impostale nei Secrets della funzione.");
    }

    const { record: newContact } = await req.json();
    if (!newContact || !newContact.email || !newContact.organization_id) {
        return new Response(JSON.stringify({ error: "Dati del contatto non validi." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: settings, error: settingsError } = await supabaseAdmin
        .from('organization_settings')
        .select('brevo_api_key')
        .eq('organization_id', newContact.organization_id)
        .single();

    if (settingsError) throw new Error(`Impossibile recuperare le impostazioni: ${settingsError.message}`);
    if (!settings || !settings.brevo_api_key) {
        console.warn(`Nessuna chiave API Brevo trovata per l'organizzazione ${newContact.organization_id}. Email non inviata.`);
        return new Response(JSON.stringify({ message: "Nessuna chiave API Brevo configurata." }), {
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
    const brevoApiKey = settings.brevo_api_key;

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const emailGenPrompt = `
      Scrivi un corpo email di benvenuto caloroso e professionale per un nuovo contatto che si è appena iscritto.
      Il nome del contatto è ${newContact.name}.
      Sii conciso, amichevole e concludi invitando a rispondere in caso di domande.
      Inizia direttamente con il saluto (es. "Ciao ${newContact.name},").
      **Non includere assolutamente una riga per l'oggetto (tipo "Oggetto: ..."). Scrivi solo il corpo del testo.**
    `;
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: emailGenPrompt,
    });
    const emailBody = response.text.trim();

    const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "accept": "application/json",
            "api-key": brevoApiKey,
            "content-type": "application/json",
        },
        body: JSON.stringify({
            sender: { name: brevoSenderName, email: brevoSenderEmail },
            to: [{ email: newContact.email, name: newContact.name }],
            subject: `Benvenuto in Guardian AI, ${newContact.name}!`,
            htmlContent: `<p>${emailBody.replace(/\n/g, '<br>')}</p>`,
        }),
    });

    if (!brevoResponse.ok) {
        const errorBody = await brevoResponse.json();
        throw new Error(`Errore API Brevo: ${JSON.stringify(errorBody)}`);
    }

    return new Response(JSON.stringify({ message: `Email di benvenuto inviata a ${newContact.email}.` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
    });

  } catch (error) {
    console.error("Errore nella funzione send-welcome-email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
    });
  }
});
