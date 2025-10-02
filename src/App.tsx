import React, { useEffect } from 'react';
// FIX: Corrected imports for Routes, Route, useNavigate, useLocation, and Navigate from 'react-router-dom' to resolve module export errors.
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

import { useCrmData } from './hooks/useCrmData';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabaseClient';

import { MainLayout } from './components/MainLayout';
import { Dashboard } from './components/Dashboard';
import { Opportunities } from './components/Opportunities';
import { Contacts } from './components/Contacts';
import { Forms } from './components/Forms';
import { Automations } from './components/Automations';
import { Settings, GoogleAuthCallback } from './components/Settings';
import { Login } from './components/Login';
import { ForgotPassword } from './components/ForgotPassword';
import { ResetPassword } from './components/ResetPassword';
import { HomePage } from './components/HomePage';
import { PublicForm } from './components/PublicForm';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';
import { CalendarView } from './components/CalendarView';
import { Meetings } from './components/Meetings';

// Super Admin Imports
import { SuperAdminLayout } from './components/superadmin/SuperAdminLayout';
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';
import { Customers as SuperAdminCustomers } from './components/superadmin/Customers';
import { Payments as SuperAdminPayments } from './components/superadmin/Payments';
import { AiWorkflows as SuperAdminAiWorkflows } from './components/superadmin/AiWorkflows';
import { AuditLogs as SuperAdminAuditLogs } from './components/superadmin/AuditLogs';
import { AutomationAgents } from './components/superadmin/AutomationAgents';
import { APIIntegrationsManager } from './components/superadmin/APIIntegrationsManager';

// Debug Panel
import { DebugPanel } from './components/DebugPanel';


