import React, { useState } from 'react';
import { Modal } from './Modal';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isConfirming: boolean;
  requiresReason?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Conferma',
  cancelText = 'Annulla',
  isConfirming,
  requiresReason = false,
}) => {
  const [reason, setReason] = useState('');
  const isConfirmDisabled = isConfirming || (requiresReason && !reason.trim());

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="text-text-secondary dark:text-dark-text-secondary">{message}</p>
        
        {requiresReason && (
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-text-primary dark:text-dark-text-primary">
              Motivo (obbligatorio)
            </label>
            <input
              type="text"
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-card dark:bg-dark-card"
              placeholder="Es: Violazione dei termini di servizio"
            />
          </div>
        )}
      </div>
      <div className="flex justify-end pt-6 border-t mt-6 dark:border-gray-600 space-x-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isConfirming}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          onClick={() => onConfirm(reason)}
          disabled={isConfirmDisabled}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-red-400 dark:disabled:bg-red-800"
        >
          {isConfirming ? 'Conferma...' : confirmText}
        </button>
      </div>
    </Modal>
  );
};