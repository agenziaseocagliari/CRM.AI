import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useSuperAdminData, PaymentStatus, Transaction } from '../../hooks/useSuperAdminData';
import { Modal } from '../ui/Modal';

const statusStyles: Record<PaymentStatus, string> = {
    Paid: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    Failed: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};

interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    features: string[];
}

const plans: SubscriptionPlan[] = [
    {
        id: 'free',
        name: 'Free',
        price: 0,
        features: ['100 crediti/mese', 'Supporto base', '1 utente']
    },
    {
        id: 'pro',
        name: 'Pro',
        price: 49,
        features: ['1000 crediti/mese', 'Supporto prioritario', '5 utenti', 'AI avanzata']
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 199,
        features: ['Crediti illimitati', 'Supporto dedicato', 'Utenti illimitati', 'Custom AI', 'SLA garantito']
    }
];

export const Payments: React.FC = () => {
    const { transactions, loading, refundPayment } = useSuperAdminData();
    const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [filterStatus, setFilterStatus] = useState<PaymentStatus | 'all'>('all');

    const handleRefund = (txn: Transaction) => {
        const promise = refundPayment(txn.id);
        toast.promise(promise, {
            loading: `Esecuzione rimborso per ${txn.organizationName}...`,
            success: `Rimborso completato! I dati verranno aggiornati.`,
            error: `Errore durante il rimborso.`,
        });
    };

    const handleViewDetails = (txn: Transaction) => {
        setSelectedTransaction(txn);
    };

    const handleUpgradePlan = (planId: string) => {
        toast.success(`Piano ${planId} selezionato. Funzionalità in arrivo.`);
        setUpgradeModalOpen(false);
    };

    const filteredTransactions = transactions.filter(
        txn => filterStatus === 'all' || txn.status === filterStatus
    );

    const totalRevenue = transactions
        .filter(t => t.status === 'Paid')
        .reduce((sum, t) => sum + t.amount, 0);

    const pendingAmount = transactions
        .filter(t => t.status === 'Pending')
        .reduce((sum, t) => sum + t.amount, 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">
                    Pagamenti e Abbonamenti
                </h1>
                <button
                    onClick={() => setUpgradeModalOpen(true)}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                    📊 Gestisci Piani
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card dark:bg-dark-card p-6 rounded-lg shadow">
                    <p className="text-sm text-text-secondary dark:text-dark-text-secondary">Fatturato Totale</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        €{totalRevenue.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="bg-card dark:bg-dark-card p-6 rounded-lg shadow">
                    <p className="text-sm text-text-secondary dark:text-dark-text-secondary">Pagamenti in Sospeso</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        €{pendingAmount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="bg-card dark:bg-dark-card p-6 rounded-lg shadow">
                    <p className="text-sm text-text-secondary dark:text-dark-text-secondary">Transazioni Totali</p>
                    <p className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">
                        {transactions.length}
                    </p>
                </div>
            </div>

            {/* Filter */}
            <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                    <button
                        onClick={() => setFilterStatus('all')}
                        className={`px-3 py-1 text-sm rounded-md ${
                            filterStatus === 'all'
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                        }`}
                    >
                        Tutti
                    </button>
                    <button
                        onClick={() => setFilterStatus('Paid')}
                        className={`px-3 py-1 text-sm rounded-md ${
                            filterStatus === 'Paid'
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                        }`}
                    >
                        Pagati
                    </button>
                    <button
                        onClick={() => setFilterStatus('Pending')}
                        className={`px-3 py-1 text-sm rounded-md ${
                            filterStatus === 'Pending'
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                        }`}
                    >
                        In Sospeso
                    </button>
                    <button
                        onClick={() => setFilterStatus('Failed')}
                        className={`px-3 py-1 text-sm rounded-md ${
                            filterStatus === 'Failed'
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                        }`}
                    >
                        Falliti
                    </button>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-card dark:bg-dark-card shadow-md rounded-lg overflow-hidden">
                {filteredTransactions.length === 0 && !loading ? (
                    <div className="p-8 text-center">
                        <div className="text-6xl mb-4">💳</div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
                            Nessuna transazione
                        </h3>
                        <p className="text-text-secondary dark:text-dark-text-secondary text-sm">
                            {filterStatus === 'all'
                                ? 'Non ci sono transazioni da visualizzare. I pagamenti appariranno qui.'
                                : `Nessuna transazione con stato "${filterStatus}".`}
                        </p>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Cliente
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Importo
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Data
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Stato
                                </th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Azioni</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                                        <p className="mt-2 text-text-secondary dark:text-dark-text-secondary">
                                            Caricamento transazioni...
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map(txn => (
                                    <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary dark:text-dark-text-primary">
                                            {txn.organizationName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary dark:text-dark-text-secondary">
                                            €{txn.amount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary dark:text-dark-text-secondary">
                                            {new Date(txn.date).toLocaleDateString('it-IT')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[txn.status]}`}>
                                                {txn.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => handleViewDetails(txn)}
                                                className="text-primary hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                            >
                                                Dettagli
                                            </button>
                                            {txn.status === 'Paid' && (
                                                <button
                                                    onClick={() => handleRefund(txn)}
                                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                >
                                                    Rimborso
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Transaction Details Modal */}
            {selectedTransaction && (
                <Modal
                    isOpen={!!selectedTransaction}
                    onClose={() => setSelectedTransaction(null)}
                    title="Dettagli Transazione"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                            <p className="text-gray-900 font-semibold">{selectedTransaction.organizationName}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ID Transazione</label>
                            <p className="text-gray-600 text-sm font-mono">{selectedTransaction.id}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Importo</label>
                                <p className="text-gray-900 font-semibold">€{selectedTransaction.amount.toFixed(2)}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Stato</label>
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[selectedTransaction.status]}`}>
                                    {selectedTransaction.status}
                                </span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                            <p className="text-gray-900">{new Date(selectedTransaction.date).toLocaleString('it-IT')}</p>
                        </div>
                        <div className="pt-4 border-t">
                            <p className="text-xs text-gray-500">
                                💡 Per ulteriori azioni, utilizzare il pannello di gestione pagamenti principale.
                            </p>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Upgrade/Plans Modal */}
            <Modal
                isOpen={isUpgradeModalOpen}
                onClose={() => setUpgradeModalOpen(false)}
                title="Gestione Piani e Abbonamenti"
            >
                <div className="space-y-6">
                    <p className="text-gray-600 text-sm">
                        Seleziona un piano per visualizzare le opzioni di upgrade/downgrade per i clienti.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {plans.map(plan => (
                            <div
                                key={plan.id}
                                className="border border-gray-200 rounded-lg p-4 hover:border-primary hover:shadow-md transition-all"
                            >
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{plan.name}</h3>
                                <p className="text-3xl font-bold text-primary mb-4">
                                    €{plan.price}
                                    <span className="text-sm text-gray-500">/mese</span>
                                </p>
                                <ul className="space-y-2 mb-4">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="text-sm text-gray-600 flex items-start">
                                            <span className="text-green-500 mr-2">✓</span>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    onClick={() => handleUpgradePlan(plan.id)}
                                    className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700 text-sm"
                                >
                                    Seleziona
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="pt-4 border-t">
                        <p className="text-xs text-gray-500">
                            💡 La gestione completa dei piani include upgrade, downgrade, e modifica dei termini di billing.
                        </p>
                    </div>
                </div>
            </Modal>
        </div>
    );
};