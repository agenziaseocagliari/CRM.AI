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
      // Se il refresh token non è valido, l'utente deve autenticarsi di nuovo.
      if (data.error === 'invalid_grant') {
        throw new Error("Autorizzazione Google scaduta. Riconnetti il tuo account.");
      }
      throw new Error(`Google API error during token refresh: ${data.error_description || 'Unknown error'}`);
    }
    
    const newTokens: GoogleTokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken, // Google non sempre restituisce un nuovo refresh token
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
 * Throws specific, user-friendly errors for different failure scenarios.
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

    if (settingsError && settingsError.code !== 'PGRST116') {
        throw new Error(`Database error querying for settings: ${settingsError.message}`);
    }

    if (!settings || !settings.google_auth_token) {
        throw new Error("Token Google non trovato. Vai su Impostazioni per collegare il tuo account.");
    }
    
    // Validazione robusta per prevenire crash su dati malformati.
    if (typeof settings.google_auth_token !== 'object' || Array.isArray(settings.google_auth_token)) {
        throw new Error("Il formato del token Google salvato non è valido. Ricollega il tuo account Google nelle impostazioni.");
    }

    const tokens = settings.google_auth_token as GoogleTokens;

    if (!tokens.refresh_token) {
         throw new Error("Il token salvato è incompleto (manca il refresh_token). Ricollega il tuo account Google per consentire l'accesso offline.");
    }
    
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const buffer = 60; // 60-second buffer to be safe
    
    if (!tokens.expiry_date || tokens.expiry_date < (nowInSeconds + buffer)) {
        console.log(`[google.ts] Token for org ${organizationId} has expired or is about to. Refreshing.`);
        const refreshedTokens = await refreshGoogleToken(supabase, tokens.refresh_token, organizationId);
        return refreshedTokens.access_token;
    }
    
    if(!tokens.access_token) {
        throw new Error("Il token di accesso è mancante ma non è ancora scaduto. Riprova o ricollega l'account.");
    }
    
    return tokens.access_token;
}