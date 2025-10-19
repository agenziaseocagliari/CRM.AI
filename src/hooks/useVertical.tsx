import { VerticalConfig, VerticalContext } from '@/contexts/VerticalContext';
import { supabase } from '@/lib/supabaseClient';
import React, { useCallback, useEffect, useState } from 'react';

// Provider component
export function VerticalProvider({ children }: { children: React.ReactNode }) {
  const [vertical, setVertical] = useState<string>('standard');
  const [config, setConfig] = useState<VerticalConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadVerticalConfig = useCallback(async () => {
    console.log('🔍 [loadVerticalConfig] START');
    
    try {
      setLoading(true);
      setError(null);

      // Get current user's vertical (from profiles table)
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔍 [loadVerticalConfig] getUser result:', user);
      
      if (!user) {
        console.log('🔍 [loadVerticalConfig] No user, using standard');
        setVertical('standard');
        await loadConfig('standard');
        setLoading(false);
        return;
      }

      console.log('🔍 [loadVerticalConfig] User ID:', user.id);
      console.log('🔍 [loadVerticalConfig] User email:', user.email);
      console.log('🔍 [loadVerticalConfig] User metadata:', user.user_metadata);

      // Get user's vertical from profile with multi-tenancy validation
      console.log('🔍 [loadVerticalConfig] Querying profiles table...');
      
      // Get organization_id from JWT claims
      const organizationId = user.user_metadata?.organization_id;
      console.log('🔍 [loadVerticalConfig] Organization ID from JWT:', organizationId);
      
      if (!organizationId) {
        console.error('🔍 [loadVerticalConfig] No organization_id in JWT claims');
        throw new Error('Organization ID not found in authentication claims');
      }

      // Fetch profile with organization_id for multi-tenant validation
      // CRITICAL: Query must validate BOTH user.id AND organization_id to prevent cross-org access
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('vertical, organization_id')
        .eq('id', user.id)
        .eq('organization_id', organizationId)
        .single();

      console.log('🔍 [loadVerticalConfig] Profile query result:', profile);
      console.log('🔍 [loadVerticalConfig] Profile query error:', profileError);

      // Handle specific error cases
      if (profileError?.code === 'PGRST116') {
        // Profile not found - use fallback
        console.warn('🔍 [loadVerticalConfig] Profile not found, using default vertical');
        setVertical('standard');
        await loadConfig('standard');
        setLoading(false);
        return;
      }

      if (profileError) {
        console.error('🔍 [loadVerticalConfig] Profile error:', profileError);
        throw new Error(`Profile lookup failed: ${profileError.message}`);
      }

      if (!profile) {
        console.warn('🔍 [loadVerticalConfig] Profile is null, using default vertical');
        setVertical('standard');
        await loadConfig('standard');
        setLoading(false);
        return;
      }

      const userVertical = profile.vertical || 'standard';
      console.log('🔍 [loadVerticalConfig] Determined vertical:', userVertical);
      console.log(`🔍 [loadVerticalConfig] User ${user.email} has vertical: ${userVertical}`);
      setVertical(userVertical);

      // Load vertical configuration
      await loadConfig(userVertical);

    } catch (err) {
      console.error('🔍 [loadVerticalConfig] ERROR:', err);
      setError(err as Error);
      
      // Fallback to standard on error
      console.log('🔍 [loadVerticalConfig] Falling back to standard due to error');
      setVertical('standard');
      try {
        await loadConfig('standard');
      } catch (fallbackErr) {
        console.error('🔍 [loadVerticalConfig] Fallback to standard failed:', fallbackErr);
      }
    } finally {
      console.log('🔍 [loadVerticalConfig] COMPLETE');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('🔍 [VerticalProvider] Mounted');
    
    // Listen for auth state changes to properly initialize vertical
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔍 [Auth] Event:', event);
        console.log('🔍 [Auth] Session:', session);
        console.log('🔍 [Auth] User:', session?.user);
        console.log('� [Auth] User metadata:', session?.user?.user_metadata);
        console.log('�🔄 Auth state changed:', event, 'Session exists:', !!session);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || (event === 'INITIAL_SESSION' && session)) {
          console.log('🔍 [Auth] Condition met, loading vertical config...');
          console.log('✅ Loading vertical config for authenticated user');
          loadVerticalConfig();
        } else if (event === 'SIGNED_OUT') {
          console.log('🚪 User signed out, resetting to standard');
          setVertical('standard');
          loadConfig('standard').catch(console.error);
        }
      }
    );

    // Also load immediately if already authenticated
    loadVerticalConfig();

    return () => {
      console.log('🧹 Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, [loadVerticalConfig]);

  async function loadConfig(verticalKey: string) {
    console.log('🔍 [loadConfig] Loading config for:', verticalKey);
    
    const { data: verticalConfig, error: configError } = await supabase
      .from('vertical_configurations')
      .select('*')
      .eq('vertical', verticalKey)
      .eq('is_active', true)
      .single();

    console.log('🔍 [loadConfig] Config query result:', verticalConfig);
    console.log('🔍 [loadConfig] Config query error:', configError);

    if (configError) {
      console.error('🔍 [loadConfig] Config error:', configError);
      throw configError;
    }

    if (verticalConfig) {
      const config = {
        vertical: verticalConfig.vertical,
        displayName: verticalConfig.display_name,
        description: verticalConfig.description || '',
        icon: verticalConfig.icon || 'Briefcase',
        sidebarConfig: verticalConfig.sidebar_config,
        dashboardConfig: verticalConfig.dashboard_config,
        enabledModules: verticalConfig.enabled_modules || [],
      };
      
      console.log('🔍 [loadConfig] Setting config:', config);
      console.log('🔍 [loadConfig] Sidebar sections count:', config.sidebarConfig?.sections?.length);
      setConfig(config);
    }
  }

  function hasModule(module: string): boolean {
    return config?.enabledModules?.includes(module) ?? false;
  }

  async function switchVertical(newVertical: string) {
    try {
      setLoading(true);
      setError(null);
      
      // Update user's profile with new vertical
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ vertical: newVertical })
          .eq('id', user.id);

        if (updateError) {
          console.error('Error updating profile vertical:', updateError);
          throw updateError;
        }
      }

      // Load new configuration
      setVertical(newVertical);
      await loadConfig(newVertical);
    } catch (err) {
      console.error('Error switching vertical:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <VerticalContext.Provider value={{
      vertical,
      config,
      loading,
      error,
      hasModule,
      switchVertical
    }}>
      {children}
    </VerticalContext.Provider>
  );
}

// Set display name for React DevTools and Fast Refresh
VerticalProvider.displayName = 'VerticalProvider';
