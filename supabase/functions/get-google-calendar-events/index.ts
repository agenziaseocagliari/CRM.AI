declare const Deno: any;

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getOrganizationId } from "../_shared/supabase.ts";
import { getGoogleAccessToken } from "../_shared/google.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { timeMin, timeMax } = await req.json();
    if (!timeMin || !timeMax) {
      throw new Error("Parameters 'timeMin' and 'timeMax' are required.");
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable.");
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
    
    const organization_id = await getOrganizationId(req);
    const googleAccessToken = await getGoogleAccessToken(supabaseAdmin, organization_id);
    
    const calendarApiUrl = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
    calendarApiUrl.searchParams.set("timeMin", timeMin);
    calendarApiUrl.searchParams.set("timeMax", timeMax);
    calendarApiUrl.searchParams.set("singleEvents", "true");
    calendarApiUrl.searchParams.set("orderBy", "startTime");

    const calendarResponse = await fetch(calendarApiUrl, {
      headers: {
        'Authorization': `Bearer ${googleAccessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const calendarData = await calendarResponse.json();
    if (!calendarResponse.ok) {
      throw new Error(`Google API error (${calendarResponse.status}): ${calendarData.error?.message || 'Unknown error'}`);
    }

    return new Response(JSON.stringify({ success: true, events: calendarData.items || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[get-google-calendar-events] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: error.message.includes("integration not found") ? 404 : 500,
    });
  }
});
