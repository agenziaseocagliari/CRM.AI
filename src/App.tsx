import React, { useState, useCallback, useEffect } from 'react';
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
import { supabase } from './lib/supabaseClient';
import { useCrmData } from './hooks/useCrmData';

type AppState = 'loading' | 'homepage' | 'login' | 'app';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('loading');
  const [currentView, setCurrentView] = useState<View>('Dashboard');
  
  const { organization, contacts, opportunities, loading, error, refetch } = useCrmData();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setAppState(session ? 'app' : 'homepage');
    };
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setAppState(session ? 'app' : 'homepage');
      }
    );

    return () => authListener?.subscription.unsubscribe();
  }, []);

  const handleShowLogin = useCallback(() => {
    setAppState('login');
  }, []);
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Il listener onAuthStateChange gestirà il cambio di stato a 'homepage'
  };

  const renderView = () => {
    if (loading) {
      return <div className="flex items-center justify-center h-full">Caricamento dati...</div>;
    }
    if (error) {
      return <div className="flex items-center justify-center h-full text-red-500">{error}</div>;
    }

    // Passiamo i dati reali ai componenti
    switch (currentView) {
      case 'Dashboard':
        return <Dashboard opportunities={opportunities} contacts={contacts} />;
      case 'Opportunities':
        return <Opportunities initialData={opportunities} />;
      case 'Contacts':
        return <Contacts contacts={contacts} organization={organization} refetchData={refetch} />;
      case 'Forms':
        return <Forms />;
      case 'Automations':
        return <Automations />;
      case 'Settings':
        return <div className="text-3xl font-bold text-text-primary">Impostazioni</div>;
      default:
        return <Dashboard opportunities={opportunities} contacts={contacts} />;
    }
  };
  
  if (appState === 'loading') {
    return <div className="h-screen w-screen flex items-center justify-center">Caricamento...</div>;
  }

  if (appState === 'homepage') {
    return <HomePage onLoginClick={handleShowLogin} onSignUpClick={handleShowLogin} />;
  }

  if (appState === 'login') {
    return <Login onBackToHome={() => setAppState('homepage')} />;
  }

  return (
    <div className="flex h-screen bg-gray-100 text-text-primary">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          organization={organization}
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