/**
 * Minimal CSV Upload Test Function
 */

// Import Supabase client for database integration
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS Headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Max-Age": "86400"
};

// Main handler
Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Log request
    console.log('🚀 CSV Upload request received');
    
    // Check environment variables first
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing environment variables');
      return new Response(JSON.stringify({ 
        error: "Environment variables missing",
        debug: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseServiceKey
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    console.log('✅ Environment variables OK');
    
    // For now, just return success to test if function boots
    return new Response(JSON.stringify({
      success: true,
      message: "CSV parser is working",
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error('🚨 Unexpected error:', error);
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});