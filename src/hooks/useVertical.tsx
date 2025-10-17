import { useState, useEffect, createContext, useContext } from 'react';
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
  dashboardConfig: any;
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

  useEffect(() => {
    loadVerticalConfig();
  }, []);

  async function loadVerticalConfig() {
    try {
      setLoading(true);
      setError(null);

      // Get current user's vertical (from profiles table)
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Not logged in, use standard
        setVertical('standard');
        await loadConfig('standard');
        setLoading(false);
        return;
      }

      // Get user's vertical from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('vertical')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        throw profileError;
      }

      const userVertical = profile?.vertical || 'standard';
      setVertical(userVertical);

      // Load vertical configuration
      await loadConfig(userVertical);

    } catch (err) {
      console.error('Error loading vertical config:', err);
      setError(err as Error);
      
      // Fallback to standard on error
      setVertical('standard');
      try {
        await loadConfig('standard');
      } catch (fallbackErr) {
        console.error('Fallback to standard failed:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadConfig(verticalKey: string) {
    const { data: verticalConfig, error: configError } = await supabase
      .from('vertical_configurations')
      .select('*')
      .eq('vertical', verticalKey)
      .eq('is_active', true)
      .single();

    if (configError) {
      console.error('Error loading vertical config:', configError);
      throw configError;
    }

    if (verticalConfig) {
      setConfig({
        vertical: verticalConfig.vertical,
        displayName: verticalConfig.display_name,
        description: verticalConfig.description || '',
        icon: verticalConfig.icon || 'Briefcase',
        sidebarConfig: verticalConfig.sidebar_config,
        dashboardConfig: verticalConfig.dashboard_config,
        enabledModules: verticalConfig.enabled_modules || [],
      });
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

// Hook for consuming context
export function useVertical() {
  const context = useContext(VerticalContext);
  if (!context) {
    throw new Error('useVertical must be used within VerticalProvider');
  }
  return context;
}

// Utility hooks
export function useIsInsurance() {
  const { vertical } = useVertical();
  return vertical === 'insurance';
}

export function useIsStandard() {
  const { vertical } = useVertical();
  return vertical === 'standard';
}

export function useHasModule(module: string) {
  const { hasModule } = useVertical();
  return hasModule(module);
}