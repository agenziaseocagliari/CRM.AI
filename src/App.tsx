
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Opportunities } from './components/Opportunities';
import { Contacts } from './components/Contacts';
import { Automations } from './components/Automations';
import { Forms } from './components/Forms';
import { Login } from './components/Login';
import { HomePage } from './components/HomePage';
import { View } from './types';
import { useMockData } from './hooks/useMockData';
import { supabase } from './lib/supabaseClient';
import { Session } from '@supabase/supabase-js';

type AppState = 'homepage' | 'login' | 'app';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('homepage');
  const [session, setSession] = useState<Session | null>(null);
  const [currentView, setCurrentView] = useState<View>('Dashboard');
  const [currentTenantId, setCurrentTenantId] = useState<number>(1);
  
  const { tenants, getTenantContacts, getTenantOpportunities } = useMockData();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setAppState('app');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setAppState('app');
      } else {
        // Se l'utente fa logout, torna alla pagina di login
        setAppState('login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);


  const currentTenant = useMemo(() => tenants.find(t => t.id === currentTenantId) || tenants[0], [tenants, currentTenantId]);
  
  const handleTenantChange = useCallback((tenantId: number) => {
    setCurrentTenantId(tenantId);
  }, []);

  const handleShowLogin = useCallback(() => {
    setAppState('login');
  }, []);
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const renderView = () => {
    const tenantContacts = getTenantContacts(currentTenantId);
    const tenantOpportunities = getTenantOpportunities(currentTenantId);

    switch (currentView) {
      case 'Dashboard':
        return <Dashboard opportunities={tenantOpportunities} />;
      case 'Opportunities':
        return <Opportunities initialData={tenantOpportunities} />;
      case 'Contacts':
        return <Contacts contacts={tenantContacts} />;
      case 'Forms':
        return <Forms />;
      case 'Automations':
        return <Automations />;
      case 'Settings':
        return <div className="text-3xl font-bold text-text-primary">Impostazioni</div>;
      default:
        return <Dashboard opportunities={tenantOpportunities} />;
    }
  };

  if (appState === 'homepage') {
    return <HomePage onLoginClick={handleShowLogin} onSignUpClick={handleShowLogin} />;
  }

  if (appState === 'login') {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-gray-100 text-text-primary">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          tenants={tenants} 
          currentTenant={currentTenant} 
          onTenantChange={handleTenantChange}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-6">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;