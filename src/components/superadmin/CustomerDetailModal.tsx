import React from 'react';
import toast from 'react-hot-toast';

import { AdminOrganization } from '../../hooks/useSuperAdminData';
import { Modal } from '../ui/Modal';

interface CustomerDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    customer: AdminOrganization | null;
    onActionSuccess: () => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({ isOpen, onClose, customer, onActionSuccess }) => {

    const handleAction = async (action: string) => {
        const promise = new Promise(resolve => setTimeout(resolve, 1000));
        toast.promise(promise, {
            loading: `${action} in corso per ${customer?.name}...`,
            success: `Azione completata!`,
            error: `Errore durante l'azione.`,
        });
        await promise;
        onActionSuccess();
        onClose();
    };
    
    const handleDelete = () => {
        if(window.confirm(`Sei sicuro di voler eliminare definitivamente ${customer?.name}? Questa azione è irreversibile.`)) {
            handleAction("Eliminazione definitiva");
        }
    }

    if (!customer) {return null;}

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Dettaglio Cliente: ${customer.name}`}>
            <div className="space-y-4 text-text-secondary dark:text-dark-text-secondary">
                <div className="grid grid-cols-2 gap-4">
                    <div><strong>ID:</strong> {customer.id}</div>
                    <div><strong>Piano:</strong> {customer.plan}</div>
                    <div><strong>Admin:</strong> {customer.adminEmail}</div>
                    <div><strong>Membri:</strong> {customer.memberCount}</div>
                    <div><strong>Creato il:</strong> {new Date(customer.createdAt).toLocaleDateString('it-IT')}</div>
                </div>

                <div className="pt-6 border-t dark:border-gray-600">
                    <h4 className="font-semibold text-text-primary dark:text-dark-text-primary mb-3">Azioni Amministrative</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         <button onClick={() => handleAction("Upgrade a Enterprise")} className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                            Upgrade a Enterprise
                        </button>
                         <button onClick={() => handleAction("Reset password")} className="w-full bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors">
                            Invia Reset Password
                        </button>
                        <button onClick={handleDelete} className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors md:col-span-2">
                            Elimina Definitivamente
                        </button>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 dark:bg-gray-500 dark:hover:bg-gray-400 dark:text-white">
                        Chiudi
                    </button>
                </div>
            </div>
        </Modal>
    );
};
