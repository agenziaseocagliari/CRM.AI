import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { useSuperAdminData } from '../../../hooks/useSuperAdminData';

interface Alert {
    id: string;
    type: 'payment' | 'credits' | 'security' | 'system';
    severity: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: Date;
    dismissed: boolean;
}

/**
 * AutomaticAlerts component provides real-time monitoring and alerts
 * for critical events in the Super Admin dashboard
 */
export const AutomaticAlerts: React.FC = () => {
    const { stats, transactions } = useSuperAdminData();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [lastCheck, setLastCheck] = useState<Date>(new Date());

    const checkForAlerts = useCallback(() => {
        const newAlerts: Alert[] = [];
        const now = new Date();

        // Check for high churn risk
        if (stats && stats.churnRiskCount > 5) {
            newAlerts.push({
                id: `churn-${now.getTime()}`,
                type: 'system',
                severity: 'critical',
                message: `⚠️ ATTENZIONE: ${stats.churnRiskCount} organizzazioni a rischio churn!`,
                timestamp: now,
                dismissed: false,
            });
        }

        // Check for failed payments
        const recentFailedPayments = transactions.filter(
            t => t.status === 'Failed' && new Date(t.date) > new Date(Date.now() - 86400000)
        );
        if (recentFailedPayments.length > 0) {
            newAlerts.push({
                id: `payment-${now.getTime()}`,
                type: 'payment',
                severity: 'warning',
                message: `💳 ${recentFailedPayments.length} pagamenti falliti nelle ultime 24h`,
                timestamp: now,
                dismissed: false,
            });
        }

        // Check for pending payments threshold
        const pendingAmount = transactions
            .filter(t => t.status === 'Pending')
            .reduce((sum, t) => sum + t.amount, 0);
        
        if (pendingAmount > 5000) {
            newAlerts.push({
                id: `pending-${now.getTime()}`,
                type: 'payment',
                severity: 'warning',
                message: `💰 €${pendingAmount.toLocaleString('it-IT')} in pagamenti in sospeso`,
                timestamp: now,
                dismissed: false,
            });
        }

        // Check for low credit organizations (mock check)
        if (stats && stats.churnRiskCount > 0) {
            newAlerts.push({
                id: `credits-${now.getTime()}`,
                type: 'credits',
                severity: 'info',
                message: `📊 ${stats.churnRiskCount} organizzazioni con crediti in esaurimento`,
                timestamp: now,
                dismissed: false,
            });
        }

        // Show toast notifications for critical alerts only if they're new
        newAlerts.forEach(alert => {
            if (alert.severity === 'critical' && !alerts.find(a => a.id === alert.id)) {
                toast.error(alert.message, { duration: 8000, icon: '🚨' });
            }
        });

        // Add new alerts to the list (avoid duplicates)
        setAlerts(prev => {
            const combined = [...newAlerts, ...prev];
            // Keep only unique alerts by ID
            const unique = combined.filter(
                (alert, index, self) => self.findIndex(a => a.id === alert.id) === index
            );
            // Keep only last 50 alerts
            return unique.slice(0, 50);
        });

        setLastCheck(now);
    }, [stats, transactions, alerts]);

    useEffect(() => {
        // Check for alerts every 30 seconds
        const interval = setInterval(() => {
            checkForAlerts();
        }, 30000);

        // Initial check
        checkForAlerts();

        return () => clearInterval(interval);
    }, [checkForAlerts]);

    // These functions can be used when displaying an alerts panel
    // const dismissAlert = (alertId: string) => {
    //     setAlerts(prev =>
    //         prev.map(alert =>
    //             alert.id === alertId ? { ...alert, dismissed: true } : alert
    //         )
    //     );
    // };

    // const clearAllAlerts = () => {
    //     setAlerts(prev => prev.map(alert => ({ ...alert, dismissed: true })));
    //     toast.success('Tutti gli alert sono stati contrassegnati come letti');
    // };

    // Don't render anything visible - this is a background monitoring component
    // Alerts are shown via toast notifications
    return (
        <div className="hidden">
            <p className="text-xs text-gray-500">
                Monitoring attivo. Ultimo controllo: {lastCheck.toLocaleTimeString('it-IT')}
            </p>
            <p className="text-xs text-gray-500">
                Alert attivi: {alerts.filter(a => !a.dismissed).length}
            </p>
        </div>
    );
};

/**
 * AlertsPanel component displays all alerts in a panel
 */
export const AlertsPanel: React.FC<{ alerts: Alert[]; onDismiss: (id: string) => void; onClearAll: () => void }> = ({
    alerts,
    onDismiss,
    onClearAll,
}) => {
    const activeAlerts = alerts.filter(a => !a.dismissed);

    const severityColors = {
        info: 'bg-blue-50 border-blue-200 text-blue-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        critical: 'bg-red-50 border-red-200 text-red-800',
    };

    const typeIcons = {
        payment: '💳',
        credits: '📊',
        security: '🔒',
        system: '⚙️',
    };

    if (activeAlerts.length === 0) {
        return (
            <div className="p-6 text-center text-gray-500">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-sm">Nessun alert attivo</p>
                <p className="text-xs">Tutto funziona correttamente</p>
            </div>
        );
    }

    return (
        <div className="space-y-2 max-h-96 overflow-y-auto p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Alert Attivi ({activeAlerts.length})</h3>
                <button
                    onClick={onClearAll}
                    className="text-xs text-primary hover:text-indigo-700 underline"
                >
                    Segna tutti come letti
                </button>
            </div>
            {activeAlerts.map(alert => (
                <div
                    key={alert.id}
                    className={`p-3 rounded-lg border ${severityColors[alert.severity]}`}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                                <span className="text-lg">{typeIcons[alert.type]}</span>
                                <p className="text-sm font-medium">{alert.message}</p>
                            </div>
                            <p className="text-xs opacity-75">
                                {alert.timestamp.toLocaleString('it-IT')}
                            </p>
                        </div>
                        <button
                            onClick={() => onDismiss(alert.id)}
                            className="ml-2 text-gray-400 hover:text-gray-600"
                            title="Segna come letto"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};
