import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { diagnoseJWT, JWTClaims } from '../lib/jwtUtils';

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
      console.log('🔑 [AuthContext] No session or access token - clearing claims');
      setJwtClaims(null);
      return;
    }

    const diagnostics = diagnoseJWT(session.access_token);
    const claims = diagnostics.claims;

    if (claims) {
      console.log('🔑 [AuthContext] JWT Claims parsed:', {
        user_role: claims.user_role || 'NOT FOUND',
        email: claims.email,
        sub: claims.sub,
        organization_id: claims.organization_id,
        hasUserRole: !!claims.user_role,
      });

      // CRITICAL: Force logout if user_role is missing
      if (!claims.user_role) {
        console.error('❌ [AuthContext] CRITICAL: user_role claim is MISSING from JWT!');
        console.error('❌ [AuthContext] This session is INVALID. Forcing logout...');
        
        // Force immediate logout
        localStorage.clear();
        sessionStorage.clear();
        await supabase.auth.signOut();
        
        // Don't set claims - they're invalid
        setJwtClaims(null);
        return;
      }

      // FIX: Set organization_id to "ALL" for super_admin users
      if (claims.user_role === 'super_admin') {
        console.log('🔐 [AuthContext] Super Admin detected - setting organization_id to "ALL"');
        localStorage.setItem('organization_id', 'ALL');
      }

      setJwtClaims(claims);
    } else {
      console.error('❌ [AuthContext] Failed to parse JWT claims');
      setJwtClaims(null);
    }
  };

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      console.log('🔑 [AuthContext] Initializing auth context...');
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      await parseJWTFromSession(session);
      setLoading(false);
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔑 [AuthContext] Auth state changed:', event);
      
      setSession(session);
      
      if (event === 'SIGNED_IN') {
        console.log('✅ [AuthContext] User signed in');
        await parseJWTFromSession(session);
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 [AuthContext] User signed out - clearing all claims');
        setJwtClaims(null);
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 [AuthContext] Token refreshed - re-parsing claims and validating');
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
      console.error('❌ [AuthContext] CRITICAL: User is logged in but user_role is NULL!');
      console.error('❌ [AuthContext] This means JWT does not contain user_role claim.');
      console.error('❌ [AuthContext] Forcing logout to prevent invalid session usage.');
      
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
