import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';
import { APIIntegration, IntegrationUsageLog } from '../../types';
import { 
    ExclamationTriangleIcon,
    PaperAirplaneIcon,
    KeyIcon,
    GlobeAltIcon,
    ChartBarIcon,
    PencilIcon,
    TrashIcon
} from '../ui/icons';
import { Modal } from '../ui/Modal';

const getProviderIcon = (providerType: string) => {
    switch (providerType) {
        case 'messaging':
            return '💬';
        case 'email':
            return '📧';
        case 'ai':
            return '🤖';
        case 'push':
            return '🔔';
        default:
            return '🔌';
    }
};

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'connected':
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-300">✓ Connesso</span>;
        case 'error':
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-300">✗ Errore</span>;
        case 'rate_limited':
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300">⚠ Rate Limit</span>;
        default:
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-300">○ Disconnesso</span>;
    }
};

interface IntegrationCardProps {
    integration: APIIntegration;
    onEdit: (integration: APIIntegration) => void;
    onTest: (integration: APIIntegration) => void;
    onViewStats: (integration: APIIntegration) => void;
    onDelete: (integration: APIIntegration) => void;
    onToggle: (integration: APIIntegration) => void;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({ 
    integration, 
    onEdit, 
    onTest, 
    onViewStats, 
    onDelete,
    onToggle 
}) => {
    return (
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-md border border-gray-200 dark:border-dark-border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                    <div className="text-4xl">{getProviderIcon(integration.provider_type)}</div>
                    <div className="ml-4">
                        <h3 className="text-lg font-bold text-text-primary dark:text-dark-text-primary">{integration.display_name}</h3>
                        <p className="text-xs text-text-secondary dark:text-dark-text-secondary mt-0.5 uppercase font-medium">
                            {integration.provider_type}
                        </p>
                    </div>
                </div>
                {getStatusBadge(integration.status)}
            </div>

            <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Stato:</span>
                    <button
                        onClick={() => onToggle(integration)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            integration.is_active ? 'bg-primary' : 'bg-gray-300'
                        }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                integration.is_active ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>

                {integration.last_ping_at && (
                    <div className="flex items-center justify-between">
                        <span className="text-text-secondary">Ultimo Ping:</span>
                        <span className="text-text-primary">{new Date(integration.last_ping_at).toLocaleString('it-IT')}</span>
                    </div>
                )}

                {integration.usage_stats && Object.keys(integration.usage_stats).length > 0 && (
                    <div className="flex items-center justify-between">
                        <span className="text-text-secondary">Utilizzo Mensile:</span>
                        <span className="text-text-primary font-medium">
                            {integration.usage_stats.monthly_requests || 0} richieste
                        </span>
                    </div>
                )}

                {integration.last_error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-start space-x-2">
                            <ExclamationTriangleIcon className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-red-700">{integration.last_error}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-200 dark:border-dark-border">
                <button
                    onClick={() => onEdit(integration)}
                    className="px-3 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors flex items-center justify-center"
                >
                    <PencilIcon className="w-4 h-4 mr-1" />
                    Modifica
                </button>
                <button
                    onClick={() => onTest(integration)}
                    disabled={!integration.is_active}
                    className="px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <PaperAirplaneIcon className="w-4 h-4 mr-1" />
                    Test
                </button>
                <button
                    onClick={() => onViewStats(integration)}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                >
                    <ChartBarIcon className="w-4 h-4 mr-1" />
                    Stats
                </button>
                <button
                    onClick={() => onDelete(integration)}
                    className="px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center"
                >
                    <TrashIcon className="w-4 h-4 mr-1" />
                    Elimina
                </button>
            </div>
        </div>
    );
};

const EditIntegrationModal: React.FC<{
    integration: APIIntegration | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (integration: Partial<APIIntegration>) => void;
}> = ({ integration, isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<APIIntegration>>({});
    const [showCredentials, setShowCredentials] = useState(false);

    useEffect(() => {
        if (integration) {
            setFormData(integration);
        } else {
            setFormData({
                provider_name: '',
                provider_type: 'custom',
                display_name: '',
                is_active: false,
                credentials: {},
                configuration: {},
                status: 'disconnected',
            });
        }
    }, [integration]);

    const handleSave = () => {
        if (!formData.display_name || !formData.provider_name) {
            toast.error('Nome e provider sono obbligatori');
            return;
        }
        onSave(formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={integration ? 'Modifica Integrazione' : 'Nuova Integrazione'}>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Nome Display</label>
                    <input
                        type="text"
                        value={formData.display_name || ''}
                        onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Es: WhatsApp Business"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Provider Name</label>
                    <input
                        type="text"
                        value={formData.provider_name || ''}
                        onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Es: whatsapp_business"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Tipo Provider</label>
                    <select
                        value={formData.provider_type || 'custom'}
                        onChange={(e) => setFormData({ ...formData, provider_type: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        <option value="messaging">Messaging</option>
                        <option value="email">Email</option>
                        <option value="ai">AI</option>
                        <option value="push">Push Notification</option>
                        <option value="custom">Custom</option>
                    </select>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-text-primary">Credenziali (JSON)</label>
                        <button
                            onClick={() => setShowCredentials(!showCredentials)}
                            className="text-xs text-primary hover:underline flex items-center"
                        >
                            <KeyIcon className="w-3 h-3 mr-1" />
                            {showCredentials ? 'Nascondi' : 'Mostra'}
                        </button>
                    </div>
                    <textarea
                        value={JSON.stringify(formData.credentials || {}, null, 2)}
                        onChange={(e) => {
                            try {
                                setFormData({ ...formData, credentials: JSON.parse(e.target.value) });
                            } catch {
                                // Invalid JSON, allow user to continue typing
                            }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-xs"
                        rows={4}
                        placeholder='{"api_key": "your-key-here"}'
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Configurazione (JSON)</label>
                    <textarea
                        value={JSON.stringify(formData.configuration || {}, null, 2)}
                        onChange={(e) => {
                            try {
                                setFormData({ ...formData, configuration: JSON.parse(e.target.value) });
                            } catch {
                                // Invalid JSON
                            }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-xs"
                        rows={4}
                        placeholder='{"endpoint": "https://api.example.com"}'
                    />
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                        Annulla
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

const StatsModal: React.FC<{
    integration: APIIntegration | null;
    isOpen: boolean;
    onClose: () => void;
}> = ({ integration, isOpen, onClose }) => {
    const [logs, setLogs] = useState<IntegrationUsageLog[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (integration && isOpen) {
            loadLogs();
        }
    }, [integration, isOpen]);

    const loadLogs = async () => {
        if (!integration) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('integration_usage_logs')
                .select('*')
                .eq('integration_id', integration.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setLogs(data || []);
        } catch (error: any) {
            toast.error(`Errore nel caricamento statistiche: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!integration) return null;

    const successCount = logs.filter(l => l.status === 'success').length;
    const errorCount = logs.filter(l => l.status === 'error').length;
    const avgExecutionTime = logs.length > 0 
        ? Math.round(logs.reduce((sum, l) => sum + (l.execution_time_ms || 0), 0) / logs.length)
        : 0;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Statistiche - ${integration.display_name}`}>
            <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-green-600">{successCount}</p>
                        <p className="text-xs text-green-700">Successi</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-red-600">{errorCount}</p>
                        <p className="text-xs text-red-700">Errori</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-blue-600">{avgExecutionTime}ms</p>
                        <p className="text-xs text-blue-700">Tempo Medio</p>
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold text-text-primary mb-2">Log Recenti (ultimi 50)</h4>
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        </div>
                    ) : logs.length === 0 ? (
                        <p className="text-text-secondary text-center py-8">Nessun log disponibile</p>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {logs.map((log) => (
                                <div key={log.id} className="bg-gray-50 p-2 rounded border text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className={`px-2 py-0.5 rounded font-semibold ${
                                            log.status === 'success' ? 'bg-green-100 text-green-800' :
                                            log.status === 'error' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {log.status}
                                        </span>
                                        <span className="text-text-secondary">{log.action_type}</span>
                                        <span className="text-text-secondary">
                                            {new Date(log.created_at).toLocaleString('it-IT')}
                                        </span>
                                    </div>
                                    {log.error_message && (
                                        <p className="text-red-600 mt-1">{log.error_message}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

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

export const APIIntegrationsManager: React.FC = () => {
    const [integrations, setIntegrations] = useState<APIIntegration[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIntegration, setSelectedIntegration] = useState<APIIntegration | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [statsModalOpen, setStatsModalOpen] = useState(false);
    const [filterType, setFilterType] = useState<string>('all');

    useEffect(() => {
        loadIntegrations();
    }, []);

    const loadIntegrations = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('api_integrations')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;
            setIntegrations(data || []);
        } catch (error: any) {
            toast.error(`Errore nel caricamento integrazioni: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (integration: APIIntegration) => {
        setSelectedIntegration(integration);
        setEditModalOpen(true);
    };

    const handleNew = () => {
        setSelectedIntegration(null);
        setEditModalOpen(true);
    };

    const handleSave = async (integrationData: Partial<APIIntegration>) => {
        try {
            if (selectedIntegration) {
                const { error } = await supabase
                    .from('api_integrations')
                    .update(integrationData)
                    .eq('id', selectedIntegration.id);

                if (error) throw error;
                toast.success('Integrazione aggiornata con successo');
            } else {
                const { error } = await supabase
                    .from('api_integrations')
                    .insert([integrationData]);

                if (error) throw error;
                toast.success('Integrazione creata con successo');
            }

            setEditModalOpen(false);
            loadIntegrations();
        } catch (error: any) {
            toast.error(`Errore: ${error.message}`);
        }
    };

    const handleTest = async (integration: APIIntegration) => {
        toast.success(`Test per ${integration.display_name} - Funzionalità in sviluppo`);
        // TODO: Implement actual test functionality via edge function
    };

    const handleViewStats = (integration: APIIntegration) => {
        setSelectedIntegration(integration);
        setStatsModalOpen(true);
    };

    const handleDelete = async (integration: APIIntegration) => {
        if (!confirm(`Sei sicuro di voler eliminare ${integration.display_name}?`)) return;

        try {
            const { error } = await supabase
                .from('api_integrations')
                .delete()
                .eq('id', integration.id);

            if (error) throw error;
            toast.success('Integrazione eliminata con successo');
            loadIntegrations();
        } catch (error: any) {
            toast.error(`Errore: ${error.message}`);
        }
    };

    const handleToggle = async (integration: APIIntegration) => {
        try {
            const { error } = await supabase
                .from('api_integrations')
                .update({ is_active: !integration.is_active })
                .eq('id', integration.id);

            if (error) throw error;
            toast.success(`Integrazione ${integration.is_active ? 'disattivata' : 'attivata'}`);
            loadIntegrations();
        } catch (error: any) {
            toast.error(`Errore: ${error.message}`);
        }
    };

    const filteredIntegrations = filterType === 'all' 
        ? integrations 
        : integrations.filter(i => i.provider_type === filterType);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">
                        Gestione API & Integrazioni
                    </h1>
                    <p className="text-text-secondary dark:text-dark-text-secondary mt-1">
                        Configura e monitora tutte le integrazioni API esterne
                    </p>
                </div>
                <button
                    onClick={handleNew}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium flex items-center"
                >
                    <GlobeAltIcon className="w-5 h-5 mr-2" />
                    Nuova Integrazione
                </button>
            </div>

            <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-text-secondary">Filtra per tipo:</span>
                <div className="flex space-x-2">
                    {['all', 'messaging', 'email', 'ai', 'push', 'custom'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-3 py-1 text-sm rounded-full transition-colors ${
                                filterType === type
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {type === 'all' ? 'Tutti' : type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {filteredIntegrations.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-dark-card rounded-lg border">
                    <GlobeAltIcon className="w-16 h-16 mx-auto text-gray-300" />
                    <h3 className="mt-4 text-lg font-medium text-text-primary">Nessuna integrazione trovata</h3>
                    <p className="mt-2 text-text-secondary">Crea una nuova integrazione per iniziare</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredIntegrations.map((integration) => (
                        <IntegrationCard
                            key={integration.id}
                            integration={integration}
                            onEdit={handleEdit}
                            onTest={handleTest}
                            onViewStats={handleViewStats}
                            onDelete={handleDelete}
                            onToggle={handleToggle}
                        />
                    ))}
                </div>
            )}

            <EditIntegrationModal
                integration={selectedIntegration}
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                onSave={handleSave}
            />

            <StatsModal
                integration={selectedIntegration}
                isOpen={statsModalOpen}
                onClose={() => setStatsModalOpen(false)}
            />
        </div>
    );
};
