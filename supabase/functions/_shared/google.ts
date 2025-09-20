// Google OAuth utilities for Supabase Edge Functions
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface GoogleTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  expiry_date: number // Stored as Unix timestamp (seconds)
  scope: string
  token_type: string
}

async function saveGoogleTokens(supabase: SupabaseClient, organizationId: string, tokens: GoogleTokens): Promise<void> {
    const { error } = await supabase
      .from('organization_settings')
      .update({ google_auth_token: tokens }) // Store as JSONB directly
      .eq('organization_id', organizationId)
    
    if (error) {
      console.error(`[google.ts] Failed to save tokens for org ${organizationId}:`, error)
      throw new Error(`Database error while saving new Google tokens: ${error.message}`);
    }
    console.log(`[google.ts] Successfully saved new tokens for org ${organizationId}.`)
}


async function refreshGoogleToken(supabase: SupabaseClient, refreshToken: string, organizationId: string): Promise<GoogleTokens> {
    console.log(`[google.ts] Refreshing Google token for org ${organizationId}...`)
    
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
    if (!clientId || !clientSecret) {
      throw new Error("Missing Google OAuth credentials in environment secrets.")
    }
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })
    
    const data = await response.json();
    if (!response.ok) {
      console.error(`[google.ts] Google token refresh failed for org ${organizationId}:`, data)
      throw new Error(`Google API error during token refresh: ${data.error_description || 'Unknown error'}`);
    }
    
    const newTokens: GoogleTokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken,
      expires_in: data.expires_in,
      expiry_date: Math.floor(Date.now() / 1000) + data.expires_in,
      scope: data.scope,
      token_type: data.token_type
    }
    
    await saveGoogleTokens(supabase, organizationId, newTokens);
    return newTokens;
}

/**
 * Retrieves a valid Google access token for an organization, refreshing it if necessary.
 * Throws specific errors for different failure scenarios.
 * @param supabase Admin Supabase client
 * @param organizationId The organization's UUID
 * @returns {Promise<string>} A valid Google access token.
 */
export async function getGoogleAccessToken(supabase: SupabaseClient, organizationId: string): Promise<string> {
    const { data: settings, error: settingsError } = await supabase
      .from('organization_settings')
      .select('google_auth_token')
      .eq('organization_id', organizationId)
      .single()

    // 'PGRST116' means 'exact one row not found', which is not a DB error in this case.
    if (settingsError && settingsError.code !== 'PGRST116') {
        throw new Error(`Database error querying for settings: ${settingsError.message}`);
    }

    if (!settings) {
        throw new Error("Google Token Error: No settings record found for this organization. Please connect your account in settings.");
    }
    
    if (!settings.google_auth_token) {
        throw new Error("Google Token Error: Settings found, but the Google token is missing. Please connect your account in settings.");
    }

    const tokens = settings.google_auth_token as GoogleTokens;
    if (!tokens.refresh_token) {
        throw new Error("Google Token Error: Stored token is invalid (missing refresh_token). Please reconnect your Google account.");
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);
    const buffer = 60; // 60-second buffer to be safe
    
    if (tokens.expiry_date < (nowInSeconds + buffer)) {
        console.log(`[google.ts] Token for org ${organizationId} has expired or is about to. Refreshing.`);
        const refreshedTokens = await refreshGoogleToken(supabase, tokens.refresh_token, organizationId);
        return refreshedTokens.access_token;
    }
    
    return tokens.access_token;
}
