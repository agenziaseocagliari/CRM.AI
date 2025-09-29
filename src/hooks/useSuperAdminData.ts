import { useState, useEffect, useCallback } from 'react';

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

// Mock Data Generation (Initial Data Source)
const generateInitialOrganizations = (): AdminOrganization[] => Array.from({ length: 150 }, (_, i) => {
    const statuses: OrganizationStatus[] = ['active', 'trial', 'suspended'];
    const status = statuses[i % statuses.length];
    
    return {
        id: `org_${i + 1}`,
        name: `Azienda Cliente ${i + 1}`,
        adminEmail: `admin${i+1}@cliente.com`,
        status,
        paymentStatus: status === 'active' ? 'Paid' : status === 'trial' ? 'Pending' : 'Failed',
        plan: ['Free', 'Pro', 'Enterprise'][i % 3] as AdminOrganization['plan'],
        memberCount: Math.floor(Math.random() * 50) + 1,
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    };
});

const generateInitialTransactions = (orgs: AdminOrganization[]): Transaction[] => Array.from({ length: 200 }, (_, i) => {
    const org = orgs[i % orgs.length];
    return {
        id: `txn_${i + 1}`,
        organizationName: org.name,
        amount: parseFloat((Math.random() * 500 + 50).toFixed(2)),
        date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        status: org.paymentStatus === 'Failed' && Math.random() > 0.5 ? 'Failed' : 'Paid',
    }
});

const initialStats: AdminStat = {
    totalSignups: 150,
    totalRevenue: 250890,
    activeUsers: 123,
    newSignupsThisWeek: 12,
    churnRiskCount: 8,
};

const initialNotifications: Notification[] = [
    { id: '1', type: 'AI Recommendation', message: 'Cliente "Azienda Cliente 3" a rischio churn. Contattare.', timestamp: new Date().toISOString() },
    { id: '2', type: 'System Alert', message: 'Backup completato con successo.', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
    { id: '3', type: 'Admin Action', message: 'Hai sospeso l\'account "Azienda Cliente 2".', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
];

const generateInitialAuditLogs = (orgs: AdminOrganization[]): AuditLog[] => Array.from({ length: 50 }, (_, i) => {
    const actions = ['Sospeso account', 'Rimborsato pagamento', 'Attivato prova', 'Cambiato piano'];
    const org = orgs[i % orgs.length];
    return {
        id: `log_${i + 1}`,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        adminEmail: 'superadmin@guardianai.com',
        action: actions[i % actions.length],
        targetId: org.id,
    }
});


// Hook
export const useSuperAdminData = () => {
    const [loading, setLoading] = useState(true);
    const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState<AdminStat | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

    const fetchData = useCallback(() => {
        setLoading(true);
        // We generate new data on each fetch to simulate getting fresh data from a server
        const newOrgs = generateInitialOrganizations();
        const newTransactions = generateInitialTransactions(newOrgs);
        const newLogs = generateInitialAuditLogs(newOrgs);

        setTimeout(() => {
            setOrganizations(newOrgs);
            setTransactions(newTransactions);
            setStats(initialStats);
            setNotifications(initialNotifications);
            setAuditLogs(newLogs);
            setLoading(false);
        }, 500);
    }, []);
    
    // Initial data load effect
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const updateCustomerStatus = useCallback(async (customerId: string, status: OrganizationStatus) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        let updatedCustomer: AdminOrganization | undefined;

        setOrganizations(currentOrgs => {
            const newOrgs = currentOrgs.map(org => {
                if (org.id === customerId) {
                    updatedCustomer = {
                        ...org,
                        status,
                        paymentStatus: status === 'suspended' ? 'Failed' : status === 'trial' ? 'Pending' : 'Paid'
                    };
                    return updatedCustomer;
                }
                return org;
            });
            return newOrgs;
        });

        // The component will re-render due to state change.
        // We can still return a promise that resolves with the updated data.
        return { success: true, customer: updatedCustomer };
    }, []);

    return {
        organizations,
        transactions,
        stats,
        notifications,
        auditLogs,
        loading,
        refetch: fetchData,
        updateCustomerStatus,
    };
};