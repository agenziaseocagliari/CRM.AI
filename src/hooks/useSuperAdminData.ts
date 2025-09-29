import { useState, useEffect, useCallback } from 'react';
import { invokeSupabaseFunction } from '../lib/api';

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
                notificationsData,
            ] = await Promise.all([
                invokeSupabaseFunction('get-superadmin-stats'),
                invokeSupabaseFunction('get-superadmin-customers'),
                invokeSupabaseFunction('get-superadmin-payments'),
                invokeSupabaseFunction('get-superadmin-audit-logs'),
                invokeSupabaseFunction('get-superadmin-notifications'),
            ]);

            setStats(statsData.stats || null);
            setOrganizations(orgsData.customers || []);
            setTransactions(transactionsData.payments || []);
            setAuditLogs(logsData.logs || []);
            setNotifications(notificationsData.notifications || []);

        } catch (error) {
            console.error("Failed to fetch super admin data", error);
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
        await invokeSupabaseFunction('update-organization-status', {
            organizationId: customerId,
            status,
            reason,
        });
        await fetchData();
    }, [fetchData]);

    const refundPayment = useCallback(async (transactionId: string) => {
        await invokeSupabaseFunction('refund-payment', {
            transaction_id: transactionId,
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