// FIX: Added Deno type declaration to resolve errors when accessing environment variables.
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// FIX: Imported the 'serve' function from Deno's standard library to handle HTTP requests.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts'
import { supabase } from '../_shared/supabase.ts'
import { getOrganizationId } from '../_shared/supabase.ts'

serve(async (req) => {
  console.log('[google-token-exchange] Function invoked')
  console.log('[google-token-exchange] Headers:', req.headers)
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, redirectUri } = await req.json()
    console.log('[google-token-exchange] Payload received:', { code: code ? 'present' : 'missing', redirectUri })
    
    if (!code) {
      throw new Error('Authorization code is required')
    }

    // Exchange code for tokens with Google
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      console.error('[google-token-exchange] Token exchange failed:', error)
      throw new Error(`Token exchange failed: ${error}`)
    }

    const tokens = await tokenResponse.json()
    console.log('[google-token-exchange] Tokens received successfully')

    // Get user info from Google
    const userResponse = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`
    )

    if (!userResponse.ok) {
      throw new Error('Failed to get user info from Google')
    }

    const googleUser = await userResponse.json()
    console.log('[google-token-exchange] Google user info retrieved:', { email: googleUser.email })

    // Get the current user from Supabase auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header is required')
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !authData.user) {
      console.error('[google-token-exchange] Auth error:', authError)
      throw new Error('Invalid authentication token')
    }

    console.log('[google-token-exchange] Authenticated user:', authData.user.id)

    // Get user profile to check organization
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', authData.user.id)

    console.log('[google-token-exchange] Profile query result:', profileData, 'Error:', profileError)

    if (profileError) {
      console.error('[google-token-exchange] Profile query error:', profileError.message)
      throw new Error(`Could not retrieve user profile: ${profileError.message}`)
    }

    if (!profileData || profileData.length === 0) {
      console.error('[google-token-exchange] No profile found for user')
      throw new Error('User profile not found')
    }

    const profile = profileData[0]
    
    if (!profile.organization_id) {
      console.error('[google-token-exchange] Profile found but organization_id is missing')
      throw new Error('User profile is incomplete or not associated with an organization')
    }

    console.log('[google-token-exchange] Organization ID retrieved:', profile.organization_id)

    // Store or update Google tokens
    const { error: upsertError } = await supabase
      .from('google_tokens')
      .upsert({
        user_id: authData.user.id,
        organization_id: profile.organization_id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        google_email: googleUser.email,
        updated_at: new Date().toISOString(),
      })

    if (upsertError) {
      console.error('[google-token-exchange] Token storage error:', upsertError)
      throw new Error(`Failed to store Google tokens: ${upsertError.message}`)
    }

    console.log('[google-token-exchange] Google tokens stored successfully')
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Google account connected successfully',
        email: googleUser.email 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('[google-token-exchange] Error:', error.message)
    
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
