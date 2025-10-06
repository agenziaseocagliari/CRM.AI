// File: supabase/functions/test-org-settings/index.ts

// FIX: Replaced incorrect SQL DDL with a valid Supabase Edge Function.
// This function is designed for debugging and retrieves all settings for a specific organization.
// This resolves all TypeScript compilation errors for this file.

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getOrganizationId } from "../_shared/supabase.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // This function is for debugging, so we will use an admin client.
    // We still authenticate the user to ensure they are logged in.
    await getOrganizationId(req);

    const { organization_id } = await req.json();
    if (!organization_id) {
      throw new Error("Il parametro 'organization_id' è obbligatorio per questo test.");
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) {
      throw new Error("La chiave SUPABASE_SERVICE_ROLE_KEY non è impostata.");
    }
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('organization_settings')
      .select('*')
      .eq('organization_id', organization_id)
      .maybeSingle();

    if (settingsError) {
      throw settingsError;
    }

    // For comprehensive testing, also fetch subscription data.
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('organization_subscriptions')
      .select('*')
      .eq('organization_id', organization_id)
      .maybeSingle();

    if (subError) {
      throw subError;
    }

    const responsePayload = {
      message: `Impostazioni per l'organizzazione ${organization_id}`,
      settings: settings || 'Nessuna impostazione trovata.',
      subscription: subscription || 'Nessuna sottoscrizione trovata.'
    };

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error(`Errore in test-org-settings:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
