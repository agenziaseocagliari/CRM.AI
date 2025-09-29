import { useState, useEffect, useCallback } from 'react';

// Types for Super Admin Data
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

export interface SuperAdminStats {
    totalSignups: number;
    totalRevenue: number;
    activeUsers: number;
    newSignupsThisWeek: number;
    churnRiskCount: number;
}

// FIX: Added Notification and AuditLog types to be exported and used across the super admin panel.
export interface Notification {
    id: string;
    type: 'AI Recommendation' | 'System Alert' | 'New Signup';
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

const mockOrganizations: AdminOrganization[] = [
    { id: 'org_1', name: 'Innovate Inc.', adminEmail: 'admin@innovate.com', status: 'active', paymentStatus: 'Paid', plan: 'Pro', memberCount: 12, createdAt: '2023-01-15' },
    { id: 'org_2', name: 'Data Solutions', adminEmail: 'contact@data-sol.com', status: 'trial', paymentStatus: 'Pending', plan: 'Pro', memberCount: 5, createdAt: '2023-08-20' },
    { id: 'org_3', name: 'Marketing Masters', adminEmail: 'ceo@marketingmasters.io', status: 'active', paymentStatus: 'Paid', plan: 'Enterprise', memberCount: 50, createdAt: '2022-11-30' },
    { id: 'org_4', name: 'Suspended Co.', adminEmail: 'manager@suspended.co', status: 'suspended', paymentStatus: 'Failed', plan: 'Pro', memberCount: 8, createdAt: '2023-03-10' },
    { id: 'org_5', name: 'New Gen Tech', adminEmail: 'support@newgen.tech', status: 'active', paymentStatus: 'Paid', plan: 'Pro', memberCount: 25, createdAt: '2023-07-01' },
    { id: 'org_6', name: 'Trial Testers', adminEmail: 'test@trial.com', status: 'trial', paymentStatus: 'Pending', plan: 'Free', memberCount: 1, createdAt: '2023-09-05' },
];

const mockTransactions: Transaction[] = [
    { id: 'txn_1', organizationName: 'Innovate Inc.', amount: 99.00, date: '2023-09-01', status: 'Paid' },
    { id: 'txn_2', organizationName: 'Marketing Masters', amount: 299.00, date: '2023-09-01', status: 'Paid' },
    { id: 'txn_3', organizationName: 'Suspended Co.', amount: 99.00, date: '2023-08-15', status: 'Failed' },
    { id: 'txn_4', organizationName: 'New Gen Tech', amount: 99.00, date: '2023-08-28', status: 'Paid' },
    { id: 'txn_5', organizationName: 'Innovate Inc.', amount: 99.00, date: '2023-08-01', status: 'Paid' },
];

const mockStats: SuperAdminStats = {
    totalSignups: 1250,
    totalRevenue: 45800,
    activeUsers: 980,
    newSignupsThisWeek: 42,
    churnRiskCount: 15,
};

// FIX: Added mock data for notifications and audit logs.
const mockNotifications: Notification[] = [
    { id: 'notif_1', type: 'AI Recommendation', message: 'Customer "Innovate Inc." shows high churn risk. Recommend intervention.', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 'notif_2', type: 'System Alert', message: 'Database backup completed successfully.', timestamp: new Date(Date.now() - 7200000).toISOString() },
    { id: 'notif_3', type: 'New Signup', message: 'New organization "Future Tech" has just signed up for a trial.', timestamp: new Date(Date.now() - 86400000).toISOString() },
];

const mockAuditLogs: AuditLog[] = [
    { id: 'log_1', timestamp: new Date(Date.now() - 100000).toISOString(), adminEmail: 'super@admin.com', action: 'Suspended Organization', targetId: 'org_4' },
    { id: 'log_2', timestamp: new Date(Date.now() - 200000).toISOString(), adminEmail: 'super@admin.com', action: 'Upgraded Plan', targetId: 'org_3' },
    { id: 'log_3', timestamp: new Date(Date.now() - 300000).toISOString(), adminEmail: 'devops@admin.com', action: 'Ran Churn Analysis Workflow' },
    { id: 'log_4', timestamp: new Date(Date.now() - 400000).toISOString(), adminEmail: 'super@admin.com', action: 'Viewed Customer Details', targetId: 'org_1' },
    { id: 'log_5', timestamp: new Date(Date.now() - 500000).toISOString(), adminEmail: 'super@admin.com', action: 'Refunded Payment', targetId: 'txn_3' },
];

const simulateApiCall = <T>(data: T, delay = 500): Promise<T> => 
    new Promise(resolve => setTimeout(() => resolve(data), delay));


export const useSuperAdminData = () => {
    const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState<SuperAdminStats | null>(null);
    // FIX: Added state for notifications and audit logs.
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // FIX: Fetch notifications and audit logs along with other data.
            const [orgs, trans, statsData, notifs, logs] = await Promise.all([
                simulateApiCall(mockOrganizations),
                simulateApiCall(mockTransactions),
                simulateApiCall(mockStats, 800),
                simulateApiCall(mockNotifications, 600),
                simulateApiCall(mockAuditLogs, 700),
            ]);
            setOrganizations(orgs);
            setTransactions(trans);
            setStats(statsData);
            setNotifications(notifs);
            setAuditLogs(logs);
        } catch (error) {
            console.error("Failed to fetch super admin data", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // FIX: Returned notifications and auditLogs from the hook.
    return { organizations, transactions, stats, notifications, auditLogs, loading, refetch: fetchData };
};
