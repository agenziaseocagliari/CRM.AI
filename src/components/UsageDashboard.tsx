// File: src/components/UsageDashboard.tsx

/**
 * CREDIT NOTIFICATION SYSTEM LOGIC:
 * 
 * Questo componente monitora i crediti rimanenti dell'utente e mostra notifiche proattive:
 * 
 * - Se i crediti scendono sotto il 20% del totale: toast() di avviso
 * - Se i crediti sono esauriti (0): toast.error
 * 
 * Il sistema previene notifiche ripetitive usando useRef per tracciare se la notifica è già stata mostrata.
 * Quando i crediti vengono ricaricati sopra il 20%, il flag viene resettato per permettere future notifiche.
 */

import React, { useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSignIcon, SparklesIcon, CheckCircleIcon } from './ui/icons';
import { toast } from 'react-hot-toast';

// Props interface per il componente
interface UsageDashboardProps {
  currentCredits?: number; // Crediti rimanenti
  totalCredits?: number;   // Crediti totali del piano
}

// Dati mock per il wireframe
const usageData = [
    { name: 'Email AI', crediti: 450 },
    { name: 'WhatsApp AI', crediti: 280 },
    { name: 'Invio WA', crediti: 650 },
    { name: 'Lead Score', crediti: 320 },
    { name: 'Eventi Cal.', crediti: 150 },
    { name: 'Form AI', crediti: 80 },
];

const ledgerData = [
    { id: 1, timestamp: '2024-09-11 10:30', action: 'Generazione Email AI', cost: 2, outcome: 'Successo' },
    { id: 2, timestamp: '2024-09-11 10:28', action: 'Invio WhatsApp', cost: 5, outcome: 'Successo' },
    { id: 3, timestamp: '2024-09-11 09:15', action: 'Lead Scoring', cost: 5, outcome: 'Successo' },
    { id: 4, timestamp: '2024-09-10 18:05', action: 'Creazione Evento GCal', cost: 2, outcome: 'Successo' },
    { id: 5, timestamp: '2024-09-10 15:22', action: 'Generazione Form AI', cost: 10, outcome: 'Successo' },
];

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
    currentCredits = 3073, // Valori di default per la demo
    totalCredits = 5000 
}) => {
    // Ref per evitare notifiche ripetitive
    const notificationShown = useRef({
        lowCredits: false, // Flag per notifica "crediti bassi"
        noCredits: false   // Flag per notifica "crediti esauriti"
    });

    // Hook per monitorare i crediti e mostrare notifiche
    useEffect(() => {
        const creditsPercentage = (currentCredits / totalCredits) * 100;

        // Reset flags se i crediti sono sopra il 20% (utente ha ricaricato)
        if (creditsPercentage > 20) {
            notificationShown.current.lowCredits = false;
            notificationShown.current.noCredits = false;
        }

        // Crediti esauriti (0%)
        if (currentCredits === 0 && !notificationShown.current.noCredits) {
            toast.error('Crediti esauriti!', {
                duration: 6000,
                position: 'top-center',
            });
            notificationShown.current.noCredits = true;
        }
        // Crediti bassi (< 20%)
        else if (creditsPercentage < 20 && creditsPercentage > 0 && !notificationShown.current.lowCredits) {
            // FIX: The `react-hot-toast` library does not have a `toast.warning` method.
            // It has been replaced with the standard `toast()` function, customized with
            // a warning icon to provide the intended user feedback.
            toast('Attenzione: solo il 20% dei crediti rimane!', {
                icon: '⚠️',
                duration: 5000,
                position: 'top-center',
            });
            notificationShown.current.lowCredits = true;
        }
    }, [currentCredits, totalCredits]);

    // Calcolo valori dinamici
    const usedCredits = totalCredits - currentCredits;
    const creditsPercentage = (usedCredits / totalCredits) * 100;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Crediti Rimanenti" value={currentCredits.toLocaleString()} icon={<SparklesIcon className="w-6 h-6" />} />
                <StatCard title="Crediti Usati (Ciclo Attuale)" value={usedCredits.toLocaleString()} icon={<CheckCircleIcon className="w-6 h-6" />} />
                <StatCard title="Prossimo Rinnovo" value="1 Ott 2024" icon={<DollarSignIcon className="w-6 h-6" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Grafico Consumo */}
                <div className="lg:col-span-3 bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Consumo Crediti per Agente</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={usageData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                            <Tooltip cursor={{ fill: '#f3f4f6' }} />
                            <Bar dataKey="crediti" fill="#4f46e5" name="Crediti Utilizzati" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Info Piano Attuale */}
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Il Tuo Piano</h3>
                    <div className="flex-grow space-y-4">
                        <div className="p-4 bg-indigo-50 rounded-lg text-center">
                            <p className="font-bold text-2xl text-primary">Pro Plan</p>
                            <p className="text-sm text-indigo-700">{totalCredits.toLocaleString()} crediti/mese</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Ciclo attuale: 1 Set - 1 Ott 2024</p>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                <div 
                                    className="bg-primary h-2.5 rounded-full" 
                                    style={{ width: `${creditsPercentage}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                    <button className="w-full mt-4 bg-primary text-white font-semibold py-2 rounded-lg hover:bg-indigo-700">
                        Gestisci Abbonamento
                    </button>
                </div>
            </div>

             {/* Storico Utilizzo */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                 <h3 className="text-lg font-semibold text-gray-800 mb-4">Storico Utilizzo Crediti</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Azione</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Costo Crediti</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Esito</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {ledgerData.map(log => (
                                <tr key={log.id}>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{log.timestamp}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 font-medium">{log.action}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right font-mono">- {log.cost}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-center">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            {log.outcome}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};