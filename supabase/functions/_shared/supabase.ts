// File: supabase/functions/_shared/supabase.ts

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

/**
 * Extracts the organization ID from the user's profile based on the JWT in the request.
 * This is the secure way to identify the organization for any operation.
 * @param {Request} req - The incoming request object.
 * @returns {Promise<string>} The organization ID.
 * @throws {Error} If authentication fails or the organization cannot be determined.
 */
export async function getOrganizationId(req: Request): Promise<string> {
  console.log(`[getOrganizationId] Function invoked.`);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase URL or Anon Key environment variables.");
  }
  
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    throw new Error("Missing Authorization header.");
  }

  const jwt = authHeader.replace("Bearer ", "");
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
  if (userError) throw new Error(`Authentication failed: ${userError.message}`);
  if (!user) throw new Error("User not found for the provided token.");

  console.log(`[getOrganizationId] Auth context: User ID ${user.id}, Email: ${user.email}`);
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  console.log('[getOrganizationId] Profile select result:', { data: profile, error: profileError });

  if (profileError) throw new Error(`Could not retrieve user profile: ${profileError.message}`);
  if (!profile || !profile.organization_id) {
    throw new Error("User profile is incomplete or not associated with an organization.");
  }

  console.log(`[getOrganizationId] Successfully retrieved organization_id: ${profile.organization_id}`);

  return profile.organization_id;
}
