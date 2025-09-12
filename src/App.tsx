import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Session } from '@supabase/supabase-js';

import { supabase } from './lib/supabaseClient';
import { useCrmData } from './hooks/useCrmData';

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

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const crmData = useCrmData();
  const navigate = useNavigate();
  const location = useLocation();

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
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

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
  
  if (loading || (session && crmData.loading)) {
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
          <Route path="forms" element={<Forms />} />
          <Route path="automations" element={<Automations />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        
        <Route path="*" element={<Navigate to={session ? "/dashboard" : "/"} />} />
      </Routes>
    </>
  );
};

export default App;
