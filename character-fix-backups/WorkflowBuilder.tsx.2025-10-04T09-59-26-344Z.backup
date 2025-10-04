import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

import { invokeSupabaseFunction } from '../../lib/api';
import { supabase } from '../../lib/supabaseClient';
import { WorkflowDefinition, WorkflowExecutionLog } from '../../types';
import { 
    SparklesIcon,
    MessageBotIcon,
    UserCircleIcon,
    PlayIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon,
    ClockIcon
} from '../ui/icons';
import { Modal } from '../ui/Modal';

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

interface WorkflowCardProps {
    workflow: WorkflowDefinition;
    onEdit: (workflow: WorkflowDefinition) => void;
    onDelete: (workflow: WorkflowDefinition) => void;
    onToggle: (workflow: WorkflowDefinition) => void;
    onExecute: (workflow: WorkflowDefinition) => void;
    onViewLogs: (workflow: WorkflowDefinition) => void;
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({ 
    workflow, 
    onEdit, 
    onDelete, 
    onToggle,
    onExecute,
    onViewLogs 
}) => {
    const getTriggerBadge = (type: string) => {
        switch (type) {
            case 'manual':
                return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">🔘 Manuale</span>;
            case 'schedule':
                return <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">⏰ Pianificato</span>;
            case 'event':
                return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">⚡ Evento</span>;
            case 'condition':
                return <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">🎯 Condizione</span>;
            default:
                return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">? Sconosciuto</span>;
        }
    };

    return (
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-md border border-gray-200 dark:border-dark-border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-text-primary dark:text-dark-text-primary">{workflow.name}</h3>
                    {workflow.description && (
                        <p className="text-sm text-text-secondary dark:text-dark-text-secondary mt-1">{workflow.description}</p>
                    )}
                </div>
                <button
                    onClick={() => onToggle(workflow)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        workflow.is_active ? 'bg-primary' : 'bg-gray-300'
                    }`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            workflow.is_active ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                </button>
            </div>

            <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Trigger:</span>
                    {getTriggerBadge(workflow.trigger_type)}
                </div>

                {workflow.last_executed_at && (
                    <div className="flex items-center justify-between">
                        <span className="text-text-secondary">Ultima Esecuzione:</span>
                        <span className="text-text-primary">
                            {new Date(workflow.last_executed_at).toLocaleString('it-IT')}
                        </span>
                    </div>
                )}

                <div className="bg-gray-50 dark:bg-dark-sidebar p-3 rounded-md border border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-1">Prompt Originale:</p>
                    <p className="text-xs text-gray-700 italic">&ldquo;{workflow.natural_language_prompt}&rdquo;</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-200 dark:border-dark-border">
                <button
                    onClick={() => onExecute(workflow)}
                    disabled={!workflow.is_active}
                    className="px-3 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <PlayIcon className="w-4 h-4 mr-1" />
                    Esegui
                </button>
                <button
                    onClick={() => onViewLogs(workflow)}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    Log
                </button>
                <button
                    onClick={() => onEdit(workflow)}
                    className="px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center"
                >
                    <PencilIcon className="w-4 h-4 mr-1" />
                    Modifica
                </button>
                <button
                    onClick={() => onDelete(workflow)}
                    className="px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center"
                >
                    <TrashIcon className="w-4 h-4 mr-1" />
                    Elimina
                </button>
            </div>
        </div>
    );
};

const LogsModal: React.FC<{
    workflow: WorkflowDefinition | null;
    isOpen: boolean;
    onClose: () => void;
}> = ({ workflow, isOpen, onClose }) => {
    const [logs, setLogs] = useState<WorkflowExecutionLog[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (workflow && isOpen) {
            loadLogs();
        }
    }, [workflow, isOpen]);

    const loadLogs = async () => {
        if (!workflow) {return;}
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('workflow_execution_logs')
                .select('*')
                .eq('workflow_id', workflow.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) {throw error;}
            setLogs(data || []);
        } catch (error: any) {
            toast.error(`Errore nel caricamento log: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!workflow) {return null;}

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Log Esecuzioni - ${workflow.name}`}>
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-text-secondary">Nessun log disponibile</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {logs.map((log) => (
                            <div key={log.id} className="bg-gray-50 dark:bg-dark-sidebar p-3 rounded-lg border">
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                        log.status === 'success' ? 'bg-green-100 text-green-800' :
                                        log.status === 'error' ? 'bg-red-100 text-red-800' :
                                        log.status === 'running' ? 'bg-blue-100 text-blue-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {log.status.toUpperCase()}
                                    </span>
                                    <span className="text-xs text-text-secondary">
                                        {new Date(log.created_at).toLocaleString('it-IT')}
                                    </span>
                                </div>
                                {log.execution_result && (
                                    <pre className="text-xs font-mono overflow-x-auto mt-2 text-text-primary">
                                        {JSON.stringify(log.execution_result, null, 2)}
                                    </pre>
                                )}
                                {log.error_details && (
                                    <p className="text-xs text-red-600 mt-2">{log.error_details}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex justify-end pt-4 border-t">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                        Chiudi
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export const WorkflowBuilder: React.FC = () => {
    const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [lastInteraction, setLastInteraction] = useState<{ user: string; ai: string } | null>(null);
    const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDefinition | null>(null);
    const [logsModalOpen, setLogsModalOpen] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadWorkflows();
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadWorkflows = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('workflow_definitions')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {throw error;}
            setWorkflows(data || []);
        } catch (error: any) {
            toast.error(`Errore nel caricamento workflow: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) {return;}

