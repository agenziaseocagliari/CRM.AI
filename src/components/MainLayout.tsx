import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useCrmData } from '../hooks/useCrmData';
import { supabase } from '../lib/supabaseClient';

interface MainLayoutProps {
    crmData: ReturnType<typeof useCrmData>;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ crmData }) => {
    const { organization, loading, error } = crmData;

    const handleLogout = async () => {
        await supabase.auth.signOut();
        // La navigazione alla homepage viene gestita dal listener in App.tsx
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Caricamento dati...</div>;
    }
    
    if (error) {
        // Non mostriamo l'errore di configurazione qui, poiché viene già gestito in App.tsx.
        // Mostriamo un errore generico per altri problemi.
        return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;
    }

    return (
        <div className="flex h-screen bg-gray-100 text-text-primary">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header 
                    organization={organization}
                    onLogout={handleLogout}
                />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-6">
                    {/* L'Outlet renderizzerà il componente della rotta figlia (es. Dashboard, Contacts) */}
                    <Outlet />
                </main>
            </div>
        </div>
    );
};