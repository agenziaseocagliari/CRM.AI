import { supabase } from './supabaseClient'

export async function getUserOrganization() {

  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Auth error:', authError)
      return { organization_id: null, error: 'Not authenticated' }
    }

    // Get user's organization
    const { data, error } = await supabase
      .from('user_organizations')
      .select(`
        organization_id,
        organization:organizations(id, name, slug)
      `)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Organization lookup error:', error)
      return { organization_id: null, error: error.message }
    }

    if (!data || !data.organization_id) {
      return { organization_id: null, error: 'No organization found for user' }
    }

    return {
      organization_id: data.organization_id,
      organization: data.organization,
      error: null
    }
  } catch (error: unknown) {
    const err = error as Error
    console.error('getUserOrganization error:', err)
    return { organization_id: null, error: err.message }
  }
}