// File: supabase/functions/_shared/google.ts

declare const Deno: {
  env: { get(key: string): string | undefined; };
};
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

interface GoogleTokenData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  expiry_date: string;
}

/**
 * Retrieves a valid Google access token for an organization, refreshing it if necessary.
 * This is the secure, server-side method for handling Google API authentication.
 *
 * @param supabaseAdmin A Supabase client with service_role permissions.
 * @param organization_id The ID of the organization to get the token for.
 * @returns A promise that resolves to a valid Google access token.
 * @throws An error if the token cannot be retrieved, refreshed, or is missing.
 */
export async function getGoogleAccessToken(supabaseAdmin: SupabaseClient, organization_id: string): Promise<string> {
  // 1. Fetch the organization's stored tokens
  const { data: settings, error: settingsError } = await supabaseAdmin
    .from('organization_settings')
    .select('google_auth_token')
    .eq('organization_id', organization_id)
    .single();

  if (settingsError || !settings?.google_auth_token) {
    throw new Error("Impostazioni di integrazione Google non trovate o token mancante. Per favore, connetti l'account Google nelle impostazioni.");
  }
  
  let tokenData: GoogleTokenData;
  try {
    tokenData = JSON.parse(settings.google_auth_token);
  } catch(e) {
    throw new Error("Il token di autenticazione Google salvato è corrotto. Per favore, riconnetti l'account.");
  }

  // 2. Check if the token is expired (with a 60-second buffer)
  const isExpired = new Date(tokenData.expiry_date).getTime() < (Date.now() + 60000);

  if (!isExpired) {
    return tokenData.access_token;
  }
  
  // 3. If expired, use the refresh token to get a new access token
  console.log(`[Google Auth] Token scaduto per l'organizzazione ${organization_id}. Inizio refresh...`);
  if (!tokenData.refresh_token) {
      throw new Error("Token di accesso scaduto e refresh token non disponibile. L'utente deve autenticarsi nuovamente.");
  }

  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
      throw new Error("I secrets del client Google (ID o Secret) non sono configurati sul server.");
  }

  const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: tokenData.refresh_token,
      grant_type: 'refresh_token',
  });

  const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body,
  });

  const refreshedTokens = await refreshResponse.json();

  if (!refreshResponse.ok) {
      console.error("Errore durante il refresh del token Google:", refreshedTokens);
      throw new Error(`Impossibile aggiornare il token di accesso: ${refreshedTokens.error_description || refreshedTokens.error}`);
  }

  // 4. Update the database with the new token information
  const newTokenData: GoogleTokenData = {
    ...tokenData, // Mantieni il refresh token originale se non ne viene fornito uno nuovo
    access_token: refreshedTokens.access_token,
    expires_in: refreshedTokens.expires_in,
    expiry_date: new Date(Date.now() + refreshedTokens.expires_in * 1000).toISOString(),
    refresh_token: refreshedTokens.refresh_token || tokenData.refresh_token,
  };
  
  const { error: updateError } = await supabaseAdmin
    .from('organization_settings')
    .update({ google_auth_token: JSON.stringify(newTokenData) })
    .eq('organization_id', organization_id);

  if (updateError) {
      console.error("ERRORE CRITICO: Impossibile salvare il nuovo token di accesso Google nel database.", updateError);
      // Nonostante l'errore, restituiamo il nuovo token per completare l'operazione corrente
  }
  
  console.log(`[Google Auth] Token aggiornato con successo per l'organizzazione ${organization_id}.`);

  return newTokenData.access_token;
}