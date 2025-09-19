// File: supabase/functions/update-google-event/index.ts

declare const Deno: { env: { get(key: string): string | undefined; }; };

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { getGoogleAccessToken } from "../_shared/google.ts";
import { getOrganizationId } from "../_shared/supabase.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { 
        google_event_id, 
        event_summary, 
        event_description, 
        event_start_time, 
        event_end_time 
    } = await req.json();

    if (!google_event_id || !event_summary || !event_start_time || !event_end_time) {
      throw new Error("Missing required fields: google_event_id, event_summary, event_start_time, and event_end_time are required.");
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable.");
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);
    
    const organization_id = await getOrganizationId(req);
    const googleAccessToken = await getGoogleAccessToken(supabaseAdmin, organization_id);

    const googleEvent = {
      summary: event_summary,
      description: event_description || '',
      start: { dateTime: event_start_time, timeZone: 'UTC' },
      end: { dateTime: event_end_time, timeZone: 'UTC' },
    };

    const apiResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${google_event_id}?sendUpdates=all`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${googleAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(googleEvent),
    });

    const responseData = await apiResponse.json();
    if (!apiResponse.ok) {
        throw new Error(`Google API error (${apiResponse.status}): ${responseData.error?.message || 'Unknown error'}`);
    }
    
    return new Response(JSON.stringify({ success: true, event: responseData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[update-google-event] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
