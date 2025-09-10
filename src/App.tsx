import React, { useState, useCallback, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
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

// *** START: Environment Variable Check & Error Component ***

// Un componente dedicato per mostrare un errore di configurazione chiaro all'utente.
const ConfigError: React.FC<{ missingVars: string[] }> = ({ missingVars }) => (
    <div className="min-h-screen bg-red-50 flex flex-col justify-center items-center p-4 text-center">
        <div className="max-w-2xl bg-white p-8 rounded-lg shadow-lg border-2 border-red-300">
            <h1 className="text-3xl font-bold text-red-700">Errore di Configurazione</h1>
            <p className="mt-4 text-lg text-gray-700">
                L'applicazione non può avviarsi perché mancano delle variabili d'ambiente essenziali.
            </p>
            <div className="mt-6 text-left bg-red-100 p-4 rounded-md">
                <p className="font-semibold text-red-800">Variabili Mancanti o Non Corrette:</p>
                <ul className="list-disc list-inside mt-2 font-mono text-red-900">
                    {missingVars.map(v => <li key={v}>{v}</li>)}
                </ul>
            </div>
            <div className="mt-6 text-left text-gray-600">
                <p className="font-bold">Come risolvere:</p>
                <ol className="list-decimal list-inside mt-2 space-y-2">
                    <li>Vai alla dashboard del tuo progetto su <strong>Vercel</strong>.</li>
                    <li>Naviga in <strong>Settings &rarr; Environment Variables</strong>.</li>
                    <li>Assicurati che tutte le variabili elencate sopra siano state aggiunte con i loro nomi e valori corretti.</li>
                    <li>Dopo averle aggiunte, <strong>ri-distribuisci (Redeploy)</strong> l'ultimo deployment per applicare le modifiche.</li>
                </ol>
            </div>
        </div>
    </div>
);

// *** END: Environment Variable Check & Error Component ***


type AppState = 'loading' | 'homepage' | 'login' | 'app' | 'public_form';

const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>('loading');
    const [currentView, setCurrentView] = useState<View>('Dashboard');
    const [publicFormId, setPublicFormId] = useState<string | null>(null);
    
    const { organization, contacts, opportunities, forms, loading, error, refetch } = useCrmData();

    // Se il custom hook `useCrmData` rileva un errore di configurazione,
    // lo mostriamo qui con una schermata dedicata invece della pagina bianca.
    if (error && error.startsWith('Errore di Configurazione:')) {
        const missingVars = error.match(/[A-Z_0-9]+/g) || ['Variabili Sconosciute'];
        return <ConfigError missingVars={missingVars} />;
    }

    useEffect(() => {
        // Routing basato sul path
        const path = window.location.pathname;
        const formMatch = path.match(/^\/form\/([a-fA-F0-9-]+)$/);

        if (formMatch) {
            setPublicFormId(formMatch[1]);
            setAppState('public_form');
        } else {
            const checkSession = async () => {
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    setAppState(session ? 'app' : 'homepage');
                } catch (e) {
                    // Se supabase non è configurato, il proxy lancerà un errore.
                    // L'hook useCrmData lo catturerà e mostrerà la schermata di errore.
                    console.error("Errore di configurazione durante il check della sessione.");
                    setAppState('homepage'); // Fallback sicuro
                }
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
        // Mostra un errore generico per altri problemi non legati alla configurazione.
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
            <>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        success: {
                            style: {
                                background: '#dcfce7', // green-100
                                color: '#166534',     // green-800
                                border: '1px solid #16a34a', // green-600
                            },
                            iconTheme: {
                                primary: '#16a34a',   // green-600
                                secondary: 'white',
                            },
                        },
                        error: {
                            style: {
                                background: '#fee2e2', // red-100
                                color: '#991b1b',     // red-800
                                border: '1px solid #dc2626', // red-600
                            },
                            iconTheme: {
                                primary: '#dc2626',   // red-600
                                secondary: 'white',
                            },
                        },
                    }}
                />
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
            </>
        );
    }

    return null; // O un fallback nel caso in cui nessuno stato corrisponda
};

export default App;