/* eslint-disable react-refresh/only-export-components */
// Note: This file intentionally exports both components (VerticalProvider), hooks (useVertical),
// and types/context. Splitting would break the cohesive context pattern.

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

  const loadVerticalConfig = useCallback(async (retryCount = 0) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 second base delay
    
    console.log('🔍 [loadVerticalConfig] START', { retryCount });
    
    try {
      setLoading(true);
      setError(null);

      // Get current user and session with full JWT details
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('🔍 [loadVerticalConfig] getUser result:', user);
      console.log('🔍 [loadVerticalConfig] getUser error:', userError);
      console.log('🔍 [loadVerticalConfig] getSession error:', sessionError);
      
      // CRITICAL: Log complete JWT structure for diagnostics
      if (session?.access_token) {
        try {
          // Decode JWT to see actual claims (don't verify, just inspect)
          const tokenParts = session.access_token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log('🔑 [JWT] Complete JWT Payload:', payload);
            console.log('🔑 [JWT] sub (user id):', payload.sub);
            console.log('🔑 [JWT] email:', payload.email);
            console.log('🔑 [JWT] user_metadata:', payload.user_metadata);
            console.log('🔑 [JWT] organization_id from root:', payload.organization_id);
            console.log('🔑 [JWT] organization_id from user_metadata:', payload.user_metadata?.organization_id);
            console.log('🔑 [JWT] user_role from root:', payload.user_role);
            console.log('🔑 [JWT] user_role from user_metadata:', payload.user_metadata?.user_role);
            console.log('🔑 [JWT] vertical from user_metadata:', payload.user_metadata?.vertical);
            console.log('🔑 [JWT] iat (issued at):', new Date(payload.iat * 1000).toISOString());
            console.log('🔑 [JWT] exp (expires at):', new Date(payload.exp * 1000).toISOString());
          }
        } catch (jwtError) {
          console.error('❌ [JWT] Failed to decode JWT:', jwtError);
        }
      } else {
        console.warn('⚠️ [JWT] No access token in session');
      }
      
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
      console.log('🔍 [loadVerticalConfig] User app_metadata:', user.app_metadata);

      // Get user's vertical from profile with enhanced error handling and retry logic
      console.log('🔍 [loadVerticalConfig] Querying profiles table...');
      console.log('🔍 [loadVerticalConfig] Query params:', { userId: user.id, timestamp: new Date().toISOString() });
      
      // Use maybeSingle() instead of single() to avoid errors if no profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('vertical, organization_id, user_role, full_name, id, status')
        .eq('id', user.id)
        .maybeSingle();

      console.log('🔍 [loadVerticalConfig] Profile query result:', profile);
      console.log('🔍 [loadVerticalConfig] Profile query error:', profileError);
      
      // Log the actual request that was sent
      if (profileError) {
        console.error('❌ [loadVerticalConfig] Profile query FAILED');
        console.error('❌ [Error Details]:', {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint
        });
      }

      // Enhanced error handling with Italian messages and retry logic
      if (profileError) {
        console.error('🔍 [loadVerticalConfig] Errore durante il recupero del profilo:', {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          userId: user.id,
          userEmail: user.email,
          retryCount
        });
        
        // If it's an RLS policy error, provide helpful context
        if (profileError.code === 'PGRST116' || profileError.message?.includes('policy')) {
          console.error('❌ [loadVerticalConfig] RLS POLICY BLOCKED: Il profilo utente non è accessibile. Verificare le policy RLS.');
          
          // Check if we should retry for transient RLS issues
          if (retryCount < MAX_RETRIES) {
            const delay = RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff
            console.warn(`⏳ [loadVerticalConfig] Tentativo ${retryCount + 1}/${MAX_RETRIES} - Riprovo tra ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return loadVerticalConfig(retryCount + 1);
          } else {
            console.error(`❌ [loadVerticalConfig] Esauriti ${MAX_RETRIES} tentativi - RLS policy continua a bloccare`);
          }
        }
        
        // Don't throw - fall back to standard vertical
        console.warn('⚠️ [loadVerticalConfig] Fallback a vertical standard per errore profilo');
        setVertical('standard');
        await loadConfig('standard');
        setLoading(false);
        return;
      }

      // Handle missing profile gracefully
      if (!profile) {
        console.warn('⚠️ [loadVerticalConfig] Profilo non trovato per utente:', {
          userId: user.id,
          email: user.email
        });
        console.log('🔍 [loadVerticalConfig] Utilizzo vertical standard per profilo mancante');
        setVertical('standard');
        await loadConfig('standard');
        setLoading(false);
        return;
      }

      // Log successful profile retrieval
      console.log('✅ [loadVerticalConfig] Profilo recuperato con successo:', {
        vertical: profile.vertical,
        organizationId: profile.organization_id,
        userRole: profile.user_role,
        fullName: profile.full_name
      });

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
