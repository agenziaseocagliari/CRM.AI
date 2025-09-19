import React, { useState } from 'react';
// FIX: Corrected the import for useOutletContext from 'react-router-dom' to resolve module export errors.
import { useOutletContext } from 'react-router-dom';
import { BarChart, Bar, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { useCrmData } from '../hooks/useCrmData';
import { Opportunity, PipelineStage } from '../types';
import { Card } from './ui/Card';
import { CheckCircleIcon, DollarSignIcon, TrendingUpIcon, UsersIcon } from './ui/icons';
import { Modal } from './ui/Modal';
import { invokeSupabaseFunction } from '../lib/api';


export const Dashboard: React.FC = () => {
  const { opportunities, contacts } = useOutletContext<ReturnType<typeof useCrmData>>();

  // --- START DEBUG INTERFACE STATE ---
  const [isLoading, setIsLoading] = useState(false);
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);
  const [debugModalTitle, setDebugModalTitle] = useState('');
  const [debugModalContent, setDebugModalContent] = useState<any>(null);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [webhookResponseContent, setWebhookResponseContent] = useState('');
  // --- END DEBUG INTERFACE STATE ---

  // FIX: Switched from `Object.values` to `Object.keys` to work around a type
  // inference issue where `val` was incorrectly inferred as `unknown`, causing a
  // type error with `concat`. This approach is more robust for flattening the object.
  const allOpportunities: Opportunity[] = Object.keys(opportunities).reduce<Opportunity[]>(
    (acc, key) => acc.concat(opportunities[key as PipelineStage]),
    [],
  );
  const totalRevenue = allOpportunities.filter(op => op.stage === 'Won').reduce((sum, op) => sum + op.value, 0);
  
  // Calcolo dinamico basato sui contatti totali, non solo sui lead.
  // Per una metrica più precisa, potremmo filtrare i contatti creati di recente.
  // Per ora, mostriamo il totale dei contatti.
  const totalContactsCount = contacts?.length || 0;

  const dealsWon = opportunities[PipelineStage.Won]?.length || 0;
  const conversionRate = allOpportunities.length > 0 ? ((dealsWon / allOpportunities.length) * 100).toFixed(1) : 0;

  // Dati per il grafico a barre della pipeline
  const pipelineData = Object.values(PipelineStage).map(stage => ({
    name: stage,
    // FIX: Correctly access the length of the array for each stage, handling cases where a stage might have no opportunities.
    Opportunità: opportunities[stage]?.length || 0,
  }));
  
  // Dati mock per il grafico a torta (da sostituire con dati reali quando disponibili)
  const leadSourceData = [
      { name: 'Sito Web', value: 400 },
      { name: 'Referral', value: 300 },
      { name: 'Social Media', value: 250 },
      { name: 'Eventi', value: 180 },
  ];
  const COLORS = ['#4f46e5', '#34d399', '#f59e0b', '#ec4899'];

  // --- START DEBUG INTERFACE LOGIC ---
    const runDebugAction = async (title: string, action: () => Promise<any>) => {
        setIsLoading(true);
        setDebugModalTitle(title);
        try {
            const result = await action();
            console.log(`--- DEBUG [${title}] RESULT ---`);
            console.log(result);
            setDebugModalContent(result);
        } catch (error: any) {
            console.error(`--- DEBUG [${title}] ERROR ---`, error);
            const errorMessage = error.message || 'Errore sconosciuto';
            // Check if error message is a JSON string
            try {
                const parsedError = JSON.parse(errorMessage);
                setDebugModalContent({ error: 'Errore dalla funzione', details: parsedError });
            } catch (e) {
                setDebugModalContent({ error: errorMessage, details: error });
            }
        } finally {
            setIsDebugModalOpen(true);
            setIsLoading(false);
        }
    };

    const handleTestDebugLogsQuery = () => runDebugAction(
        "Risultati Query: Ultimi 10 Log",
        () => invokeSupabaseFunction('run-debug-query', { query_name: 'get_latest_logs' })
    );

    const handleTriggerCheckToken = () => runDebugAction(
        "Trigger: Check Token Status",
        () => invokeSupabaseFunction('check-google-token-status', { 
            organization_id: 'a4a71877-bddf-44ee-9f3a-c3c36c53c24e' 
        })
    );

    const handleTriggerCalendarEvents = () => {
        const timeMin = new Date();
        const timeMax = new Date();
        timeMax.setDate(timeMin.getDate() + 1);

        runDebugAction(
            "Trigger: Get Google Calendar Events",
            () => invokeSupabaseFunction('get-google-calendar-events', { 
                organization_id: 'a4a71877-bddf-44ee-9f3a-c3c36c53c24e',
                timeMin: timeMin.toISOString(),
                timeMax: timeMax.toISOString()
            })
        );
    };

    const handleClearDebugLogs = () => runDebugAction(
        "Azione: Pulisci Log di Debug",
        () => invokeSupabaseFunction('run-debug-query', { query_name: 'clear_logs' })
    );
    
    const handleTriggerN8nWebhook = async () => {
        setIsLoading(true);
        setWebhookResponseContent('Invio richiesta in corso...');
        setIsWebhookModalOpen(true);

        const url = 'https://n8n-5o4j.onrender.com/webhook/ai-studio-export';
        const payload = {
            "fileName": "supabase/functions/google-token-exchange/index.ts",
            "content": "// test aggiornamento automazione edge function via workflow n8n",
            "commitMessage": "Test full pipeline n8n da AI Studio"
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const responseBody = await response.text();
            const output = `Status: ${response.status}\nStatus Text: ${response.statusText}\n---\nResponse Body:\n${responseBody}`;
            setWebhookResponseContent(output.trim());
        } catch (error: any) {
            const output = `Si è verificato un errore durante l'invio della richiesta.\n---\nMessage: ${error.message}\n---\nControlla la console del browser per maggiori dettagli.`;
            setWebhookResponseContent(output.trim());
        } finally {
            setIsLoading(false);
        }
    };
    // --- END DEBUG INTERFACE LOGIC ---


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card title="Fatturato Totale" value={`€${totalRevenue.toLocaleString('it-IT')}`} icon={<DollarSignIcon className="w-8 h-8 text-white" />} color="bg-blue-500" />
        <Card title="Contatti Totali" value={totalContactsCount.toString()} icon={<UsersIcon className="w-8 h-8 text-white" />} color="bg-green-500" />
        <Card title="Affari Vinti" value={dealsWon.toString()} icon={<CheckCircleIcon className="w-8 h-8 text-white" />} color="bg-yellow-500" />
        <Card title="Tasso di Conversione" value={`${conversionRate}%`} icon={<TrendingUpIcon className="w-8 h-8 text-white" />} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Panoramica Pipeline</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Opportunità" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
        </div>
        <div className="bg-card p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Fonti dei Lead</h2>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={leadSourceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        // FIX: Explicitly cast the label props to `any` to resolve a TypeScript
                        // type inference issue with the `recharts` library. The library correctly
                        // provides the `percent` property at runtime, but the type definition
                        // seems to be incomplete, causing a compile-time error.
                        label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                        {leadSourceData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
      </div>
       {/* --- START DEBUG INTERFACE UI --- */}
        <div className="mt-8 p-4 border-2 border-dashed border-red-400 rounded-lg bg-red-50">
            <h2 className="text-xl font-bold text-red-700 mb-4">Pannello di Debug Avanzato</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                    onClick={handleTestDebugLogsQuery}
                    disabled={isLoading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {isLoading ? 'Caricamento...' : 'Test Debug Logs Query'}
                </button>
                <button
                    onClick={handleTriggerCheckToken}
                    disabled={isLoading}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
                >
                    {isLoading ? 'Caricamento...' : 'Trigger Check Token'}
                </button>
                <button
                    onClick={handleTriggerCalendarEvents}
                    disabled={isLoading}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                    {isLoading ? 'Caricamento...' : 'Trigger Calendar Events'}
                </button>
                <button
                    onClick={handleClearDebugLogs}
                    disabled={isLoading}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                >
                    {isLoading ? 'Caricamento...' : 'Clear Debug Logs'}
                </button>
                 <button
                    onClick={handleTriggerN8nWebhook}
                    disabled={isLoading}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:bg-gray-400"
                >
                    {isLoading ? 'Caricamento...' : 'Trigger n8n Webhook'}
                </button>
            </div>
        </div>
        {/* --- END DEBUG INTERFACE UI --- */}

        {/* --- START DEBUG MODAL --- */}
        <Modal isOpen={isDebugModalOpen} onClose={() => setIsDebugModalOpen(false)} title={debugModalTitle}>
            <div className="bg-gray-900 text-white p-4 rounded-md max-h-[60vh] overflow-auto">
                <pre><code>{JSON.stringify(debugModalContent, null, 2)}</code></pre>
            </div>
            <div className="flex justify-end pt-4 border-t mt-4">
                <button type="button" onClick={() => setIsDebugModalOpen(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Chiudi</button>
            </div>
        </Modal>
        {/* --- END DEBUG MODAL --- */}
        
        {/* --- START N8N WEBHOOK MODAL --- */}
        <Modal isOpen={isWebhookModalOpen} onClose={() => setIsWebhookModalOpen(false)} title="Risposta Webhook n8n">
            <div className="bg-gray-900 text-white p-4 rounded-md max-h-[60vh] overflow-auto">
                <pre><code>{webhookResponseContent}</code></pre>
            </div>
            <div className="flex justify-end pt-4 border-t mt-4">
                <button type="button" onClick={() => setIsWebhookModalOpen(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Chiudi</button>
            </div>
        </Modal>
        {/* --- END N8N WEBHOOK MODAL --- */}
    </div>
  );
};