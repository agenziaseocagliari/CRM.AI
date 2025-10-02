import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// import { invokeSupabaseFunction } from '../../../lib/api'; // TODO: Uncomment when real API endpoint is available
import toast from 'react-hot-toast';

interface MrrData {
    month: string;
    mrr: number;
    growth: number;
}

export const MrrChart: React.FC = () => {
    const [data, setData] = useState<MrrData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState<'6m' | '12m'>('6m');

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // For now, generate mock data since the API endpoint might not return MRR chart data
            // In a real scenario, you would call an API endpoint like:
            // const response = await invokeSupabaseFunction('superadmin-mrr-stats', { period });
            
            const mockData = generateMockMrrData(period);
            setData(mockData);
        } catch (err) {
            console.error('Failed to fetch MRR data:', err);
            setError('Impossibile caricare i dati MRR');
            toast.error('Errore nel caricamento del grafico MRR');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [period]);

    const generateMockMrrData = (period: string): MrrData[] => {
        const months = period === '6m' ? 6 : 12;
        const data: MrrData[] = [];
        let baseMrr = 5000;
        
        for (let i = months - 1; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const growth = Math.floor(Math.random() * 1000) + 500;
            baseMrr += growth;
            
            data.push({
                month: date.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }),
                mrr: baseMrr,
                growth
            });
        }
        
        return data;
    };

    const handleExport = () => {
        // Export data as CSV
        const csvContent = [
            ['Mese', 'MRR (€)', 'Crescita (€)'],
            ...data.map(d => [d.month, d.mrr, d.growth])
        ].map(row => row.join(',')).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mrr-trend-${period}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast.success('Dati MRR esportati con successo');
    };

    const currentMrr = data.length > 0 ? data[data.length - 1].mrr : 0;
    const previousMrr = data.length > 1 ? data[data.length - 2].mrr : 0;
    const mrrGrowthPercent = previousMrr > 0 ? ((currentMrr - previousMrr) / previousMrr * 100).toFixed(1) : 0;

    if (loading) {
        return (
            <div className="bg-card dark:bg-dark-card p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Andamento MRR</h2>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-card dark:bg-dark-card p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Andamento MRR</h2>
                <div className="flex flex-col items-center justify-center h-64 bg-red-50 dark:bg-red-900/20 rounded-md">
                    <p className="text-red-600 dark:text-red-400 mb-4">⚠️ {error}</p>
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
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Andamento MRR</h2>
                    <div className="mt-2 flex items-center space-x-4">
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                €{currentMrr.toLocaleString('it-IT')}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">MRR Corrente</p>
                        </div>
                        <div className={`flex items-center ${Number(mrrGrowthPercent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            <span className="text-lg font-semibold">
                                {Number(mrrGrowthPercent) >= 0 ? '↗' : '↘'} {mrrGrowthPercent}%
                            </span>
                            <p className="text-xs ml-1">vs mese scorso</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value as '6m' | '12m')}
                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                    >
                        <option value="6m">Ultimi 6 mesi</option>
                        <option value="12m">Ultimi 12 mesi</option>
                    </select>
                    <button
                        onClick={handleExport}
                        className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-gray-700 dark:text-gray-200"
                        title="Esporta dati CSV"
                    >
                        📥 Esporta
                    </button>
                </div>
            </div>
            
            <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                    <XAxis 
                        dataKey="month" 
                        stroke="#6B7280"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                        stroke="#6B7280"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: '#1F2937',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#F3F4F6'
                        }}
                        formatter={(value: number) => [`€${value.toLocaleString('it-IT')}`, 'MRR']}
                    />
                    <Legend />
                    <Area 
                        type="monotone" 
                        dataKey="mrr" 
                        stroke="#10B981" 
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorMrr)"
                        name="Monthly Recurring Revenue"
                    />
                </AreaChart>
            </ResponsiveContainer>
            
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                💡 Nota: Questi dati sono generati per dimostrazione. Per dati reali, configurare l'endpoint API appropriato.
            </div>
        </div>
    );
};
