// File: supabase/functions/_shared/supabase.ts

declare const Deno: {
  env: { get(key: string): string | undefined; };
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

/**
 * Retrieves the organization ID for the authenticated user making the request.
 * This is a secure way to identify which organization a user belongs to
 * based on their JWT.
 * 
 * @param req The incoming request object.
 * @returns A promise that resolves to the user's organization ID.
 * @throws An error if the user is not authenticated or their profile is not found.
 */
export async function getOrganizationId(req: Request): Promise<string> {
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
  );

  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) throw new Error("Accesso negato: utente non autenticato o sessione scaduta.");

  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("Impossibile determinare l'organizzazione: profilo utente non trovato.");
  }

  return profile.organization_id;
}