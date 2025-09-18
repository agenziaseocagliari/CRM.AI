// Google OAuth utilities for Supabase Edge Functions
// FIX: Added a Deno global declaration to resolve TypeScript errors in the Supabase Edge Function environment.
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface GoogleTokens {
  access_token: string
  refresh_token: string
  expires_in?: number // expires_in is for refresh, not always present
  expiry_date?: number // This is what we'll use, calculated from expires_in
  expires_at?: number // Legacy, keeping for compatibility
}

// FIX: Refactored functions to accept a Supabase client instance, making them more modular.
export async function getGoogleTokens(supabase: SupabaseClient, organizationId: string): Promise<GoogleTokens | null> {
  try {
    console.log('🔍 Getting Google tokens for organization:', organizationId)
    
    const { data: settings, error } = await supabase
      .from('organization_settings')
      .select('google_auth_token')
      .eq('organization_id', organizationId)
      .single()
    
    if (error) {
      console.error('❌ Error fetching settings:', error)
      return null
    }
    
    if (!settings?.google_auth_token) {
      console.error('⚠️  No google_auth_token found in settings')
      return null
    }

    // DIAGNOSTIC LOGGING - RAW TOKEN DEBUG
    console.error('🔬 TOKEN RAW DEBUG:', {
      typeof: typeof settings.google_auth_token,
      rawValue: String(settings.google_auth_token).slice(0, 100),
      fullLength: String(settings.google_auth_token).length,
      isString: typeof settings.google_auth_token === 'string',
      isNull: settings.google_auth_token === null,
      isUndefined: settings.google_auth_token === undefined
    })
    
    let tokens: GoogleTokens
    try {
      tokens = typeof settings.google_auth_token === 'string' ? JSON.parse(settings.google_auth_token) : settings.google_auth_token;
      console.log('✅ Successfully parsed Google tokens')
    } catch (parseError) {
      console.error('❌ Error parsing google_auth_token:', parseError)
      console.error('🔬 Raw token that failed parsing:', settings.google_auth_token)
      return null
    }
    
    // Check if token is expired
    const expiryTimestamp = tokens.expiry_date || tokens.expires_at;
    const now = Math.floor(Date.now() / 1000)
    if (expiryTimestamp && expiryTimestamp < now) {
      console.log('🔄 Token expired, attempting refresh...')
      const refreshedTokens = await refreshGoogleToken(supabase, tokens.refresh_token, organizationId)
      if (refreshedTokens) {
        return refreshedTokens
      }
      console.error('❌ Failed to refresh expired token')
      return null
    }
    
    return tokens
  } catch (error) {
    console.error('❌ Unexpected error in getGoogleTokens:', error)
    return null
  }
}

// FIX: Refactored function to accept a Supabase client instance.
export async function refreshGoogleToken(supabase: SupabaseClient, refreshToken: string, organizationId: string): Promise<GoogleTokens | null> {
  try {
    console.log('🔄 Refreshing Google token for organization:', organizationId)
    
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
    
    if (!clientId || !clientSecret) {
      console.error('❌ Missing Google OAuth credentials in environment')
      return null
    }
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Google token refresh failed:', response.status, errorText)
      return null
    }
    
    const data = await response.json()
    
    const newTokens: GoogleTokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken, // Keep old refresh token if not provided
      expiry_date: Math.floor(Date.now() / 1000) + data.expires_in,
    }
    
    // Save the new tokens
    await saveGoogleTokens(supabase, organizationId, newTokens);
    
    console.log('✅ Google token refreshed successfully')
    return newTokens
  } catch (error) {
    console.error('❌ Unexpected error in refreshGoogleToken:', error)
    return null
  }
}

// FIX: Refactored function to accept a Supabase client instance.
export async function saveGoogleTokens(supabase: SupabaseClient, organizationId: string, tokens: GoogleTokens): Promise<boolean> {
  try {
    console.log('💾 Saving Google tokens for organization:', organizationId)
    
    const { error } = await supabase
      .from('organization_settings')
      .update({ google_auth_token: JSON.stringify(tokens) })
      .eq('organization_id', organizationId)
    
    if (error) {
      console.error('❌ Error saving tokens:', error)
      return false
    }
    
    console.log('✅ Google tokens saved successfully')
    return true
  } catch (error) {
    console.error('❌ Unexpected error in saveGoogleTokens:', error)
    return false
  }
}