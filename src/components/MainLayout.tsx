import React from 'react';
// FIX: Corrected the import for Outlet from 'react-router-dom' to resolve module export errors.
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useCrmData } from '../hooks/useCrmData';
import { supabase } from '../lib/supabaseClient';

interface MainLayoutProps {
    crmData: ReturnType<typeof useCrmData>;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ crmData }) => {
    const { organization, error } = crmData;

    const handleLogout = async () => {
        // Clear all storage to ensure no auto-login
        localStorage.clear();
        sessionStorage.clear();
        await supabase.auth.signOut();
        // La navigazione alla homepage viene gestita dal listener in App.tsx
    };
    
    // An error from the core data hook is critical. Display an error page.
    if (error) {
        // Non mostriamo l'errore di configurazione qui, poiché viene già gestito in App.tsx.
        // Mostriamo un errore generico per altri problemi.
        return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;
    }

    // FIX: Removed the top-level loading check. The main layout skeleton now
    // renders immediately, and the `Outlet` receives the `crmData` context,
    // which includes the loading state. Child components will be responsible
    // for showing their own loading indicators. This prevents the entire
    // layout from unmounting and causing state-loss-related bugs.
    return (
        <div className="flex h-screen bg-gray-100 text-text-primary">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header 
                    organization={organization}
                    onLogout={handleLogout}
                />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-6">
                    {/* L'Outlet renderizzerà il componente della rotta figlia e passerà crmData tramite context */}
                    <Outlet context={crmData} />
                </main>
            </div>
        </div>
    );
};