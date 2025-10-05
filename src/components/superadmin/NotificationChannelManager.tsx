import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface NotificationChannel {
    id: string;
    name: string;
    type: 'email' | 'sms' | 'webhook' | 'slack';
    status: 'active' | 'inactive' | 'error';
    priority: number;
    config: {
        endpoint?: string;
        apiKey?: string;
        from?: string;
        template?: string;
    };
    lastUsed?: Date;
    successRate: number;
}

const NotificationChannelManager: React.FC = () => {
    const [channels, setChannels] = useState<NotificationChannel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadChannels();
    }, []);

    const loadChannels = async () => {
        try {
            setLoading(true);
            const mockChannels: NotificationChannel[] = [
                {
                    id: '1',
                    name: 'Primary Email',
                    type: 'email',
                    status: 'active',
                    priority: 1,
                    config: {
                        from: 'noreply@guardian-ai-crm.com',
                        template: 'default'
                    },
                    successRate: 98.5
                }
            ];
            setChannels(mockChannels);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            toast.error('Error loading channels: ' + errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-text-primary">Notification Channels</h1>
            </div>
            <div className="grid gap-4">
                {channels.map((channel) => (
                    <div key={channel.id} className="bg-white p-4 rounded-lg border">
                        <h3 className="font-medium text-text-primary">{channel.name}</h3>
                        <p className="text-sm text-text-secondary capitalize">{channel.type}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NotificationChannelManager;
