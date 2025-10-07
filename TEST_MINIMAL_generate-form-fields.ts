import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// CORS headers inline
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Max-Age": "86400"
};

function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return null;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    console.log("✅ Function bootstrap test - START");
    
    const { prompt, organization_id } = await req.json();
    console.log("✅ JSON parsed successfully");

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Il parametro 'prompt' è obbligatorio." }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }
    
    console.log("✅ Prompt validation passed");

    // Test response semplice senza Gemini per ora
    const testResponse = {
      fields: [
        {
          name: "test_field",
          label: "Test Field",
          type: "text",
          required: true
        }
      ],
      meta: {
        prompt: prompt,
        organization_id: organization_id,
        test_mode: true,
        timestamp: new Date().toISOString()
      }
    };

    console.log("✅ Test response generated");

    return new Response(JSON.stringify(testResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("❌ Error in function:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ 
      error: errorMessage,
      test_mode: true 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});