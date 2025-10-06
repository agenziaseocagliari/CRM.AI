// File: supabase/functions/consume-credits/index.ts

declare const Deno: {
  env: { get(key: string): string | undefined; };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  console.log(`[consume-credits] Edge Function invoked.`);

  try {
    const payload = await req.json();
    console.log(`[consume-credits] Payload received:`, payload);
    const { organization_id, action_type } = payload;

    if (!organization_id) throw new Error("`organization_id` è obbligatorio.");
    if (!action_type) throw new Error("`action_type` è obbligatorio.");

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    console.log(`[consume-credits] Service role key check: ${serviceRoleKey ? 'PRESENT' : 'MISSING'}`);
    if (!serviceRoleKey) {
        console.error("[consume-credits] CRITICAL: SUPABASE_SERVICE_ROLE_KEY environment variable is missing");
        throw new Error("La variabile d'ambiente SUPABASE_SERVICE_ROLE_KEY non è impostata.");
    }
    
    // Utilizza il client con service_role_key per chiamare la funzione RPC
    // Questo è necessario perché la funzione RPC modifica dati e deve avere i permessi per farlo.
    const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        serviceRoleKey
    );
    
    console.log(`[consume-credits] Invocazione della funzione RPC 'consume_credits_rpc' per org: ${organization_id}, azione: ${action_type}`);

    const { data, error } = await supabaseAdmin.rpc('consume_credits_rpc', {
        p_organization_id: organization_id,
        p_action_type: action_type
    });
    
    console.log(`[consume-credits] RPC 'consume_credits_rpc' result:`, { data, error });

    if (error) {
        console.error("Errore durante l'esecuzione della funzione RPC:", error);
        throw new Error(`Errore database: ${error.message}`);
    }

    // La funzione RPC ora restituisce un JSON con { success, error?, remaining_credits }
    // Lo inoltriamo direttamente al client.
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Errore nella funzione `consume-credits`:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
