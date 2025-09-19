// File: supabase/functions/delete-google-event/index.ts

declare const Deno: {
  env: { get(key: string): string | undefined; };
};

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getGoogleAccessToken } from "../_shared/google.ts";
import { getOrganizationId } from '../_shared/supabase.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { google_event_id, crm_event_id } = await req.json();
    if (!crm_event_id) {
        throw new Error("The `crm_event_id` parameter is required.");
    }

    const organization_id = await getOrganizationId(req);
    
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set.");
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

    if (google_event_id) {
        try {
            const googleAccessToken = await getGoogleAccessToken(supabaseAdmin, organization_id);
            const calendarApiUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${google_event_id}?sendUpdates=all`;
            
            const apiResponse = await fetch(calendarApiUrl, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${googleAccessToken}` },
            });
            
            // 410 Gone means it's already deleted, which is a success case for us.
            if (apiResponse.status !== 204 && apiResponse.status !== 410) {
                const errorBody = await apiResponse.json();
                throw new Error(`Failed to delete event from Google Calendar: ${errorBody.error.message}`);
            }
            console.log(`Event ${google_event_id} deleted from Google Calendar (Status: ${apiResponse.status}).`);
        } catch (e) {
            // Log the Google API error but don't block the CRM update.
            console.error(`Non-fatal error deleting Google Event ${google_event_id}: ${e.message}. Proceeding to cancel CRM event.`);
        }
    }

    // Always update the event status in the CRM to 'cancelled'.
    const { error: updateError } = await supabaseAdmin
        .from('crm_events')
        .update({ status: 'cancelled' })
        .eq('id', crm_event_id)
        .eq('organization_id', organization_id); // Security check

    if (updateError) {
        console.error("CRITICAL ERROR: Could not update the CRM event status.", updateError);
        throw new Error("The event was deleted from Google, but the CRM status could not be updated.");
    }

    return new Response(JSON.stringify({ success: true, message: "Event cancelled and synchronized." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("[delete-google-event] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500, 
    });
  }
});
