/* eslint-disable no-alert */
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import { 
    BellIcon, 
    GlobeAltIcon,
    CogIcon,
    PlayIcon
} from '../ui/icons';
import { Modal } from '../ui/Modal';

// Arrow icons using simple SVG
const ArrowUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
);

const ArrowDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

export type ChannelType = 'email' | 'slack' | 'telegram' | 'webhook' | 'sms' | 'push';
export type ChannelStatus = 'active' | 'inactive' | 'error' | 'testing';
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';

export interface NotificationChannel {
    id: string;
    name: string;
    type: ChannelType;
    status: ChannelStatus;
    priority: number;
    config: {
        endpoint?: string;
        api_key?: string;
        from_email?: string;
        from_name?: string;
        webhook_url?: string;
        chat_id?: string;
        bot_token?: string;
    };
    fallback_channel_id?: string;
    test_mode: boolean;
    last_used_at?: string;
    error_count: number;
    success_count: number;
    created_at: string;
    updated_at: string;
}

interface ChannelCardProps {
    channel: NotificationChannel;
    onEdit: (channel: NotificationChannel) => void;
    onTest: (channel: NotificationChannel) => void;
    onToggleStatus: (channel: NotificationChannel) => void;
    onDelete: (channel: NotificationChannel) => void;
    onMovePriority: (channel: NotificationChannel, direction: 'up' | 'down') => void;
}

const channelIcons: Record<ChannelType, React.ReactNode> = {
    email: <BellIcon className="w-5 h-5" />,
    slack: <BellIcon className="w-5 h-5" />,
    telegram: <BellIcon className="w-5 h-5" />,
    webhook: <GlobeAltIcon className="w-5 h-5" />,
    sms: <BellIcon className="w-5 h-5" />,
    push: <BellIcon className="w-5 h-5" />,
};

const statusColors: Record<ChannelStatus, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    error: 'bg-red-100 text-red-800',
    testing: 'bg-blue-100 text-blue-800',
};

const ChannelCard: React.FC<ChannelCardProps> = ({ 
    channel, 
    onEdit, 
    onTest, 
    onToggleStatus,
    onMovePriority 
}) => {
    return (
        <div className="bg-white dark:bg-dark-card rounded-lg shadow border border-gray-200 dark:border-dark-border p-4">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        {channelIcons[channel.type]}
                    </div>
                    <div>
                        <h3 className="font-semibold text-text-primary dark:text-dark-text-primary">
                            {channel.name}
                        </h3>
                        <p className="text-xs text-text-secondary capitalize">{channel.type}</p>
                    </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[channel.status]}`}>
                    {channel.status}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                <div>
                    <span className="text-text-secondary">Priority:</span>
                    <span className="ml-2 font-semibold text-text-primary">#{channel.priority}</span>
                </div>
                <div>
                    <span className="text-text-secondary">Success Rate:</span>
                    <span className="ml-2 font-semibold text-text-primary">
                        {channel.success_count + channel.error_count > 0 
                            ? Math.round((channel.success_count / (channel.success_count + channel.error_count)) * 100)
                            : 0}%
                    </span>
                </div>
            </div>

            {channel.last_used_at && (
                <p className="text-xs text-text-secondary mb-3">
                    Last used: {new Date(channel.last_used_at).toLocaleString('it-IT')}
                </p>
            )}

            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => onTest(channel)}
                    className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded hover:bg-blue-100 flex items-center"
                >
                    <PlayIcon className="w-3 h-3 mr-1" />
                    Test
                </button>
                <button
                    onClick={() => onEdit(channel)}
                    className="px-3 py-1.5 text-xs font-medium bg-gray-50 text-gray-700 rounded hover:bg-gray-100 flex items-center"
                >
                    <CogIcon className="w-3 h-3 mr-1" />
                    Edit
                </button>
                <button
                    onClick={() => onMovePriority(channel, 'up')}
                    className="px-2 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded hover:bg-green-100"
                >
                    <ArrowUpIcon className="w-3 h-3" />
                </button>
                <button
                    onClick={() => onMovePriority(channel, 'down')}
                    className="px-2 py-1.5 text-xs font-medium bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100"
                >
                    <ArrowDownIcon className="w-3 h-3" />
                </button>
                <button
                    onClick={() => onToggleStatus(channel)}
                    className={`px-3 py-1.5 text-xs font-medium rounded ${
                        channel.status === 'active' 
                            ? 'bg-red-50 text-red-700 hover:bg-red-100' 
                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                >
                    {channel.status === 'active' ? 'Disable' : 'Enable'}
                </button>
            </div>
        </div>
    );
};

