// FIX: The type reference for the Supabase edge-runtime was pointing to an unreliable path on unpkg.com. This has been updated to use esm.sh, a more stable CDN for Deno type definitions, which resolves the error where the type file could not be found and the 'Deno' global was unrecognized.
/// <reference types="https://esm.sh/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { handleCors, corsHeaders } from "../shared/cors.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  return new Response(
    JSON.stringify({ error: "This function is not yet implemented." }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 501, // 501 Not Implemented
    }
  );
});