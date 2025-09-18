// File: supabase/functions/run-debug-query/index.ts

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
    const { query_name } = await req.json();
    if (!query_name) {
      throw new Error("Il parametro 'query_name' è obbligatorio.");
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) {
      throw new Error("La chiave SUPABASE_SERVICE_ROLE_KEY non è impostata.");
    }
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

    let resultData;
    let resultError;

    switch (query_name) {
      case 'get_latest_logs':
        const { data: logsData, error: logsError } = await supabaseAdmin
          .from('debug_logs')
          .select('*')
          .order('logged_at', { ascending: false })
          .limit(10);
        resultData = logsData;
        resultError = logsError;
        break;

      case 'clear_logs':
        const { error: deleteError } = await supabaseAdmin
          .from('debug_logs')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        resultData = { message: "Tutti i log di debug sono stati eliminati." };
        resultError = deleteError;
        break;

      default:
        throw new Error(`Query non riconosciuta: ${query_name}`);
    }

    if (resultError) {
      throw resultError;
    }

    return new Response(JSON.stringify(resultData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error(`Errore in run-debug-query:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});