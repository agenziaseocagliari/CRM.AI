import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
Deno.serve(async (req)=>{
  console.log('🔍 [PIPELINE START] get-google-calendar-events function called');
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  const diagnostic = {
    timestamp: new Date().toISOString(),
    function_name: 'get-google-calendar-events',
    environment: Deno.env.get('ENVIRONMENT') || 'production'
  };
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const authHeader = req.headers.get('Authorization');
    diagnostic.jwt = authHeader?.replace('Bearer ', '') || 'no-jwt-provided';
    const requestHeaders = {};
    req.headers.forEach((value, key)=>{
      if (!key.toLowerCase().includes('authorization')) requestHeaders[key] = value;
    });
    diagnostic.request_headers = requestHeaders;
    // --- Body parse & validation ---
    let requestBody;
    try {
      const text = await req.text();
      requestBody = text ? JSON.parse(text) : {};
      diagnostic.request_body = requestBody;
    } catch (e) {
      diagnostic.request_body = 'invalid-json';
      throw new Error('Invalid JSON body');
    }
    // --- Check presence of token in body, fallback to DB if absent ---
    let googleToken = requestBody?.token;
    if (!googleToken) {
      // Auth user via JWT
      const { data: { user }, error: userError } = await supabase.auth.getUser(diagnostic.jwt || '');
      if (userError) {
        diagnostic.error_message = `Auth error: ${userError.message}`;
        throw new Error(`Authentication failed: ${userError.message}`);
      }
      diagnostic.user = {
        id: user.id,
        email: user.email,
        app_metadata: user.app_metadata
      };
      // Profile by id
      const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (!profileError) {
        diagnostic.profile = profile;
        diagnostic.organization_id = profile?.organization_id;
      }
      // Google token from DB
      const { data: tokenData, error: tokenError } = await supabase.rpc('get_valid_google_token', {
        p_user_id: user.id
      });
      if (tokenError || !tokenData) {
        diagnostic.error_message = `Google token error: ${tokenError?.message || 'No token found'}`;
        throw new Error(`Google token not available: ${tokenError?.message || 'Token not found'}`);
      }
      googleToken = tokenData.access_token;
    }
    // --- Parse date range ---
    const timeMin = requestBody?.timeMin || new Date().toISOString();
    const timeMax = requestBody?.timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    // --- Fetch Google Calendar events ---
    const calendarResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`, {
      headers: {
        'Authorization': `Bearer ${googleToken}`,
        'Content-Type': 'application/json'
      }
    });
    if (!calendarResponse.ok) {
      const errorText = await calendarResponse.text();
      diagnostic.error_message = `Google API error: ${calendarResponse.status} - ${errorText}`;
      throw new Error(`Google Calendar API error: ${calendarResponse.status} - ${errorText}`);
    }
    const calendarData = await calendarResponse.json();
    console.log('✅ Google Calendar events retrieved successfully');
    return new Response(JSON.stringify({
      success: true,
      events: calendarData.items || [],
      diagnostic
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('❌ Error in get-google-calendar-events:', error);
    diagnostic.error_message = error.message || 'Unknown error';
    diagnostic.error_stack = error.stack || 'No stack trace';
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
      diagnostic
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});