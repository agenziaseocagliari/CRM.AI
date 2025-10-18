import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Types
export interface VerticalConfig {
  vertical: string;
  displayName: string;
  description: string;
  icon: string;
  sidebarConfig: {
    sections: Array<{
      id: string;
      label: string;
      icon: string;
      path: string;
    }>;
  };
  dashboardConfig: Record<string, unknown>;
  enabledModules: string[];
}

interface VerticalContextType {
  vertical: string;
  config: VerticalConfig | null;
  loading: boolean;
  error: Error | null;
  hasModule: (module: string) => boolean;
  switchVertical: (newVertical: string) => Promise<void>;
}

// Context (will be used by Provider in next task)
const VerticalContext = createContext<VerticalContextType | null>(null);

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

      // Get user's vertical from profile
      console.log('🔍 [loadVerticalConfig] Querying profiles table...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('vertical')
        .eq('id', user.id)
        .single();

      console.log('🔍 [loadVerticalConfig] Profile query result:', profile);
      console.log('🔍 [loadVerticalConfig] Profile query error:', profileError);

      if (profileError) {
        console.error('🔍 [loadVerticalConfig] Profile error:', profileError);
        throw profileError;
      }

      const userVertical = profile?.vertical || 'standard';
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

// Hook to use the vertical context
export function useVertical() {
  const context = useContext(VerticalContext);
  if (!context) {
    throw new Error('useVertical must be used within a VerticalProvider');
  }
  return context;
}

// Export the context for use in utility functions
export { VerticalContext };
