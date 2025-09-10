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
import { PublicForm } from './components/PublicForm'; // Importa il nuovo componente
import { View } from './types';
import { supabase } from './lib/supabaseClient';
import { useCrmData } from './hooks/useCrmData';

type AppState = 'loading' | 'homepage' | 'login' | 'app' | 'public_form';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('loading');
  const [currentView, setCurrentView] = useState<View>('Dashboard');
  const [publicFormId, setPublicFormId] = useState<string | null>(null);
  
  const { organization, contacts, opportunities, forms, loading, error, refetch } = useCrmData();

  useEffect(() => {
    // Routing basato sul path
    const path = window.location.pathname;
    const formMatch = path.match(/^\/form\/([a-fA-F0-9-]+)$/);

    if (formMatch) {
      setPublicFormId(formMatch[1]);
      setAppState('public_form');
    } else {
      const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setAppState(session ? 'app' : 'homepage');
      };
      checkSession();

      const { data: authListener } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          // Non cambiare lo stato se siamo su una pagina pubblica
          if (!window.location.pathname.startsWith('/form/')) {
            setAppState(session ? 'app' : 'homepage');
          }
        }
      );
      return () => authListener?.subscription.unsubscribe();
    }
  }, []);


  const handleShowLogin = useCallback(() => {
    setAppState('login');
  }, []);
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Il listener onAuthStateChange gestirà il cambio di stato a 'homepage'
    window.location.pathname = '/'; // Reindirizza alla homepage
  };

  const renderView = () => {
    if (loading && appState === 'app') {
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
        return <Opportunities initialData={opportunities} contacts={contacts} organization={organization} refetchData={refetch} />;
      case 'Contacts':
        return <Contacts contacts={contacts} organization={organization} refetchData={refetch} />;
      case 'Forms':
        return <Forms forms={forms} organization={organization} refetchData={refetch} />;
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
  
  if (appState === 'public_form' && publicFormId) {
    return <PublicForm formId={publicFormId} />;
  }

  if (appState === 'homepage') {
    return <HomePage onLoginClick={handleShowLogin} onSignUpClick={handleShowLogin} />;
  }

  if (appState === 'login') {
    return <Login onBackToHome={() => setAppState('homepage')} />;
  }
  
  if (appState === 'app') {
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
  }

  return null; // O un fallback nel caso in cui nessuno stato corrisponda
};

export default App;