const App: React.FC = () => {
  const { session, userRole, loading, jwtClaims } = useAuth();
  const crmData = useCrmData();
  const navigate = useNavigate();
  const location = useLocation();

  // JWT Health Check - warn if user_role is missing and force logout
  useEffect(() => {
    if (session && jwtClaims && !userRole) {
      console.error('❌ [App] JWT TOKEN DEFECT: user_role is missing from JWT');
      
      toast.error(
        (t) => (
          <div className="space-y-3">
            <p className="font-semibold text-lg">⚠️ Sessione Non Valida</p>
            <p className="text-sm">
              La tua sessione è scaduta o non valida. Devi effettuare nuovamente il login con le credenziali {' '}
              <span className="font-bold">superadmin</span> o del tuo account.
            </p>
            <p className="text-xs text-gray-600">
              IMPORTANTE: Ricaricare la pagina non risolverà il problema. È necessario un nuovo login.
            </p>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                localStorage.clear();
                sessionStorage.clear();
                await supabase.auth.signOut();
                window.location.href = '/login?session_expired=true';
              }}
              className="w-full mt-2 bg-red-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-red-700"
            >
              🚪 Logout e Torna al Login
            </button>
          </div>
        ),
        { duration: Infinity, id: 'jwt-defect-force-logout' }
      );
    }
  }, [session, jwtClaims, userRole]);

  // Prevent page reload with invalid session - warn user
  useEffect(() => {
    if (!session || !userRole) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // If user_role is missing, warn before reload
      if (session && !userRole) {
        e.preventDefault();
        e.returnValue = 'La tua sessione non è valida. Ricaricare non risolverà il problema. Devi effettuare il logout e login.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [session, userRole]);

  // Handle navigation after sign in/out with role-based routing
  useEffect(() => {
    if (session && location.pathname === '/login') {
      // Role-based redirect after login
      if (userRole === 'super_admin') {
        console.log('🔐 [App] Super Admin logged in - redirecting to /super-admin/dashboard');
        navigate('/super-admin/dashboard');
      } else {
        console.log('👤 [App] Standard user logged in - redirecting to /dashboard');
        navigate('/dashboard');
      }
    } else if (!session && location.pathname !== '/login' && location.pathname !== '/') {
      // Only redirect to login if on a protected route
      const publicPaths = ['/', '/login', '/forgot-password', '/reset-password', '/form/', '/privacy-policy', '/terms-of-service'];
      const isPublicPath = publicPaths.some(path => location.pathname.startsWith(path));
      if (!isPublicPath) {
        console.log('🔒 [App] Redirecting to login - no session on protected route');
        navigate('/');
      }
    }
  }, [session, location.pathname, navigate, userRole]);
  
  // Role-based route guard: prevent cross-role access
  useEffect(() => {
    if (loading || !session) return;
    
    const isSuperAdminRoute = location.pathname.startsWith('/super-admin');
    const isStandardCrmRoute = ['/dashboard', '/opportunities', '/contacts', '/calendar', '/meetings', '/forms', '/automations', '/settings'].some(
      path => location.pathname.startsWith(path)
    );
    
    if (userRole === 'super_admin' && isStandardCrmRoute) {
      console.warn('⚠️ [App] Super Admin attempting to access standard CRM route - redirecting to /super-admin/dashboard');
      toast.error('Come Super Admin, devi usare la dashboard dedicata.', { duration: 3000 });
      navigate('/super-admin/dashboard', { replace: true });
    } else if (userRole !== 'super_admin' && isSuperAdminRoute) {
      console.warn('⚠️ [App] Non-Super Admin attempting to access Super Admin route - redirecting to /dashboard');
      toast.error('Non hai i permessi per accedere a questa sezione.', { duration: 3000 });
      navigate('/dashboard', { replace: true });
    }
  }, [session, userRole, location.pathname, loading, navigate]);
  
  // Apply theme from local storage on initial load
  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);


  if (crmData.error?.includes('VITE_SUPABASE')) {
      return (
          <div className="flex h-screen items-center justify-center bg-red-50 p-4">
              <div className="rounded-md bg-white p-8 text-center shadow-lg">
                  <h1 className="text-2xl font-bold text-red-600">Errore di Configurazione</h1>
                  <p className="mt-4 text-gray-700">{crmData.error}</p>
                  <p className="mt-2 text-sm text-gray-500">Assicurati di aver configurato correttamente le variabili d'ambiente nel tuo file `.env` o nelle impostazioni del tuo servizio di hosting.</p>
              </div>
          </div>
      );
  }
  
  // FIX: Removed `crmData.loading` check to prevent the entire component tree
  // from unmounting during data re-fetches. This is a critical fix to prevent
  // state loss in child components and avoid re-render loops. The loading state
  // is now handled gracefully within MainLayout and its children.
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Caricamento in corso...</div>;
  }

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      {/* Debug Panel - Only visible when logged in */}
      {session && <DebugPanel />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={
          session 
            ? <Navigate to={userRole === 'super_admin' ? '/super-admin/dashboard' : '/dashboard'} replace /> 
            : <Login />
        } />
        <Route path="/forgot-password" element={
          session 
            ? <Navigate to={userRole === 'super_admin' ? '/super-admin/dashboard' : '/dashboard'} replace /> 
            : <ForgotPassword />
        } />
        <Route path="/reset-password" element={
          session 
            ? <Navigate to={userRole === 'super_admin' ? '/super-admin/dashboard' : '/dashboard'} replace /> 
            : <ResetPassword />
        } />
        
        <Route path="/form/:formId" element={<PublicForm />} />

        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        
        <Route path="/settings/oauth/google" element={session ? <GoogleAuthCallback /> : <Navigate to="/login" />} />

        {/* Protected Routes */}
        <Route 
          path="/" 
          element={
            session ? <MainLayout crmData={crmData} /> : <Navigate to="/login" replace />
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="opportunities" element={<Opportunities />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="calendar" element={<CalendarView />} />
          <Route path="meetings" element={<Meetings />} />
          <Route path="forms" element={<Forms />} />
          <Route path="automations" element={<Automations />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        
        {/* Super Admin Routes */}
        <Route 
            path="/super-admin"
            element={session ? <SuperAdminLayout /> : <Navigate to="/login" replace />}
        >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="customers" element={<SuperAdminCustomers />} />
            <Route path="payments" element={<SuperAdminPayments />} />
            <Route path="automation-agents" element={<AutomationAgents />} />
            <Route path="api-integrations" element={<APIIntegrationsManager />} />
            <Route path="ai-workflows" element={<SuperAdminAiWorkflows />} />
            <Route path="audit-logs" element={<SuperAdminAuditLogs />} />
        </Route>
        
        <Route path="*" element={
          <Navigate to={
            session 
              ? (userRole === 'super_admin' ? '/super-admin/dashboard' : '/dashboard')
              : '/'
          } replace />
        } />
      </Routes>
    </>
  );
};

export default App;