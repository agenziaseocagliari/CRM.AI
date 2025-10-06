import React, { useState } from 'react';
import toast from 'react-hot-toast';

import { invokeSupabaseFunction } from '../../lib/api';
import { SparklesIcon, TrendingDownIcon, TemplateIcon } from '../ui/icons';
import { Modal } from '../ui/Modal';

interface WorkflowExecution {
    id: string;
    workflow: string;
    status: 'running' | 'success' | 'error' | 'timeout';
    startTime: Date;
    endTime?: Date;
    message?: string;
    error?: string;
}

const WorkflowCard: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    action: () => void;
    isRunning: boolean;
}> = ({ title, description, icon, action, isRunning }) => (
    <div className="bg-card dark:bg-dark-card p-6 rounded-lg shadow-md border dark:border-gray-600 flex flex-col">
        <div className="flex items-center mb-4">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-full mr-4">
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">{title}</h3>
        </div>
        <p className="text-text-secondary dark:text-dark-text-secondary flex-grow mb-6">{description}</p>
        <button 
            onClick={action}
            disabled={isRunning}
            className={`w-full mt-auto font-semibold py-2 rounded-lg transition-colors ${
                isRunning
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-primary dark:bg-dark-primary text-white hover:bg-indigo-700 dark:hover:bg-indigo-600'
            }`}
        >
            {isRunning ? (
                <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2" />
                    In esecuzione...
                </span>
            ) : (
                'Avvia Processo'
            )}
        </button>
    </div>
);

