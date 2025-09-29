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


const simulateApiCall = <T>(data: T, delay = 500): Promise<T> => 
    new Promise(resolve => setTimeout(() => resolve(data), delay));


export const useSuperAdminData = () => {
    const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState<SuperAdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [orgs, trans, statsData] = await Promise.all([
                simulateApiCall(mockOrganizations),
                simulateApiCall(mockTransactions),
                simulateApiCall(mockStats, 800),
            ]);
            setOrganizations(orgs);
            setTransactions(trans);
            setStats(statsData);
        } catch (error) {
            console.error("Failed to fetch super admin data", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { organizations, transactions, stats, loading, refetch: fetchData };
};