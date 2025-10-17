import React, { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

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
  switchVertical: (vertical: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const VerticalContext = createContext<VerticalContextType | null>(null);

export function VerticalProvider({ children }: { children: ReactNode }): JSX.Element {
  const [vertical, setVertical] = useState<string>('standard');
  const [config, setConfig] = useState<VerticalConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadVerticalConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user's profile vertical
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setVertical('standard');
        await loadConfig('standard');
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('vertical, organization_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const userVertical = profile?.vertical || 'standard';
      setVertical(userVertical);

      // Load vertical configuration
      await loadConfig(userVertical);

    } catch (err) {
      console.error('Error loading vertical config:', err);
      setError(err as Error);
      // Fallback to standard
      setVertical('standard');
      await loadConfig('standard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVerticalConfig();
  }, [loadVerticalConfig]);

  async function loadConfig(verticalKey: string) {
    const { data: verticalConfig, error: configError } = await supabase
      .from('vertical_configurations')
      .select('*')
      .eq('vertical', verticalKey)
      .single();

    if (configError) throw configError;

    if (verticalConfig) {
      setConfig({
        vertical: verticalConfig.vertical,
        displayName: verticalConfig.display_name,
        description: verticalConfig.description,
        icon: verticalConfig.icon,
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update profile
      await supabase
        .from('profiles')
        .update({ vertical: newVertical })
        .eq('id', user.id);

      // Update organization
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profile?.organization_id) {
        await supabase
          .from('organizations')
          .update({ vertical: newVertical })
          .eq('id', profile.organization_id);
      }

      // Reload config
      await loadVerticalConfig();
      
      // Force page reload to apply changes
      window.location.reload();
    } catch (err) {
      console.error('Error switching vertical:', err);
      throw err;
    }
  }

  async function refresh() {
    await loadVerticalConfig();
  }

  return (
    <VerticalContext.Provider value={{
      vertical,
      config,
      loading,
      error,
      hasModule,
      switchVertical,
      refresh
    }}>
      {children}
    </VerticalContext.Provider>
  );
}

export function useVertical() {
  const context = useContext(VerticalContext);
  if (!context) {
    throw new Error('useVertical must be used within VerticalProvider');
  }
  return context;
}