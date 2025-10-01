import React, { useState, useEffect } from 'react';
// FIX: Corrected imports for Routes, Route, useNavigate, useLocation, and Navigate from 'react-router-dom' to resolve module export errors.
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Session } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

import { supabase } from './lib/supabaseClient';
import { useCrmData } from './hooks/useCrmData';
import { diagnoseJWT } from './lib/jwtUtils';

import { MainLayout } from './components/MainLayout';
import { Dashboard } from './components/Dashboard';
import { Opportunities } from './components/Opportunities';
import { Contacts } from './components/Contacts';
import { Forms } from './components/Forms';
import { Automations } from './components/Automations';
import { Settings, GoogleAuthCallback } from './components/Settings';
import { Login } from './components/Login';
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


const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [jwtWarningShown, setJwtWarningShown] = useState(false);
  const crmData = useCrmData();
  const navigate = useNavigate();
  const location = useLocation();

  // JWT Health Check
  useEffect(() => {
    const checkJWTHealth = async () => {
      if (!session?.access_token || jwtWarningShown) return;
      
      const diag = diagnoseJWT(session.access_token);
      
      // Show warning if user_role is missing
      if (diag.isValid && !diag.hasUserRole) {
        setJwtWarningShown(true);
        
        toast.error(
          (t) => (
            <div className="space-y-2">
              <p className="font-semibold">⚠️ TOKEN DEFECT RILEVATO</p>
              <p className="text-sm">Il tuo JWT non contiene il claim user_role.</p>
              <p className="text-xs text-gray-600">
                Vai su Impostazioni → Debug JWT per più informazioni
              </p>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  navigate('/settings');
                }}
                className="text-xs text-blue-600 underline"
              >
                Vai a Impostazioni
              </button>
            </div>
          ),
          { duration: 10000 }
        );
      }
    };
    
    checkJWTHealth();
  }, [session, jwtWarningShown, navigate]);

  useEffect(() => {
    const getSession = async () => {
      // FIX: Correctly call getSession which is a valid Supabase auth method.
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };
    getSession();

    // FIX: Correctly call onAuthStateChange which is a valid Supabase auth method.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (_event === 'SIGNED_IN' && location.pathname === '/login') {
        navigate('/dashboard');
      }
      if (_event === 'SIGNED_OUT') {
        localStorage.removeItem('organization_id');
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);
  
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
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={session ? <Navigate to="/dashboard" /> : <Login />} />
        
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
            <Route path="ai-workflows" element={<SuperAdminAiWorkflows />} />
            <Route path="audit-logs" element={<SuperAdminAuditLogs />} />
        </Route>
        
        <Route path="*" element={<Navigate to={session ? "/dashboard" : "/"} />} />
      </Routes>
    </>
  );
};

export default App;