import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { diagnosticLogger } from '../../../lib/mockDiagnosticLogger';
// import { invokeSupabaseFunction } from '../../../lib/api'; // TODO: Uncomment when real API endpoint is available

interface UserGrowthData {
    date: string;
    users: number;
    newUsers: number;
}

export const UserGrowthChart: React.FC = () => {
    const [data, setData] = useState<UserGrowthData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // For now, generate mock data since the API endpoint might not return chart data
            // In a real scenario, you would call an API endpoint like:
            // const response = await invokeSupabaseFunction('superadmin-user-growth-stats', { range: dateRange });
            
            const mockData = generateMockData(dateRange);
            setData(mockData);
        } catch (err) {
            diagnosticLogger.error('Failed to fetch user growth data:', err);
            setError('Impossibile caricare i dati di crescita utenti');
            toast.error('Errore nel caricamento del grafico crescita utenti');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    const generateMockData = (range: string): UserGrowthData[] => {
        const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
        const data: UserGrowthData[] = [];
        let totalUsers = 100;
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const newUsers = Math.floor(Math.random() * 10) + 2;
            totalUsers += newUsers;
            
            data.push({
                date: date.toLocaleDateString('it-IT', { month: 'short', day: 'numeric' }),
                users: totalUsers,
                newUsers
            });
        }
        
        return data;
    };

    const handleExport = () => {
        // Export data as CSV
        const csvContent = [
            ['Data', 'Utenti Totali', 'Nuovi Utenti'],
            ...data.map(d => [d.date, d.users, d.newUsers])
        ].map(row => row.join(',')).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user-growth-${dateRange}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast.success('Dati esportati con successo');
    };

    if (loading) {
        return (
            <div className="bg-card dark:bg-dark-card p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Crescita Utenti</h2>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-card dark:bg-dark-card p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Crescita Utenti</h2>
                <div className="flex flex-col items-center justify-center h-64 bg-red-50 dark:bg-red-900/20 rounded-md">
                    <p className="text-red-600 dark:text-red-400 mb-4">âš ï¸ {error}</p>
                    <button
                        onClick={fetchData}
                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700"
                    >
                        Riprova
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card dark:bg-dark-card p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Crescita Utenti</h2>
                <div className="flex items-center space-x-2">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d')}
                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                    >
                        <option value="7d">Ultimi 7 giorni</option>
                        <option value="30d">Ultimi 30 giorni</option>
                        <option value="90d">Ultimi 90 giorni</option>
                    </select>
                    <button
                        onClick={handleExport}
                        className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-gray-700 dark:text-gray-200"
                        title="Esporta dati CSV"
                    >
                        ðŸ“¥ Esporta
                    </button>
                </div>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                    <XAxis 
                        dataKey="date" 
                        stroke="#6B7280"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                        stroke="#6B7280"
                        style={{ fontSize: '12px' }}
                    />
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: '#1F2937',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#F3F4F6'
                        }}
                    />
                    <Legend />
                    <Line 
                        type="monotone" 
                        dataKey="users" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        name="Utenti Totali"
                        dot={{ fill: '#3B82F6' }}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="newUsers" 
                        stroke="#10B981" 
                        strokeWidth={2}
                        name="Nuovi Utenti"
                        dot={{ fill: '#10B981' }}
                    />
                </LineChart>
            </ResponsiveContainer>
            
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                ðŸ’¡ Nota: Questi dati sono generati per dimostrazione. Per dati reali, configurare l'endpoint API appropriato.
            </div>
        </div>
    );
};