const ExecutionHistoryItem: React.FC<{ execution: WorkflowExecution; onRetry: () => void }> = ({ execution, onRetry }) => {
    const statusColors = {
        running: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        success: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        error: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        timeout: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    };

    const statusIcons = {
        running: '⏳',
        success: '✅',
        error: '❌',
        timeout: '⏱️',
    };

    const duration = execution.endTime
        ? ((execution.endTime.getTime() - execution.startTime.getTime()) / 1000).toFixed(1)
        : 'In corso...';

    return (
        <div className="border-b border-gray-200 dark:border-gray-600 py-3 last:border-b-0">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg">{statusIcons[execution.status]}</span>
                        <p className="font-medium text-text-primary dark:text-dark-text-primary">
                            {execution.workflow}
                        </p>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[execution.status]}`}>
                            {execution.status}
                        </span>
                    </div>
                    <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                        {execution.startTime.toLocaleString('it-IT')} • Durata: {duration}s
                    </p>
                    {execution.message && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                            {execution.message}
                        </p>
                    )}
                    {execution.error && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                            Errore: {execution.error}
                        </p>
                    )}
                </div>
                {execution.status === 'error' && (
                    <button
                        onClick={onRetry}
                        className="ml-4 px-3 py-1 text-xs bg-primary text-white rounded-md hover:bg-indigo-700"
                    >
                        Riprova
                    </button>
                )}
            </div>
        </div>
    );
};

export const AiWorkflows: React.FC = () => {
    const [executionHistory, setExecutionHistory] = useState<WorkflowExecution[]>([]);
    const [runningWorkflows, setRunningWorkflows] = useState<Set<string>>(new Set());
    const [isHistoryModalOpen, setHistoryModalOpen] = useState(false);

    const handleTriggerWorkflow = async (workflowName: string) => {
        if (runningWorkflows.has(workflowName)) {
            toast.error(`Il workflow "${workflowName}" è già in esecuzione`);
            return;
        }

        const executionId = `exec-${Date.now()}`;
        const startTime = new Date();

        // Add to running workflows
        setRunningWorkflows(prev => new Set(prev).add(workflowName));

        // Add initial execution to history
        const newExecution: WorkflowExecution = {
            id: executionId,
            workflow: workflowName,
            status: 'running',
            startTime,
        };
        setExecutionHistory(prev => [newExecution, ...prev]);

        try {
            // Show loading toast
            const loadingToast = toast.loading(`Avvio del workflow "${workflowName}"...`);

            // Try to invoke the workflow
            const result = await invokeSupabaseFunction('trigger-ai-workflow', {
                workflow_name: workflowName,
            });

            const endTime = new Date();
            
            // Update execution history with success
            setExecutionHistory(prev =>
                prev.map(exec =>
                    exec.id === executionId
                        ? {
                              ...exec,
                              status: 'success',
                              endTime,
                              message: (result as { message?: string }).message || 'Workflow completato con successo',
                          }
                        : exec
                )
            );

            toast.success((result as { message?: string }).message || `Workflow "${workflowName}" completato!`, {
                id: loadingToast,
            });
        } catch (error: unknown) {
            const endTime = new Date();
            const errorObj = error as { error?: string; message?: string };
            const errorMessage = errorObj?.error || errorObj?.message || 'Errore sconosciuto';

            // Determine if it's a network error or timeout
            const isNetworkError = errorMessage.includes('fetch') || errorMessage.includes('network');
            const status: WorkflowExecution['status'] = isNetworkError ? 'timeout' : 'error';

            // Update execution history with error
            setExecutionHistory(prev =>
                prev.map(exec =>
                    exec.id === executionId
                        ? {
                              ...exec,
                              status,
                              endTime,
                              error: errorMessage,
                          }
                        : exec
                )
            );

            // Show detailed error with recovery suggestions
            toast.error(
                (t) => (
                    <div className="space-y-2">
                        <p className="font-semibold">❌ Errore Workflow</p>
                        <p className="text-sm">{errorMessage}</p>
                        {isNetworkError && (
                            <p className="text-xs text-gray-600">
                                💡 Suggerimento: Verifica la connessione di rete e riprova
                            </p>
                        )}
                        <button
                            onClick={() => {
                                toast.dismiss(t.id);
                                handleTriggerWorkflow(workflowName);
                            }}
                            className="text-xs bg-primary text-white px-3 py-1 rounded hover:bg-indigo-700"
                        >
                            Riprova ora
                        </button>
                    </div>
                ),
                { duration: 8000 }
            );
        } finally {
            // Remove from running workflows
            setRunningWorkflows(prev => {
                const newSet = new Set(prev);
                newSet.delete(workflowName);
                return newSet;
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <SparklesIcon className="w-8 h-8 text-primary dark:text-dark-primary" />
                    <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">
                        Workflow AI & Operazioni
                    </h1>
                </div>
                <button
                    onClick={() => setHistoryModalOpen(true)}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-200 font-medium"
                >
                    📜 Storico Esecuzioni ({executionHistory.length})
                </button>
            </div>

            <p className="text-text-secondary dark:text-dark-text-secondary max-w-3xl">
                Avvia manualmente i processi AI di back-end per l&apos;analisi dei dati, la manutenzione della piattaforma e le comunicazioni programmate.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                <WorkflowCard 
                    title="Analisi Rischio Churn"
                    description="Esegue un'analisi su tutti i clienti attivi per identificare quelli a rischio di abbandono basandosi su pattern di utilizzo e interazione."
                    icon={<TrendingDownIcon className="w-6 h-6 text-primary dark:text-dark-primary" />}
                    action={() => handleTriggerWorkflow('Analisi Churn')}
                    isRunning={runningWorkflows.has('Analisi Churn')}
                />
                <WorkflowCard 
                    title="Invio Email Programmate"
                    description="Forza l'invio immediato di tutte le email e i promemoria in coda, bypassando la normale schedulazione."
                    icon={<TemplateIcon className="w-6 h-6 text-primary dark:text-dark-primary" />}
                    action={() => handleTriggerWorkflow('Invio Email')}
                    isRunning={runningWorkflows.has('Invio Email')}
                />
                <WorkflowCard 
                    title="Riclassificazione Lead"
                    description="Riesegue l'algoritmo di lead scoring su tutti i contatti che non hanno un'opportunità associata per aggiornare la loro priorità."
                    icon={<SparklesIcon className="w-6 h-6 text-primary dark:text-dark-primary" />}
                    action={() => handleTriggerWorkflow('Riclassificazione Lead')}
                    isRunning={runningWorkflows.has('Riclassificazione Lead')}
                />
            </div>

            {/* Execution History Modal */}
            <Modal
                isOpen={isHistoryModalOpen}
                onClose={() => setHistoryModalOpen(false)}
                title="Storico Esecuzioni Workflow"
            >
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {executionHistory.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400">
                                Nessuna esecuzione ancora. Avvia un workflow per vedere lo storico.
                            </p>
                        </div>
                    ) : (
                        executionHistory.map(exec => (
                            <ExecutionHistoryItem
                                key={exec.id}
                                execution={exec}
                                onRetry={() => handleTriggerWorkflow(exec.workflow)}
                            />
                        ))
                    )}
                </div>
            </Modal>
        </div>
    );
};
