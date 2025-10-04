import React, { useState, useEffect } from 'react';

import { useSuperAdminData } from '../../hooks/useSuperAdminData';
import { diagnoseJWT, JWTDiagnostics } from '../../lib/jwtUtils';
import { supabase } from '../../lib/supabaseClient';
import { UsersIcon, DollarSignIcon, CheckCircleIcon, TrendingUpIcon, TrendingDownIcon } from '../ui/icons';

import { MrrChart } from './charts/MrrChart';
import { UserGrowthChart } from './charts/UserGrowthChart';

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string; }> = ({ title, value, icon, color }) => (
    <div className="bg-card dark:bg-dark-card p-6 rounded-lg shadow flex items-center">
      <div className={`p-4 rounded-full ${color}`}>
        {icon}
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{title}</p>
        <p className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">{value}</p>
      </div>
    </div>
);

export const SuperAdminDashboard: React.FC = () => {
    const { stats, loading } = useSuperAdminData();
    const [jwtDiagnostics, setJwtDiagnostics] = useState<JWTDiagnostics | null>(null);
    const [showJwtPanel, setShowJwtPanel] = useState(false);

    useEffect(() => {
        const checkJWT = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                const diag = diagnoseJWT(session.access_token);
                setJwtDiagnostics(diag);
                
                // Auto-show if there's an issue
                if (!diag.hasUserRole && diag.isValid) {
                    setShowJwtPanel(true);
                }
            }
        };
        
        checkJWT();
    }, []);

    if (loading || !stats) {
        return <div className="text-center p-8">Caricamento delle statistiche...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">Dashboard Generale</h1>
            
            {/* JWT Status Panel for SuperAdmin */}
            {jwtDiagnostics && (
                <div className="bg-white dark:bg-dark-card p-4 rounded-lg shadow border-l-4 border-blue-500">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <h3 className="font-bold text-lg mb-2">🔐 JWT Status (SuperAdmin)</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-600">Token Valido:</span>
                                    <span className={`ml-2 font-semibold ${jwtDiagnostics.isValid ? 'text-green-600' : 'text-red-600'}`}>
                                        {jwtDiagnostics.isValid ? '✅ Sì' : '❌ No'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-600">user_role:</span>
                                    <span className={`ml-2 font-semibold ${jwtDiagnostics.hasUserRole ? 'text-green-600' : 'text-red-600'}`}>
                                        {jwtDiagnostics.hasUserRole ? '✅ Presente' : '❌ Mancante'}
                                    </span>
                                </div>
                                {jwtDiagnostics.claims?.user_role && (
                                    <div>
                                        <span className="text-gray-600">Ruolo:</span>
                                        <span className="ml-2 font-semibold text-blue-600">
                                            {jwtDiagnostics.claims.user_role}
                                        </span>
                                    </div>
                                )}
                                {jwtDiagnostics.claims?.email && (
                                    <div>
                                        <span className="text-gray-600">Email:</span>
                                        <span className="ml-2 text-xs">
                                            {jwtDiagnostics.claims.email}
                                        </span>
                                    </div>
                                )}
                            </div>
                            {showJwtPanel && jwtDiagnostics.claims && (
                                <div className="mt-3 p-3 bg-gray-50 rounded text-xs font-mono overflow-x-auto">
                                    <div className="font-bold mb-2">Tutti i Claims JWT:</div>
                                    {Object.entries(jwtDiagnostics.claims).map(([key, value]) => (
                                        <div key={key} className="py-1">
                                            <span className="text-blue-600">{key}:</span> 
                                            <span className="ml-2">{JSON.stringify(value)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setShowJwtPanel(!showJwtPanel)}
                            className="ml-4 text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                            {showJwtPanel ? 'Nascondi Claims' : 'Mostra Claims'}
                        </button>
                    </div>
                    {!jwtDiagnostics.hasUserRole && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-300 rounded">
                            <p className="text-yellow-800 text-sm font-semibold">
                                ⚠️ TOKEN DEFECT: Il claim user_role è mancante. Effettua logout e login nuovamente.
                            </p>
                        </div>
                    )}
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                <StatCard 
                    title="Iscritti Totali" 
                    value={stats.totalSignups.toLocaleString('it-IT')} 
                    icon={<UsersIcon className="w-8 h-8 text-white" />} 
                    color="bg-blue-500" 
                />
                <StatCard 
                    title="Fatturato Totale" 
                    value={`€${stats.totalRevenue.toLocaleString('it-IT')}`} 
                    icon={<DollarSignIcon className="w-8 h-8 text-white" />} 
                    color="bg-green-500" 
                />
                <StatCard 
                    title="Utenti Attivi" 
                    value={stats.activeUsers.toLocaleString('it-IT')} 
                    icon={<CheckCircleIcon className="w-8 h-8 text-white" />} 
                    color="bg-yellow-500" 
                />
                <StatCard 
                    title="Nuovi (7 giorni)" 
                    value={`+${stats.newSignupsThisWeek}`} 
                    icon={<TrendingUpIcon className="w-8 h-8 text-white" />} 
                    color="bg-purple-500" 
                />
                 <StatCard 
                    title="Rischio Churn" 
                    value={stats.churnRiskCount.toString()} 
                    icon={<TrendingDownIcon className="w-8 h-8 text-white" />} 
                    color="bg-red-500" 
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <UserGrowthChart />
                <MrrChart />
            </div>
        </div>
    );
};
