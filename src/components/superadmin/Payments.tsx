import React from 'react';
import toast from 'react-hot-toast';
import { useSuperAdminData, Transaction, PaymentStatus } from '../../hooks/useSuperAdminData';

const statusStyles: Record<PaymentStatus, string> = {
    Paid: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    Failed: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};

export const Payments: React.FC = () => {
    const { transactions, loading, refetch } = useSuperAdminData();

    const handleAction = async (action: string, orgName: string) => {
        const promise = new Promise(resolve => setTimeout(resolve, 1000));
        toast.promise(promise, {
            loading: `${action}...`,
            success: `Azione completata per ${orgName}!`,
            error: `Errore durante l'azione.`,
        });
        await promise;
        refetch();
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">Pagamenti e Abbonamenti</h1>
            
            <div className="bg-card dark:bg-dark-card shadow-md rounded-lg overflow-hidden">
                 <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cliente</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Importo</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Data</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stato</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Azioni</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                         {loading ? (
                            <tr><td colSpan={5} className="text-center py-8">Caricamento transazioni...</td></tr>
                        ) : transactions.map(txn => (
                            <tr key={txn.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary dark:text-dark-text-primary">{txn.organizationName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary dark:text-dark-text-secondary">€{txn.amount.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary dark:text-dark-text-secondary">{new Date(txn.date).toLocaleDateString('it-IT')}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[txn.status]}`}>
                                        {txn.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                     <button onClick={() => handleAction('Rimborso', txn.organizationName)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">Rimborso</button>
                                     <button onClick={() => handleAction('Modifica subscription', txn.organizationName)} className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Modifica</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
