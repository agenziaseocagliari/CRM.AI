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
      .update({ google_auth_token: tokens })
      .eq('organization_id', organizationId)
    
    if (error) {
      console.error(`[google.ts] Failed to save tokens for org ${organizationId}:`, error)
      throw new Error(`Database error while saving new Google tokens: ${error.message}`);
    }
}


async function refreshGoogleToken(supabase: SupabaseClient, refreshToken: string, organizationId: string): Promise<GoogleTokens> {
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
    if (!clientId || !clientSecret) {
      throw new Error("Missing Google OAuth credentials in environment secrets.")
    }
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-form-urlencoded' },
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
      if (data.error === 'invalid_grant') {
        throw new Error("Autorizzazione Google scaduta o revocata. Riconnetti il tuo account dalle Impostazioni.");
      }
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
 * Retrieves a valid Google access token, with robust validation and refreshing.
 */
export async function getGoogleAccessToken(supabase: SupabaseClient, organizationId: string): Promise<string> {
    const { data: settings, error: settingsError } = await supabase
      .from('organization_settings')
      .select('google_auth_token')
      .eq('organization_id', organizationId)
      .single()

    if (settingsError && settingsError.code !== 'PGRST116') {
        throw new Error(`Database error querying for settings: ${settingsError.message}`);
    }

    if (!settings || !settings.google_auth_token) {
        throw new Error("Token Google non disponibile: Collega il tuo account Google nelle Impostazioni.");
    }
    
    if (typeof settings.google_auth_token !== 'object' || Array.isArray(settings.google_auth_token)) {
        throw new Error("Formato del token non valido. Ricollega il tuo account Google nelle Impostazioni.");
    }

    const tokens = settings.google_auth_token as GoogleTokens;

    // CRITICAL: A refresh token is absolutely required for long-term access.
    if (!tokens.refresh_token) {
         throw new Error("Token incompleto (refresh_token mancante). Ricollega il tuo account Google per autorizzare l'accesso offline.");
    }
    
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const buffer = 60; // 60-second safety buffer
    
    if (!tokens.expiry_date || tokens.expiry_date < (nowInSeconds + buffer)) {
        const refreshedTokens = await refreshGoogleToken(supabase, tokens.refresh_token, organizationId);
        return refreshedTokens.access_token;
    }
    
    if(!tokens.access_token) {
        throw new Error("Il token di accesso è mancante ma non è scaduto. Riprova o ricollega l'account.");
    }
    
    return tokens.access_token;
}
