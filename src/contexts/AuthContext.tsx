import { Session } from '@supabase/supabase-js';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { diagnoseJWT, JWTClaims } from '../lib/jwtUtils';
import { diagnosticLogger } from '../lib/mockDiagnosticLogger';
import { supabase } from '../lib/supabaseClient';

interface AuthContextType {
  session: Session | null;
  userRole: string | null;
  userEmail: string | null;
  userId: string | null;
  organizationId: string | null;
  jwtClaims: JWTClaims | null;
  loading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [jwtClaims, setJwtClaims] = useState<JWTClaims | null>(null);
  const [loading, setLoading] = useState(true);

  // Parse JWT and extract claims
  const parseJWTFromSession = async (session: Session | null) => {
    if (!session?.access_token) {
      diagnosticLogger.info('ðŸ”‘ [AuthContext] No session or access token - clearing claims');
      diagnosticLogger.info('session', 'No session or access token - clearing claims');
      setJwtClaims(null);
      return;
    }

    const diagnostics = diagnoseJWT(session.access_token);
    const claims = diagnostics.claims;

    // Log diagnostics
    diagnosticLogger.info('jwt', 'JWT parsed from session', {
      hasUserRole: diagnostics.hasUserRole,
      userRole: claims?.user_role,
      organizationId: claims?.organization_id,
      tokenAge: diagnostics.tokenAge,
      timeUntilExpiry: diagnostics.timeUntilExpiry,
    });

    if (claims) {
      // Extract user_role from user_metadata if not in top-level (fallback for when hook doesn't work)
      const userMetadata = claims.user_metadata as Record<string, unknown> | undefined;
      const userRole = claims.user_role || userMetadata?.user_role as string | undefined;
      const organizationId = claims.organization_id || userMetadata?.organization_id as string | undefined;
      const isSuperAdmin = claims.is_super_admin || userMetadata?.is_super_admin || userRole === 'super_admin';

      diagnosticLogger.info('🔐 [AuthContext] JWT Claims parsed:', {
        user_role: userRole || 'NOT FOUND',
        email: claims.email,
        sub: claims.sub,
        organization_id: organizationId,
        hasUserRole: !!userRole,
        source: claims.user_role ? 'top-level' : userMetadata?.user_role ? 'user_metadata' : 'missing',
      });

      // CRITICAL: Force logout if user_role is missing from BOTH sources
      if (!userRole) {
        diagnosticLogger.error('❌ [AuthContext] CRITICAL: user_role claim is MISSING from JWT!');
        diagnosticLogger.error('❌ [AuthContext] This session is INVALID. Forcing logout...');

        diagnosticLogger.critical('jwt', 'Missing user_role claim in both top-level and user_metadata', {
          userId: claims.sub,
          email: claims.email,
        }, diagnostics);

        // Force immediate logout
        localStorage.clear();
        sessionStorage.clear();
        await supabase.auth.signOut();

        // Don't set claims - they're invalid
        setJwtClaims(null);
        return;
      }

      // FIX: Set organization_id to "ALL" for super_admin users
      if (userRole === 'super_admin') {
        diagnosticLogger.info('ðŸ" [AuthContext] Super Admin detected - setting organization_id to "ALL"');
        diagnosticLogger.info('session', 'Super Admin detected - setting organization_id to ALL', {
          userId: claims.sub,
          userRole: userRole,
        });
        localStorage.setItem('organization_id', 'ALL');
      }

      // Enrich claims with fallback values from user_metadata
      const enrichedClaims = {
        ...claims,
        user_role: userRole,
        organization_id: organizationId,
        is_super_admin: isSuperAdmin
      };

      setJwtClaims(enrichedClaims);
    } else {
      diagnosticLogger.error('âŒ [AuthContext] Failed to parse JWT claims');
      diagnosticLogger.error('jwt', 'Failed to parse JWT claims', {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
      });
      setJwtClaims(null);
    }
  };

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      diagnosticLogger.info('ðŸ”‘ [AuthContext] Initializing auth context...');
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      await parseJWTFromSession(session);
      setLoading(false);
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      diagnosticLogger.info('ðŸ”‘ [AuthContext] Auth state changed:', event);
      diagnosticLogger.info('auth', `Auth state changed: ${event}`, {
        userId: session?.user?.id,
      });

      setSession(session);

      if (event === 'SIGNED_IN') {
        diagnosticLogger.info('âœ… [AuthContext] User signed in');
        diagnosticLogger.info('auth', 'User signed in', {
          userId: session?.user?.id,
          email: session?.user?.email,
        });
        await parseJWTFromSession(session);
      } else if (event === 'SIGNED_OUT') {
        diagnosticLogger.info('ðŸ‘‹ [AuthContext] User signed out - clearing all claims');
        diagnosticLogger.info('auth', 'User signed out - clearing all claims');
        setJwtClaims(null);
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();
      } else if (event === 'TOKEN_REFRESHED') {
        diagnosticLogger.info('ðŸ”„ [AuthContext] Token refreshed - re-parsing claims and validating');
        diagnosticLogger.info('auth', 'Token refreshed - re-parsing claims and validating', {
          userId: session?.user?.id,
        });
        await parseJWTFromSession(session);
      } else {
        await parseJWTFromSession(session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Derived values from JWT claims
  const userRole = jwtClaims?.user_role || null;
  const userEmail = jwtClaims?.email || null;
  const userId = jwtClaims?.sub || null;
  const organizationId = jwtClaims?.organization_id || null;

  // Role checks
  const isSuperAdmin = userRole === 'super_admin';
  const isAdmin = userRole === 'admin' || isSuperAdmin;
  const isUser = userRole === 'user';

  // Log role mismatch warnings and force logout if needed
  useEffect(() => {
    if (session && !userRole && !loading) {
      diagnosticLogger.error('âŒ [AuthContext] CRITICAL: User is logged in but user_role is NULL!');
      diagnosticLogger.error('âŒ [AuthContext] This means JWT does not contain user_role claim.');
      diagnosticLogger.error('âŒ [AuthContext] Forcing logout to prevent invalid session usage.');

      diagnosticLogger.critical('session', 'User logged in but user_role is NULL - forcing logout', {
        userId: session.user?.id,
        email: session.user?.email,
      });

      // Force logout immediately
      const forceLogout = async () => {
        localStorage.clear();
        sessionStorage.clear();
        await supabase.auth.signOut();
      };

      forceLogout();
    }
  }, [session, userRole, loading]);

  const value: AuthContextType = {
    session,
    userRole,
    userEmail,
    userId,
    organizationId,
    jwtClaims,
    loading,
    isSuperAdmin,
    isAdmin,
    isUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

