// File: src/components/UsageDashboard.tsx

import React, { useEffect, useRef, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { OrganizationSubscription, CreditLedgerEntry } from '../types';

import { DollarSignIcon, SparklesIcon, CheckCircleIcon } from './ui/icons';

// Props interface per il componente
interface UsageDashboardProps {
  subscription: OrganizationSubscription | null;
  ledger: CreditLedgerEntry[];
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border flex items-center">
        <div className="p-3 rounded-full bg-indigo-100 text-primary">
            {icon}
        </div>
        <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

export const UsageDashboard: React.FC<UsageDashboardProps> = ({ 
    subscription,
    ledger 
}) => {
    // Ref per evitare notifiche ripetitive
    const notificationShown = useRef({
        lowCredits: false,
        noCredits: false
    });
    
    // FIX: Explicitly cast credit values to Number. Although the type definitions
    // expect numbers, data from Supabase for numeric/decimal columns can sometimes
    // be returned as strings, causing type errors in arithmetic operations.
    const currentCredits = Number(subscription?.current_credits ?? 0);
    const totalCredits = Number(subscription?.total_credits ?? 1); // Evita divisione per zero se i dati non sono ancora arrivati

    // Hook per monitorare i crediti e mostrare notifiche
    useEffect(() => {
        // Se i dati non sono ancora caricati, non fare nulla
        if (!subscription) {return;}

        const creditsPercentage = (currentCredits / totalCredits) * 100;

        if (creditsPercentage > 20) {
            notificationShown.current.lowCredits = false;
            notificationShown.current.noCredits = false;
        }

        if (currentCredits === 0 && !notificationShown.current.noCredits) {
            toast.error('Crediti esauriti! Le funzionalità AI e di invio sono disabilitate.', {
                duration: 6000,
                position: 'top-center',
            });
            notificationShown.current.noCredits = true;
        } else if (creditsPercentage < 20 && creditsPercentage > 0 && !notificationShown.current.lowCredits) {
            toast(`Attenzione: hai meno del 20% dei crediti rimanenti.`, {
                icon: '⚠️',
                duration: 5000,
                position: 'top-center',
            });
            notificationShown.current.lowCredits = true;
        }
    }, [currentCredits, totalCredits, subscription]);

    const usedCredits = totalCredits - currentCredits;
    const creditsPercentage = totalCredits > 0 ? (usedCredits / totalCredits) * 100 : 0;

    // Aggrega i dati di utilizzo dal ledger per il grafico
    const usageData = useMemo(() => {
        if (!ledger) {return [];}
        const usageMap = ledger.reduce((acc, entry) => {
            if (entry.outcome === 'SUCCESS') {
                // FIX: Explicitly cast `credits_changed` to a number to prevent potential runtime errors
                // if Supabase returns a string value for a numeric column.
                const cost = Math.abs(Number(entry.credits_changed));
                const readableName = entry.action_type.replace(/_/g, ' ').replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase());
                acc[readableName] = (acc[readableName] || 0) + cost;
            }
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(usageMap)
            .map(([name, crediti]) => ({ name, crediti }))
            // FIX: Explicitly cast `crediti` to a number within the sort function to handle cases
            // where values might be strings, ensuring the arithmetic operation is valid.
            .sort((a, b) => Number(b.crediti) - Number(a.crediti));
    }, [ledger]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Crediti Rimanenti" value={currentCredits.toLocaleString()} icon={<SparklesIcon className="w-6 h-6" />} />
                <StatCard title="Crediti Usati (Ciclo Attuale)" value={usedCredits.toLocaleString()} icon={<CheckCircleIcon className="w-6 h-6" />} />
                <StatCard title="Prossimo Rinnovo" value={subscription?.cycle_end_date ? new Date(subscription.cycle_end_date).toLocaleDateString('it-IT') : 'N/A'} icon={<DollarSignIcon className="w-6 h-6" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Consumo Crediti per Azione</h3>
                    {usageData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={usageData} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                                <Tooltip cursor={{ fill: '#f3f4f6' }} />
                                <Bar dataKey="crediti" fill="#4f46e5" name="Crediti Utilizzati" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                         <div className="flex items-center justify-center h-[300px] text-gray-500">Nessun dato di utilizzo ancora disponibile.</div>
                    )}
                </div>

                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Il Tuo Piano</h3>
                    <div className="flex-grow space-y-4">
                        <div className="p-4 bg-indigo-50 rounded-lg text-center">
                            <p className="font-bold text-2xl text-primary">{subscription?.plan_name || 'N/A'}</p>
                            <p className="text-sm text-indigo-700">{totalCredits.toLocaleString()} crediti/mese</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Ciclo attuale: {subscription ? `${new Date(subscription.cycle_start_date).toLocaleDateString('it-IT')} - ${subscription.cycle_end_date ? new Date(subscription.cycle_end_date).toLocaleDateString('it-IT') : 'N/A'}` : 'N/A'}</p>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                <div className="bg-primary h-2.5 rounded-full" style={{ width: `${creditsPercentage}%` }} />
                            </div>
                        </div>
                    </div>
                    <button className="w-full mt-4 bg-primary text-white font-semibold py-2 rounded-lg hover:bg-indigo-700">
                        Gestisci Abbonamento
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
                 <h3 className="text-lg font-semibold text-gray-800 mb-4">Ultime 20 Transazioni</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Azione</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Crediti</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Esito</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {ledger.length > 0 ? ledger.map(log => (
                                <tr key={log.id}>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{new Date(log.created_at).toLocaleString('it-IT')}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 font-medium">{log.action_type.replace(/_/g, ' ')}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right font-mono">{log.credits_changed}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-center">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ log.outcome === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800' }`}>
                                            {log.outcome === 'SUCCESS' ? 'Successo' : 'Fondi Insuff.'}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={4} className="text-center py-8 text-gray-500">Nessuna transazione registrata.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
