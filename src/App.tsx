import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Dashboard } from './components/Dashboard';
import { Opportunities } from './components/Opportunities';
import { Contacts } from './components/Contacts';
import { Automations } from './components/Automations';
import { Forms } from './components/Forms';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { HomePage } from './components/HomePage';
import { PublicForm } from './components/PublicForm';
import { MainLayout } from './components/MainLayout';
import { supabase } from './lib/supabaseClient';
import { useCrmData } from './hooks/useCrmData';
import { Session } from '@supabase/supabase-js';

// Componente per mostrare un errore di configurazione chiaro all'utente.
const ConfigError: React.FC<{ missingVars: string[] }> = ({ missingVars }) => (
    <div className="min-h-screen bg-red-50 flex flex-col justify-center items-center p-4 text-center">
        <div className="max-w-2xl bg-white p-8 rounded-lg shadow-lg border-2 border-red-300">
            <h1 className="text-3xl font-bold text-red-700">Errore di Configurazione</h1>
            <p className="mt-4 text-lg text-gray-700"> L'applicazione non può avviarsi perché mancano delle variabili d'ambiente essenziali. </p>
            <div className="mt-6 text-left bg-red-100 p-4 rounded-md">
                <p className="font-semibold text-red-800">Variabili Mancanti o Non Corrette:</p>
                <ul className="list-disc list-inside mt-2 font-mono text-red-900"> {missingVars.map(v => <li key={v}>{v}</li>)} </ul>
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


// Wrapper per le rotte che richiedono autenticazione
const ProtectedRoute: React.FC<{
    isInitialized: boolean;
    session: Session | null;
    crmData: ReturnType<typeof useCrmData>;
}> = ({ isInitialized, session, crmData }) => {
    if (!isInitialized) {
        return <div className="h-screen w-screen flex items-center justify-center">Caricamento sessione...</div>;
    }

    if (!session) {
        return <Navigate to="/" replace />;
    }

    // Passiamo i dati caricati al layout principale, che a sua volta li passerà alle pagine figlie tramite Outlet context.
    return <MainLayout crmData={crmData} />;
};


const App: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [isInitialized, setIsInitialized] = useState(false); // Flag per sapere se il check iniziale della sessione è completo
    const crmData = useCrmData();
    const navigate = useNavigate();
    const location = useLocation();

    // Gestione della sessione
    useEffect(() => {
        const fetchSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setSession(session);
            } catch (e) {
                console.error("Errore di configurazione durante il check della sessione.");
            } finally {
                setIsInitialized(true);
            }
        };

        fetchSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                // Se l'utente fa logout, lo reindirizziamo alla homepage
                if (_event === 'SIGNED_OUT') {
                    navigate('/');
                }
                 // Se l'utente fa login, lo portiamo alla dashboard
                if (_event === 'SIGNED_IN' && location.pathname === '/login') {
                     navigate('/dashboard');
                }
            }
        );

        return () => authListener?.subscription.unsubscribe();
    }, [navigate, location.pathname]);


    // Se c'è un errore di configurazione, lo mostriamo a schermo intero.
    if (crmData.error && crmData.error.startsWith('Errore di Configurazione:')) {
        const missingVars = crmData.error.match(/[A-Z_0-9]+/g) || ['Variabili Sconosciute'];
        return <ConfigError missingVars={missingVars} />;
    }

    return (
        <>
            <Toaster
                position="top-right"
                toastOptions={{
                    success: { style: { background: '#dcfce7', color: '#166534', border: '1px solid #16a34a' }, iconTheme: { primary: '#16a34a', secondary: 'white' } },
                    error: { style: { background: '#fee2e2', color: '#991b1b', border: '1px solid #dc2626' }, iconTheme: { primary: '#dc2626', secondary: 'white' } },
                }}
            />
            <Routes>
                {/* Rotte Pubbliche */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/form/:formId" element={<PublicForm />} />

                {/* Rotte Protette */}
                <Route 
                    path="/" 
                    element={<ProtectedRoute isInitialized={isInitialized} session={session} crmData={crmData} />}
                >
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="opportunities" element={<Opportunities />} />
                    <Route path="contacts" element={<Contacts />} />
                    <Route path="forms" element={<Forms />} />
                    <Route path="automations" element={<Automations />} />
                    <Route path="settings" element={<Settings />} />
                    {/* Redirect dalla radice protetta alla dashboard */}
                    <Route index element={<Navigate to="/dashboard" replace />} />
                </Route>
            </Routes>
        </>
    );
};

export default App;