// check-google-token-status - Deno + Supabase Edge Function
// Version: 2025-09-19.3 (token diagnostic + CORS fix)
console.info('check-google-token-status function starting');

// FIX: Add Deno declaration to resolve TypeScript errors in the Supabase Edge Function environment.
declare const Deno: any;

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
    'Access-Control-Max-Age': '86400'
  };

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // Solo POST permesso
  if (req.method !== 'POST') {
    console.warn('Method not allowed:', req.method);
    return new Response(JSON.stringify({
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }

  let body = null;
  try {
    const txt = await req.text();
    body = txt ? JSON.parse(txt) : {};
  } catch (err) {
    console.error('Invalid JSON body', err);
    return new Response(JSON.stringify({
      error: 'Invalid JSON body',
      details: String(err)
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }

  // Logging per diagnosi reale del payload
  console.info('Request received:', { method: req.method, body });

  const token = body?.token;
  let token_diagnostics = '';

  if (token === undefined || token === null) {
    token_diagnostics = 'Token is missing';
  } else if (typeof token !== 'string') {
    token_diagnostics = `Token type error: expected string, got ${typeof token}`;
    console.warn(token_diagnostics);
    return new Response(JSON.stringify({
      error: token_diagnostics
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } else if (token.trim() === '') {
    token_diagnostics = 'Token is present but empty string';
  } else {
    token_diagnostics = 'Token is present and valid string';
  }

  const responsePayload = {
    status: 'OK',
    received: body,
    token_present: !!token,
    token_diagnostics,
    token_length: token ? token.length : 0,
    function_version: '2025-09-19.3',
    timestamp: new Date().toISOString()
  };

  return new Response(JSON.stringify(responsePayload), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Connection': 'keep-alive'
    }
  });
});