import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useSuperAdminData, AdminOrganization, OrganizationStatus } from '../../hooks/useSuperAdminData';
import { CustomerDetailModal } from './CustomerDetailModal';
import { ConfirmationModal } from '../ui/ConfirmationModal';

const statusStyles: Record<OrganizationStatus, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    trial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    suspended: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};

const paymentStatusStyles: Record<AdminOrganization['paymentStatus'], string> = {
    Paid: 'text-green-600 dark:text-green-400',
    Pending: 'text-yellow-600 dark:text-yellow-400',
    Failed: 'text-red-600 dark:text-red-400',
};


export const Customers: React.FC = () => {
    const { organizations, loading, refetch, updateCustomerStatus } = useSuperAdminData();
    const [filter, setFilter] = useState<OrganizationStatus | 'all'>('all');
    const [selectedCustomer, setSelectedCustomer] = useState<AdminOrganization | null>(null);

    const [confirmAction, setConfirmAction] = useState<{ org: AdminOrganization; status: OrganizationStatus } | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);

    const filteredOrganizations = useMemo(() => {
        if (filter === 'all') return organizations;
        return organizations.filter(org => org.status === filter);
    }, [organizations, filter]);

    const handleOpenConfirm = (org: AdminOrganization, status: OrganizationStatus) => {
        setConfirmAction({ org, status });
    };

    const handleConfirmStatusChange = async (reason?: string) => {
        if (!confirmAction) return;
        setIsConfirming(true);

        const { org, status } = confirmAction;
        
        try {
            await updateCustomerStatus(org.id, status);
            toast.success(`Stato di ${org.name} aggiornato!`);
            console.log(`Azione "Sospensione" eseguita per ${org.name} con motivo: ${reason || 'Nessun motivo'}`);
        } catch (e) {
            toast.error(`Errore durante l'aggiornamento.`);
        } finally {
            setIsConfirming(false);
            setConfirmAction(null);
        }
    };
    
    const handleActivateTrial = (org: AdminOrganization) => {
        const promise = updateCustomerStatus(org.id, 'trial');
        toast.promise(promise, {
            loading: `Attivazione prova per ${org.name}...`,
            success: `Prova attivata per ${org.name}!`,
            error: `Errore durante l'attivazione.`,
        });
    }

    return (
        <>
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">Gestione Clienti</h1>

                <div className="flex items-center space-x-2">
                    {(['all', 'active', 'trial', 'suspended'] as const).map(f => (
                         <button 
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${filter === f ? 'bg-primary text-white dark:bg-dark-primary' : 'bg-card dark:bg-dark-card hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="bg-card dark:bg-dark-card shadow-md rounded-lg overflow-hidden">
                     <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cliente</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stato</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stato Pagamento</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Azioni</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {loading ? (
                                <tr><td colSpan={4} className="text-center py-8">Caricamento clienti...</td></tr>
                            ) : filteredOrganizations.map(org => (
                                <tr key={org.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{org.name}</div>
                                        <div className="text-sm text-text-secondary dark:text-dark-text-secondary">{org.adminEmail}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[org.status]}`}>
                                            {org.status}
                                        </span>
                                    </td>
                                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <span className={paymentStatusStyles[org.paymentStatus]}>{org.paymentStatus}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button onClick={() => setSelectedCustomer(org)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">Visualizza</button>
                                        <button onClick={() => handleOpenConfirm(org, 'suspended')} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Sospendi</button>
                                        <button onClick={() => handleActivateTrial(org)} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">Attiva Prova</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <CustomerDetailModal 
                isOpen={!!selectedCustomer}
                onClose={() => setSelectedCustomer(null)}
                customer={selectedCustomer}
                onActionSuccess={refetch}
            />

            <ConfirmationModal
                isOpen={!!confirmAction && confirmAction.status === 'suspended'}
                onClose={() => setConfirmAction(null)}
                onConfirm={handleConfirmStatusChange}
                title={`Conferma Sospensione`}
                message={<span>Sei sicuro di voler sospendere l'account <strong>{confirmAction?.org.name}</strong>? L'utente non potrà accedere al servizio.</span>}
                isConfirming={isConfirming}
                requiresReason={true}
                confirmText="Sospendi Account"
            />
        </>
    );
};