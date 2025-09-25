// Google OAuth utilities for Supabase Edge Functions
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Corrisponde alla struttura della tabella `google_credentials`
export interface GoogleCredential {
  organization_id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  expiry_date: number; // Unix timestamp in seconds
  scope: string;
}

// Salva i token aggiornati nella tabella `google_credentials`
async function saveRefreshedTokens(
    supabase: SupabaseClient, 
    organizationId: string, 
    newTokens: Partial<GoogleCredential>
): Promise<void> {
    const { error } = await supabase
      .from('google_credentials')
      .update(newTokens)
      .eq('organization_id', organizationId)
    
    if (error) {
      console.error(`[google.ts] Failed to save refreshed tokens for org ${organizationId}:`, error)
      throw new Error(`Database error while saving new Google tokens: ${error.message}`);
    }
}


async function refreshGoogleToken(
    supabase: SupabaseClient, 
    credential: GoogleCredential
): Promise<GoogleCredential> {
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
        refresh_token: credential.refresh_token,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })
    
    const data = await response.json();
    if (!response.ok) {
      console.error(`[google.ts] Google token refresh failed for org ${credential.organization_id}:`, data)
      if (data.error === 'invalid_grant') {
        throw new Error("Autorizzazione Google scaduta o revocata. Riconnetti il tuo account dalle Impostazioni.");
      }
      throw new Error(`Google API error during token refresh: ${data.error_description || 'Unknown error'}`);
    }
    
    const updatedCredential: GoogleCredential = {
      ...credential,
      access_token: data.access_token,
      // Google potrebbe restituire un nuovo refresh_token, usalo se disponibile
      refresh_token: data.refresh_token || credential.refresh_token, 
      expiry_date: Math.floor(Date.now() / 1000) + data.expires_in,
    };
    
    await saveRefreshedTokens(supabase, credential.organization_id, {
        access_token: updatedCredential.access_token,
        refresh_token: updatedCredential.refresh_token,
        expiry_date: updatedCredential.expiry_date
    });

    return updatedCredential;
}

/**
 * Recupera un access token Google valido, con validazione e refresh automatico.
 * Ora legge dalla tabella `google_credentials`.
 */
export async function getGoogleAccessToken(supabase: SupabaseClient, organizationId: string): Promise<string> {
    const { data: credential, error: dbError } = await supabase
      .from('google_credentials')
      .select('*')
      .eq('organization_id', organizationId)
      .single<GoogleCredential>()

    if (dbError && dbError.code !== 'PGRST116') {
        throw new Error(`Database error querying for credentials: ${dbError.message}`);
    }

    if (!credential) {
        throw new Error("Google token not available: Token not found. Please connect your Google account in Settings.");
    }
    
    // Validazione critica: un refresh_token è obbligatorio per l'accesso a lungo termine.
    if (!credential.refresh_token) {
         throw new Error("Incomplete token (missing refresh_token). Please re-connect your Google account to authorize offline access.");
    }
    
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const buffer = 60; // 60 secondi di margine di sicurezza
    
    // Se il token è scaduto o sta per scadere, effettua il refresh.
    if (!credential.expiry_date || credential.expiry_date < (nowInSeconds + buffer)) {
        console.log(`[google.ts] Token for org ${organizationId} expired or expiring. Refreshing...`);
        const refreshedCredential = await refreshGoogleToken(supabase, credential);
        return refreshedCredential.access_token;
    }
    
    if(!credential.access_token) {
        throw new Error("The access token is missing but is not expired. Please try again or re-connect your account.");
    }
    
    return credential.access_token;
}