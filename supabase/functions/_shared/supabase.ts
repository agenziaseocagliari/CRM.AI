// Import required modules
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

// Create Supabase client with service role key
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
export const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Helper function to get organization_id for a given user
 * @param userId - The user ID from authentication
 * @returns Promise<string> - The organization_id
 */
export async function getOrganizationId(userId: string): Promise<string> {
  console.log(`[getOrganizationId] Fetching organization for user: ${userId}`)
  
  const { data, error } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
  
  console.log('[getOrganizationId] Profile query result:', data, 'Error:', error)
  
  if (error) {
    console.error(`[getOrganizationId] Database error: ${error.message}`)
    throw new Error(`Could not retrieve user profile: ${error.message}`)
  }
  
  if (!data || data.length === 0) {
    console.error('[getOrganizationId] No profile found for user')
    throw new Error('User profile not found')
  }
  
  const profile = data[0]
  
  if (!profile.organization_id) {
    console.error('[getOrganizationId] Profile found but organization_id is missing')
    throw new Error('User profile is incomplete or not associated with an organization.')
  }
  
  console.log(`[getOrganizationId] Successfully retrieved organization_id: ${profile.organization_id}`)
  return profile.organization_id
}