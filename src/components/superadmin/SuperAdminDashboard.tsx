import React from 'react';
import { useSuperAdminData } from '../../hooks/useSuperAdminData';
import { UsersIcon, DollarSignIcon, CheckCircleIcon, TrendingUpIcon, TrendingDownIcon } from '../ui/icons';

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

    if (loading || !stats) {
        return <div className="text-center p-8">Caricamento delle statistiche...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">Dashboard Generale</h1>
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

            {/* Placeholder for future charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-card dark:bg-dark-card p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Crescita Utenti</h2>
                    <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-600 rounded-md">
                        <p className="text-text-secondary dark:text-dark-text-secondary">Grafico in arrivo...</p>
                    </div>
                </div>
                 <div className="bg-card dark:bg-dark-card p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Andamento MRR</h2>
                     <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-600 rounded-md">
                        <p className="text-text-secondary dark:text-dark-text-secondary">Grafico in arrivo...</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