        setLastInteraction(null);
        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const data = await invokeSupabaseFunction('process-automation-request', { 
                prompt: userMessage.text 
            });

            if (!data.reply) {throw new Error("La risposta dell'AI non è valida.");}

            const aiMessage: Message = { sender: 'ai', text: data.reply };
            setMessages(prev => [...prev, aiMessage]);
            setLastInteraction({ user: userMessage.text, ai: aiMessage.text });
        } catch (err: any) {
            const errorMessage: Message = { 
                sender: 'ai', 
                text: `Mi dispiace, si è verificato un errore. Riprova più tardi.` 
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveWorkflow = async () => {
        if (!lastInteraction) {return;}
        setIsLoading(true);

        try {
            const { error } = await supabase.from('workflow_definitions').insert({
                name: lastInteraction.user.substring(0, 100),
                description: lastInteraction.ai.substring(0, 500),
                natural_language_prompt: lastInteraction.user,
                workflow_json: { steps: [{ description: lastInteraction.ai }] },
                trigger_type: 'manual',
                trigger_config: {},
                is_active: false,
            });

            if (error) {throw error;}
            toast.success('Workflow salvato con successo!');
            loadWorkflows();
            setMessages([]);
            setLastInteraction(null);
        } catch (err: any) {
            toast.error(`Errore nel salvataggio: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleWorkflow = async (workflow: WorkflowDefinition) => {
        try {
            const { error } = await supabase
                .from('workflow_definitions')
                .update({ is_active: !workflow.is_active })
                .eq('id', workflow.id);

            if (error) {throw error;}
            toast.success(`Workflow ${workflow.is_active ? 'disattivato' : 'attivato'}`);
            loadWorkflows();
        } catch (error: any) {
            toast.error(`Errore: ${error.message}`);
        }
    };

    const handleExecuteWorkflow = async (workflow: WorkflowDefinition) => {
        toast.success(`Esecuzione workflow "${workflow.name}" - Funzionalità in sviluppo`);
        // TODO: Implement actual workflow execution via edge function
    };

    const handleEditWorkflow = (_workflow: WorkflowDefinition) => {
        toast('Modifica workflow - Funzionalità in sviluppo', { icon: 'ℹ️' });
        // TODO: Implement workflow editing
    };

    const handleDeleteWorkflow = async (workflow: WorkflowDefinition) => {
        if (!confirm(`Sei sicuro di voler eliminare "${workflow.name}"?`)) {return;}

        try {
            const { error } = await supabase
                .from('workflow_definitions')
                .delete()
                .eq('id', workflow.id);

            if (error) {throw error;}
            toast.success('Workflow eliminato con successo');
            loadWorkflows();
        } catch (error: any) {
            toast.error(`Errore: ${error.message}`);
        }
    };

    const handleViewLogs = (workflow: WorkflowDefinition) => {
        setSelectedWorkflow(workflow);
        setLogsModalOpen(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">
                    Workflow Builder AI
                </h1>
                <p className="text-text-secondary dark:text-dark-text-secondary mt-1">
                    Crea automazioni in linguaggio naturale con l'assistenza AI
                </p>
            </div>

            {/* Chat Builder Section */}
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-dark-border">
                <div className="p-4 border-b border-gray-200 dark:border-dark-border">
                    <h2 className="text-xl font-bold text-text-primary dark:text-dark-text-primary flex items-center">
                        <SparklesIcon className="w-6 h-6 mr-2 text-primary" />
                        AI Workflow Assistant
                    </h2>
                    <p className="text-sm text-text-secondary mt-1">
                        Descrivi l'automazione che vuoi creare e l'AI ti aiuterà a strutturarla
                    </p>
                </div>

                <div className="h-96 overflow-y-auto p-6 space-y-4">
                    {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-text-secondary">
                            <div className="text-center">
                                <SparklesIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                <p>Inizia descrivendo l'automazione che vuoi creare...</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex items-start gap-4 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                                    {msg.sender === 'ai' && (
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-primary flex-shrink-0">
                                            <MessageBotIcon className="w-6 h-6"/>
                                        </div>
                                    )}
                                    <div className={`max-w-2xl px-4 py-3 rounded-2xl ${
                                        msg.sender === 'user' 
                                            ? 'bg-primary text-white rounded-br-none' 
                                            : 'bg-gray-100 dark:bg-dark-sidebar text-text-primary dark:text-dark-text-primary rounded-bl-none'
                                    }`}>
                                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                    </div>
                                    {msg.sender === 'user' && (
                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0">
                                            <UserCircleIcon className="w-7 h-7"/>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-primary flex-shrink-0">
                                        <MessageBotIcon className="w-6 h-6"/>
                                    </div>
                                    <div className="max-w-2xl px-4 py-3 rounded-2xl bg-gray-100 dark:bg-dark-sidebar">
                                        <div className="flex items-center space-x-2">
                                            <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <span className="h-2 w-2 bg-primary rounded-full animate-bounce" />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </>
                    )}
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-sidebar">
                    {lastInteraction && (
                        <div className="text-center mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-md">
                            <p className="text-sm text-indigo-800 dark:text-indigo-200">
                                Ti piace questo workflow? Salvalo per usarlo in futuro.
                            </p>
                            <button
                                onClick={handleSaveWorkflow}
                                disabled={isLoading}
                                className="mt-2 bg-primary text-white font-semibold px-4 py-2 text-sm rounded-lg hover:bg-primary/90 disabled:bg-gray-400 flex items-center mx-auto"
                            >
                                <CheckCircleIcon className="w-4 h-4 mr-2" />
                                {isLoading ? 'Salvataggio...' : 'Salva Workflow'}
                            </button>
                        </div>
                    )}
                    <form onSubmit={handleSendMessage} className="flex items-center gap-4">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Es: Quando un cliente non paga, invia un promemoria email dopo 7 giorni..."
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-dark-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-dark-card"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="bg-primary text-white px-6 py-2 rounded-full hover:bg-primary/90 disabled:bg-gray-400 font-semibold"
                        >
                            Invia
                        </button>
                    </form>
                </div>
            </div>

            {/* Existing Workflows Section */}
            <div>
                <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary mb-4">
                    I Tuoi Workflow ({workflows.length})
                </h2>
                {workflows.length === 0 ? (
                    <div className="bg-white dark:bg-dark-card rounded-lg shadow border border-gray-200 dark:border-dark-border p-8 text-center">
                        <ClockIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-text-primary">Nessun workflow creato ancora</h3>
                        <p className="text-text-secondary mt-2">Usa l'assistente AI sopra per creare il tuo primo workflow</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {workflows.map((workflow) => (
                            <WorkflowCard
                                key={workflow.id}
                                workflow={workflow}
                                onEdit={handleEditWorkflow}
                                onDelete={handleDeleteWorkflow}
                                onToggle={handleToggleWorkflow}
                                onExecute={handleExecuteWorkflow}
                                onViewLogs={handleViewLogs}
                            />
                        ))}
                    </div>
                )}
            </div>

            <LogsModal
                workflow={selectedWorkflow}
                isOpen={logsModalOpen}
                onClose={() => setLogsModalOpen(false)}
            />
        </div>
    );
};
