import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import { supabase } from '../../lib/supabaseClient';
import { AutomationAgent, AgentExecutionLog } from '../../types';
import { 
    CheckCircleIcon, 
    ExclamationTriangleIcon, 
    CogIcon,
    ChartBarIcon,
    ShieldCheckIcon,
    CreditCardIcon,
    UserGroupIcon,
    BellAlertIcon
} from '../ui/icons';
import { Modal } from '../ui/Modal';

const getAgentIcon = (type: string) => {
    switch (type) {
        case 'health_monitor':
            return <ChartBarIcon className="w-6 h-6" />;
        case 'payment_revenue':
            return <CreditCardIcon className="w-6 h-6" />;
        case 'support_ticket':
            return <BellAlertIcon className="w-6 h-6" />;
        case 'user_engagement':
            return <UserGroupIcon className="w-6 h-6" />;
        case 'security_watcher':
            return <ShieldCheckIcon className="w-6 h-6" />;
        default:
            return <CogIcon className="w-6 h-6" />;
    }
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'running':
            return 'bg-blue-100 text-blue-800 border-blue-300';
        case 'error':
            return 'bg-red-100 text-red-800 border-red-300';
        case 'idle':
        default:
            return 'bg-gray-100 text-gray-800 border-gray-300';
    }
};