export const NotificationChannelManager: React.FC = () => {
    const [channels, setChannels] = useState<NotificationChannel[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState<NotificationChannel | null>(null);
    const [, setTestResults] = useState<Record<string, any>>({});

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        type: 'email' as ChannelType,
        priority: 1,
        config: {},
        fallback_channel_id: '',
        test_mode: false
    });

    useEffect(() => {
        loadChannels();
    }, []);

    const loadChannels = async () => {
        setLoading(true);
        try {
            // In a real implementation, this would fetch from database
            // For now, using mock data
            const mockChannels: NotificationChannel[] = [
                {
                    id: '1',
                    name: 'Primary Email',
                    type: 'email',
                    status: 'active',
                    priority: 1,
                    config: {
                        from_email: 'noreply@example.com',
                        from_name: 'Guardian AI CRM'
                    },
                    test_mode: false,
                    error_count: 2,
                    success_count: 148,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    id: '2',
                    name: 'Slack Alerts',
                    type: 'slack',
                    status: 'active',
                    priority: 2,
                    config: {
                        webhook_url: 'https://hooks.slack.com/services/...'
                    },
                    fallback_channel_id: '1',
                    test_mode: false,
                    error_count: 0,
                    success_count: 95,
                    last_used_at: new Date(Date.now() - 3600000).toISOString(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    id: '3',
                    name: 'Telegram Bot',
                    type: 'telegram',
                    status: 'inactive',
                    priority: 3,
                    config: {
                        bot_token: '***hidden***',
                        chat_id: '123456789'
                    },
                    test_mode: true,
                    error_count: 5,
                    success_count: 45,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ];
            setChannels(mockChannels);
        } catch (error: any) {
            toast.error(`Error loading channels: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAddChannel = async () => {
        try {
            const newChannel: NotificationChannel = {
                id: `ch-${Date.now()}`,
                ...formData,
                status: 'inactive',
                error_count: 0,
                success_count: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            setChannels(prev => [...prev, newChannel]);
            toast.success('Channel added successfully!');
            setShowAddModal(false);
            resetForm();
        } catch (error: any) {
            toast.error(`Error adding channel: ${error.message}`);
        }
    };

    const handleEditChannel = async () => {
        if (!selectedChannel) {return;}

        try {
            setChannels(prev => prev.map(ch => 
                ch.id === selectedChannel.id 
                    ? { ...ch, ...formData, updated_at: new Date().toISOString() }
                    : ch
            ));
            toast.success('Channel updated successfully!');
            setShowEditModal(false);
            setSelectedChannel(null);
            resetForm();
        } catch (error: any) {
            toast.error(`Error updating channel: ${error.message}`);
        }
    };

    const handleTestChannel = async (channel: NotificationChannel) => {
        setTestResults(prev => ({ ...prev, [channel.id]: { testing: true } }));
        
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const success = Math.random() > 0.2; // 80% success rate
            
            setTestResults(prev => ({
                ...prev,
                [channel.id]: {
                    testing: false,
                    success,
                    message: success 
                        ? 'Test message sent successfully!' 
                        : 'Failed to send test message. Check configuration.',
                    timestamp: new Date().toISOString()
                }
            }));

            if (success) {
                toast.success(`Test sent to ${channel.name}`);
            } else {
                toast.error(`Test failed for ${channel.name}`);
            }
        } catch (error: any) {
            setTestResults(prev => ({
                ...prev,
                [channel.id]: {
                    testing: false,
                    success: false,
                    message: error.message
                }
            }));
            toast.error(`Error testing channel: ${error.message}`);
        }
    };

    const handleToggleStatus = (channel: NotificationChannel) => {
        const newStatus = channel.status === 'active' ? 'inactive' : 'active';
        setChannels(prev => prev.map(ch => 
            ch.id === channel.id 
                ? { ...ch, status: newStatus, updated_at: new Date().toISOString() }
                : ch
        ));
        toast.success(`Channel ${newStatus === 'active' ? 'enabled' : 'disabled'}`);
    };

    const handleMovePriority = (channel: NotificationChannel, direction: 'up' | 'down') => {
        const newPriority = direction === 'up' ? channel.priority - 1 : channel.priority + 1;
        if (newPriority < 1) {return;}

        setChannels(prev => {
            const updated = prev.map(ch => {
                if (ch.id === channel.id) {
                    return { ...ch, priority: newPriority, updated_at: new Date().toISOString() };
                }
                if (ch.priority === newPriority) {
                    return { ...ch, priority: channel.priority, updated_at: new Date().toISOString() };
                }
                return ch;
            });
            return updated.sort((a, b) => a.priority - b.priority);
        });
        toast.success('Priority updated');
    };

    const handleDelete = (channel: NotificationChannel) => {
        if (confirm(`Are you sure you want to delete ${channel.name}?`)) {
            setChannels(prev => prev.filter(ch => ch.id !== channel.id));
            toast.success('Channel deleted');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'email',
            priority: channels.length + 1,
            config: {},
            fallback_channel_id: '',
            test_mode: false
        });
    };

    const openEditModal = (channel: NotificationChannel) => {
        setSelectedChannel(channel);
        setFormData({
            name: channel.name,
            type: channel.type,
            priority: channel.priority,
            config: channel.config,
            fallback_channel_id: channel.fallback_channel_id || '',
            test_mode: channel.test_mode
        });
        setShowEditModal(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">
                        Notification Channels
                    </h1>
                    <p className="text-text-secondary mt-1">
                        Configure and manage notification delivery channels
                    </p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowAddModal(true);
                    }}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 font-semibold flex items-center"
                >
                    <BellIcon className="w-5 h-5 mr-2" />
                    Add Channel
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-dark-card rounded-lg shadow p-4 border border-gray-200 dark:border-dark-border">
                    <div className="text-sm text-text-secondary">Total Channels</div>
                    <div className="text-2xl font-bold text-text-primary dark:text-dark-text-primary mt-1">
                        {channels.length}
                    </div>
                </div>
                <div className="bg-white dark:bg-dark-card rounded-lg shadow p-4 border border-gray-200 dark:border-dark-border">
                    <div className="text-sm text-text-secondary">Active</div>
                    <div className="text-2xl font-bold text-green-600 mt-1">
                        {channels.filter(ch => ch.status === 'active').length}
                    </div>
                </div>
                <div className="bg-white dark:bg-dark-card rounded-lg shadow p-4 border border-gray-200 dark:border-dark-border">
                    <div className="text-sm text-text-secondary">Total Sent</div>
                    <div className="text-2xl font-bold text-text-primary dark:text-dark-text-primary mt-1">
                        {channels.reduce((sum, ch) => sum + ch.success_count, 0)}
                    </div>
                </div>
                <div className="bg-white dark:bg-dark-card rounded-lg shadow p-4 border border-gray-200 dark:border-dark-border">
                    <div className="text-sm text-text-secondary">Error Rate</div>
                    <div className="text-2xl font-bold text-red-600 mt-1">
                        {(() => {
                            const total = channels.reduce((sum, ch) => sum + ch.success_count + ch.error_count, 0);
                            const errors = channels.reduce((sum, ch) => sum + ch.error_count, 0);
                            return total > 0 ? ((errors / total) * 100).toFixed(1) : 0;
                        })()}%
                    </div>
                </div>
            </div>

            {/* Channels List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {channels
                        .sort((a, b) => a.priority - b.priority)
                        .map(channel => (
                            <ChannelCard
                                key={channel.id}
                                channel={channel}
                                onEdit={openEditModal}
                                onTest={handleTestChannel}
                                onToggleStatus={handleToggleStatus}
                                onDelete={handleDelete}
                                onMovePriority={handleMovePriority}
                            />
                        ))
                    }
                </div>
            )}

            {/* Add Channel Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Add Notification Channel"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Channel Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                            placeholder="e.g., Primary Email Service"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Channel Type</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as ChannelType })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                        >
                            <option value="email">Email</option>
                            <option value="slack">Slack</option>
                            <option value="telegram">Telegram</option>
                            <option value="webhook">Webhook</option>
                            <option value="sms">SMS</option>
                            <option value="push">Push Notification</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Priority</label>
                        <input
                            type="number"
                            min="1"
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Configuration (JSON)</label>
                        <textarea
                            value={JSON.stringify(formData.config, null, 2)}
                            onChange={(e) => {
                                try {
                                    const config = JSON.parse(e.target.value);
                                    setFormData({ ...formData, config });
                                } catch (err) {
                                    // Invalid JSON
                                }
                            }}
                            rows={6}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary"
                            placeholder='{"api_key": "...", "endpoint": "..."}'
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            checked={formData.test_mode}
                            onChange={(e) => setFormData({ ...formData, test_mode: e.target.checked })}
                            className="mr-2"
                        />
                        <label className="text-sm">Enable test mode</label>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <button
                            onClick={() => setShowAddModal(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddChannel}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90"
                        >
                            Add Channel
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Edit Channel Modal - Similar structure to Add Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedChannel(null);
                }}
                title="Edit Notification Channel"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Channel Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Configuration (JSON)</label>
                        <textarea
                            value={JSON.stringify(formData.config, null, 2)}
                            onChange={(e) => {
                                try {
                                    const config = JSON.parse(e.target.value);
                                    setFormData({ ...formData, config });
                                } catch (err) {
                                    // Invalid JSON
                                }
                            }}
                            rows={6}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <button
                            onClick={() => {
                                setShowEditModal(false);
                                setSelectedChannel(null);
                            }}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleEditChannel}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
