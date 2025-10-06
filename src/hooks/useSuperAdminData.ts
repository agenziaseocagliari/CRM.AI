import { useState, useEffect, useCallback } from 'react';

import { invokeSupabaseFunction } from '../lib/api';

import { diagnosticLogger } from '../lib/mockDiagnosticLogger';
// Types
export type OrganizationStatus = 'active' | 'trial' | 'suspended';
export type PaymentStatus = 'Paid' | 'Pending' | 'Failed';

export interface AdminOrganization {
    id: string;
    name: string;
    adminEmail: string;
    status: OrganizationStatus;
    paymentStatus: PaymentStatus;
    plan: 'Free' | 'Pro' | 'Enterprise';
    memberCount: number;
    createdAt: string;
}

export interface Transaction {
    id: string;
    organizationName: string;
    amount: number;
    date: string;
    status: PaymentStatus;
}

export interface AdminStat {
    totalSignups: number;
    totalRevenue: number;
    activeUsers: number;
    newSignupsThisWeek: number;
    churnRiskCount: number;
}

export interface Notification {
    id: string;
    type: 'AI Recommendation' | 'System Alert' | 'Admin Action';
    message: string;
    timestamp: string;
}

export interface AuditLog {
    id: string;
    timestamp: string;
    adminEmail: string;
    action: string;
    targetId?: string;
    operationType?: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ' | 'EXECUTE';
    targetType?: 'USER' | 'ORGANIZATION' | 'PAYMENT' | 'SYSTEM';
    result?: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
    details?: Record<string, unknown>;
    errorMessage?: string;
    ipAddress?: string;
    userAgent?: string;
}

// Hook
export const useSuperAdminData = () => {
    const [loading, setLoading] = useState(true);
    const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState<AdminStat | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

    const fetchData = useCallback(async () => {
        // Don't set loading=true on subsequent refetches to avoid UI flicker
        try {
            const [
                statsData,
                orgsData,
                transactionsData,
                logsData,
            ] = await Promise.all([
                invokeSupabaseFunction('superadmin-dashboard-stats'),
                invokeSupabaseFunction('superadmin-list-organizations'),
                invokeSupabaseFunction('superadmin-manage-payments'),
                invokeSupabaseFunction('superadmin-logs'),
            ]);

            setStats((statsData as { stats?: AdminStat }).stats || null);
            setOrganizations((orgsData as { customers?: AdminOrganization[] }).customers || []);
            setTransactions((transactionsData as { payments?: Transaction[] }).payments || []);
            setAuditLogs((logsData as { logs?: AuditLog[] }).logs || []);
            
            // Generate notifications based on data
            const newNotifications: Notification[] = [];
            
            // Check for churn risk
            const stats = (statsData as { stats?: AdminStat }).stats;
            if (stats?.churnRiskCount && stats.churnRiskCount > 0) {
                newNotifications.push({
                    id: 'churn-risk',
                    type: 'AI Recommendation',
                    message: `${stats.churnRiskCount} organizations at risk of churn (zero credits)`,
                    timestamp: new Date().toISOString(),
                });
            }
            
            // Check for new signups
            if (stats?.newSignupsThisWeek && stats.newSignupsThisWeek > 0) {
                newNotifications.push({
                    id: 'new-signups',
                    type: 'System Alert',
                    message: `${stats.newSignupsThisWeek} new signups this week`,
                    timestamp: new Date().toISOString(),
                });
            }
            
            setNotifications(newNotifications);

        } catch (error) {
            diagnosticLogger.error("Failed to fetch super admin data", error);
            // Error toast is handled by invokeSupabaseFunction
        } finally {
            setLoading(false);
        }
    }, []);
    
    // Initial data load effect
    useEffect(() => {
        setLoading(true);
        fetchData();
    }, [fetchData]);

    const updateCustomerStatus = useCallback(async (customerId: string, status: OrganizationStatus, reason?: string) => {
        await invokeSupabaseFunction('superadmin-update-organization', {
            organizationId: customerId,
            status,
            reason,
        });
        await fetchData();
    }, [fetchData]);

    const refundPayment = useCallback(async (transactionId: string) => {
        await invokeSupabaseFunction('superadmin-manage-payments', {
            action: 'refund',
            transactionId,
        });
        await fetchData();
    }, [fetchData]);

    return {
        organizations,
        transactions,
        stats,
        notifications,
        auditLogs,
        loading,
        refetch: fetchData,
        updateCustomerStatus,
        refundPayment,
    };
};

