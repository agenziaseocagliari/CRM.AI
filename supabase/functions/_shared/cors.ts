// File: supabase/functions/_shared/cors.ts

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-n8n-api-key",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Max-Age": "86400"
};

/**
 * Handles CORS preflight (OPTIONS) requests.
 * @param {Request} req - The incoming request.
 * @returns {Response | null} A response for the OPTIONS request, or null if it's not an OPTIONS request.
 */
export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return null;
}
