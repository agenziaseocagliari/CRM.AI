import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    console.log('[TEST-ENV] Testing environment variables availability');

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    const envCheck = {
      SUPABASE_URL: supabaseUrl ? "✅ Available" : "❌ Missing",
      SUPABASE_ANON_KEY: supabaseAnonKey ? "✅ Available" : "❌ Missing",
      SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey ? "✅ Available" : "❌ Missing",
      GEMINI_API_KEY: geminiApiKey ? "✅ Available" : "❌ Missing",
      request_headers: Object.fromEntries(req.headers.entries()),
      timestamp: new Date().toISOString()
    };

    console.log('[TEST-ENV] Environment check result:', envCheck);

    return new Response(JSON.stringify(envCheck, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('[TEST-ENV] Error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});