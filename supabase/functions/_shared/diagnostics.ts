// File: supabase/functions/_shared/diagnostics.ts
// deno-lint-ignore-file no-explicit-any
declare const Deno: any;

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";
import { corsHeaders } from "./cors.ts";

// Helper to get user info from JWT for diagnostics
const getUserFromJwt = async (jwt: string) => {
    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
        if (!supabaseUrl || !supabaseAnonKey) return null;

        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { data: { user } } = await supabase.auth.getUser(jwt);
        return user ? { id: user.id, email: user.email, app_metadata: user.app_metadata } : null;
    } catch (e) {
        // This might fail if JWT is invalid, which is okay for logging.
        return null;
    }
};

// Helper to sanitize headers for logging, removing sensitive information.
const sanitizeHeaders = (headers: Headers) => {
    const sanitized: Record<string, string> = {};
    for (const [key, value] of headers.entries()) {
        if (!/authorization|cookie|apikey|x-n8n-api-key/i.test(key)) {
            sanitized[key] = value;
        }
    }
    return sanitized;
};


/**
 * Creates a standardized, detailed error response for debugging.
 * @param error The caught Error object.
 * @param functionName The name of the function where the error occurred.
 * @param req The original Request object.
 * @param requestBody The parsed body of the request.
 * @returns A Response object with a detailed diagnostic payload.
 */
export async function createErrorResponse(
    error: Error,
    functionName: string,
    req: Request,
    requestBody: any
): Promise<Response> {
    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "") || "";
    const user = await getUserFromJwt(jwt);

    const diagnosticPayload = {
        success: false,
        error: error.message,
        diagnostic: {
            timestamp: new Date().toISOString(),
            function_name: functionName,
            environment: Deno.env.get("VERCEL_ENV") || 'development',
            jwt: jwt ? jwt.substring(0, 15) + '...' : 'not_provided', // Log truncated JWT
            request_headers: sanitizeHeaders(req.headers),
            request_body: requestBody,
            user: user,
            error_message: error.message,
            error_stack: error.stack,
        }
    };
    
    console.error(`[${functionName}] Error:`, error.message);

    return new Response(JSON.stringify(diagnosticPayload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
}