interface AgentCardProps {
    agent: AutomationAgent;
    onToggle: (agent: AutomationAgent) => void;
    onConfigure: (agent: AutomationAgent) => void;
    onViewLogs: (agent: AutomationAgent) => void;
    isLoading: boolean;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, onToggle, onConfigure, onViewLogs, isLoading }) => {
    return (
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-md border border-gray-200 dark:border-dark-border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                    <div className={`p-3 rounded-lg ${agent.is_active ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                        {getAgentIcon(agent.type)}
                    </div>
                    <div className="ml-4">
                        <h3 className="text-lg font-bold text-text-primary dark:text-dark-text-primary">{agent.name}</h3>
                        <p className="text-sm text-text-secondary dark:text-dark-text-secondary mt-1">{agent.description}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-secondary">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(agent.status)}`}>
                        {agent.status.toUpperCase()}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-secondary">Stato:</span>
                    <div className="flex items-center">
                        <button
                            onClick={() => onToggle(agent)}
                            disabled={isLoading}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                agent.is_active ? 'bg-primary' : 'bg-gray-300'
                            } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    agent.is_active ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                        <span className="ml-2 text-sm font-medium">
                            {agent.is_active ? (
                                <span className="text-green-600 flex items-center">
                                    <CheckCircleIcon className="w-4 h-4 mr-1" /> Attivo
                                </span>
                            ) : (
                                <span className="text-gray-500">Inattivo</span>
                            )}
                        </span>
                    </div>
                </div>

                {agent.last_run_at && (
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-text-secondary">Ultima Esecuzione:</span>
                        <span className="text-sm text-text-primary">
                            {new Date(agent.last_run_at).toLocaleString('it-IT')}
                        </span>
                    </div>
                )}

                {agent.last_error && (
                    <div className="flex items-start space-x-2 p-2 bg-red-50 rounded-md border border-red-200">
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-xs font-medium text-red-800">Ultimo Errore:</p>
                            <p className="text-xs text-red-700 mt-1">{agent.last_error}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center space-x-2 pt-4 border-t border-gray-200 dark:border-dark-border">
                <button
                    onClick={() => onConfigure(agent)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors flex items-center justify-center"
                >
                    <CogIcon className="w-4 h-4 mr-1" />
                    Configura
                </button>
                <button
                    onClick={() => onViewLogs(agent)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    Log
                </button>
            </div>
        </div>
    );
};

interface ConfigModalProps {
    agent: AutomationAgent | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (config: Record<string, unknown>) => void;
}

const ConfigurationModal: React.FC<ConfigModalProps> = ({ agent, isOpen, onClose, onSave }) => {
    const [config, setConfig] = useState<Record<string, unknown>>({});

    useEffect(() => {
        if (agent) {
            setConfig(agent.configuration || {});
        }
    }, [agent]);

    const handleSave = () => {
        onSave(config);
    };

    if (!agent) {return null;}

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Configura ${agent.name}`}>
            <div className="space-y-4">
                <p className="text-sm text-text-secondary">
                    Configura i parametri e le soglie per questo agente di automazione.
                </p>

                <div className="bg-gray-50 dark:bg-dark-sidebar p-4 rounded-lg">
                    <pre className="text-xs font-mono overflow-x-auto text-text-primary dark:text-dark-text-primary">
                        {JSON.stringify(config, null, 2)}
                    </pre>
                </div>

                <div className="text-sm text-gray-600 space-y-2">
                    <p><strong>Canali di Alert:</strong> {Array.isArray(config.alert_channels) ? config.alert_channels.join(', ') : Array.isArray(config.channels) ? config.channels.join(', ') : 'Non configurati'}</p>
                    {typeof config.check_interval_minutes === 'number' && (
                        <p><strong>Intervallo Check:</strong> {config.check_interval_minutes} minuti</p>
                    )}
                    {typeof config.thresholds === 'object' && config.thresholds && (
                        <div>
                            <p><strong>Soglie:</strong></p>
                            <ul className="ml-4 list-disc">
                                {Object.entries(config.thresholds).map(([key, value]) => (
                                    <li key={key}>{key}: {String(value)}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                        Chiudi
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90"
                    >
                        Salva
                    </button>
                </div>
            </div>
        </Modal>
    );
};

const LogsModal: React.FC<{ 
    agent: AutomationAgent | null; 
    isOpen: boolean; 
    onClose: () => void;
}> = ({ agent, isOpen, onClose }) => {
    const [logs, setLogs] = useState<AgentExecutionLog[]>([]);
    const [loading, setLoading] = useState(false);

    const loadLogs = useCallback(async () => {
        if (!agent) {return;}
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('agent_execution_logs')
                .select('*')
                .eq('agent_id', agent.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) {throw error;}
            setLogs(data || []);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
            toast.error(`Errore nel caricamento log: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    }, [agent]);

    useEffect(() => {
        if (agent && isOpen) {
            loadLogs();
        }
    }, [agent, isOpen, loadLogs]);

    if (!agent) {return null;}

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Log Esecuzioni - ${agent.name}`}>
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                        <p className="text-sm text-text-secondary mt-2">Caricamento log...</p>
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
                                {log.result_summary && (
                                    <pre className="text-xs font-mono overflow-x-auto mt-2 text-text-primary">
                                        {JSON.stringify(log.result_summary, null, 2)}
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

export const AutomationAgents: React.FC = () => {
    const [agents, setAgents] = useState<AutomationAgent[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<AutomationAgent | null>(null);
    const [configModalOpen, setConfigModalOpen] = useState(false);
    const [logsModalOpen, setLogsModalOpen] = useState(false);

    useEffect(() => {
        loadAgents();
    }, []);

    const loadAgents = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('automation_agents')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) {throw error;}
            setAgents(data || []);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
            toast.error(`Errore nel caricamento agenti: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAgent = async (agent: AutomationAgent) => {
        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('automation_agents')
                .update({ is_active: !agent.is_active })
                .eq('id', agent.id);

            if (error) {throw error;}

            toast.success(`Agente ${agent.is_active ? 'disattivato' : 'attivato'} con successo`);
            loadAgents();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
            toast.error(`Errore: ${errorMessage}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleConfigureAgent = (agent: AutomationAgent) => {
        setSelectedAgent(agent);
        setConfigModalOpen(true);
    };

    const handleViewLogs = (agent: AutomationAgent) => {
        setSelectedAgent(agent);
        setLogsModalOpen(true);
    };

    const handleSaveConfiguration = async (config: Record<string, unknown>) => {
        if (!selectedAgent) {return;}

        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('automation_agents')
                .update({ configuration: config })
                .eq('id', selectedAgent.id);

            if (error) {throw error;}

            toast.success('Configurazione salvata con successo');
            setConfigModalOpen(false);
            loadAgents();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
            toast.error(`Errore nel salvataggio: ${errorMessage}`);
        } finally {
            setActionLoading(false);
        }
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">Agenti di Automazione</h1>
                    <p className="text-text-secondary dark:text-dark-text-secondary mt-1">
                        Gestisci e monitora gli agenti AI per automazione e controllo del sistema
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-text-secondary">
                        {agents.filter(a => a.is_active).length} / {agents.length} agenti attivi
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.map((agent) => (
                    <AgentCard
                        key={agent.id}
                        agent={agent}
                        onToggle={handleToggleAgent}
                        onConfigure={handleConfigureAgent}
                        onViewLogs={handleViewLogs}
                        isLoading={actionLoading}
                    />
                ))}
            </div>

            <ConfigurationModal
                agent={selectedAgent}
                isOpen={configModalOpen}
                onClose={() => setConfigModalOpen(false)}
                onSave={handleSaveConfiguration}
            />

            <LogsModal
                agent={selectedAgent}
                isOpen={logsModalOpen}
                onClose={() => setLogsModalOpen(false)}
            />
        </div>
    );
};
