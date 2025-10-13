'use client';

import { AlertTriangle, RotateCcw, Tag, Trash2, UserPlus, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { BulkOperationsService } from '../../services/bulkOperations';
import { Contact } from '../../types';
import ExportButton from './ExportButton';

interface BulkActionsBarProps {
    selectedCount: number;
    selectedContacts: Contact[];
    onClearSelection: () => void;
    onBulkComplete: () => void;
}

export default function BulkActionsBar({
    selectedCount,
    selectedContacts,
    onClearSelection,
    onBulkComplete
}: BulkActionsBarProps) {
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmAction, setConfirmAction] = useState<string | null>(null);
    const [confirmTitle, setConfirmTitle] = useState('');
    const [confirmMessage, setConfirmMessage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastDeletedIds, setLastDeletedIds] = useState<number[]>([]);

    const handleAction = async (action: string, needsConfirm: boolean = false) => {
        if (needsConfirm) {
            setConfirmAction(action);

            switch (action) {
                case 'delete':
                    setConfirmTitle('Conferma Eliminazione');
                    setConfirmMessage(
                        `Sei sicuro di voler eliminare ${selectedCount} ${selectedCount === 1 ? 'contatto' : 'contatti'
                        }? Questa azione può essere annullata.`
                    );
                    break;
                case 'hard_delete':
                    setConfirmTitle('Eliminazione Permanente');
                    setConfirmMessage(
                        `ATTENZIONE: Stai per eliminare PERMANENTEMENTE ${selectedCount} ${selectedCount === 1 ? 'contatto' : 'contatti'
                        }. Questa azione NON può essere annullata!`
                    );
                    break;
                default:
                    return;
            }

            setShowConfirm(true);
            return;
        }

        // Execute action immediately
        await executeAction(action);
    };

    const executeAction = async (action: string) => {
        setIsProcessing(true);
        const toastId = toast.loading('Operazione in corso...');

        try {
            const contactIds = selectedContacts.map(c => c.id);
            let result;

            switch (action) {
                case 'delete':
                    result = await BulkOperationsService.softDeleteContacts(contactIds);
                    if (result.success) {
                        setLastDeletedIds(contactIds);
                        toast.success(
                            `${result.affected} ${result.affected === 1 ? 'contatto eliminato' : 'contatti eliminati'}`,
                            { id: toastId }
                        );

                        // Show undo toast
                        setTimeout(() => {
                            toast((t) => (
                                <div className="flex items-center gap-2">
                                    <span>Contatti eliminati</span>
                                    <button
                                        onClick={() => {
                                            handleUndo();
                                            toast.dismiss(t.id);
                                        }}
                                        className="px-2 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                    >
                                        Annulla
                                    </button>
                                </div>
                            ), { duration: 10000 });
                        }, 500);
                    } else {
                        toast.error(result.error || 'Errore durante l\'eliminazione', { id: toastId });
                    }
                    break;

                case 'hard_delete':
                    result = await BulkOperationsService.hardDeleteContacts(contactIds);
                    if (result.success) {
                        toast.success(
                            `${result.affected} ${result.affected === 1 ? 'contatto eliminato permanentemente' : 'contatti eliminati permanentemente'}`,
                            { id: toastId }
                        );
                    } else {
                        toast.error(result.error || 'Errore durante l\'eliminazione permanente', { id: toastId });
                    }
                    break;

                case 'export':
                    // Export handled by ExportButton component
                    toast.success('Funzione di esportazione spostata nel pulsante dedicato', { id: toastId });
                    break;

                case 'assign':
                    // Placeholder - would show user selection modal
                    toast.success('Funzione di assegnazione in arrivo', { id: toastId });
                    break;

                case 'tag':
                    // Placeholder - would show tag selection modal
                    toast.success('Funzione di tagging in arrivo', { id: toastId });
                    break;

                default:
                    toast.error('Azione non riconosciuta', { id: toastId });
                    return;
            }

            onClearSelection();
            onBulkComplete();

        } catch (error) {
            console.error('Bulk action error:', error);
            toast.error(
                error instanceof Error ? error.message : 'Errore durante l\'operazione',
                { id: toastId }
            );
        } finally {
            setIsProcessing(false);
        }
    };

    const confirmAndExecute = async () => {
        if (!confirmAction) return;

        setShowConfirm(false);
        await executeAction(confirmAction);
        setConfirmAction(null);
    };

    const handleUndo = async () => {
        if (lastDeletedIds.length === 0) return;

        const toastId = toast.loading('Ripristino in corso...');
        try {
            const result = await BulkOperationsService.restoreContacts(lastDeletedIds);
            if (result.success) {
                toast.success(
                    `${result.affected} ${result.affected === 1 ? 'contatto ripristinato' : 'contatti ripristinati'}`,
                    { id: toastId }
                );
                setLastDeletedIds([]);
                onBulkComplete();
            } else {
                toast.error(result.error || 'Errore durante il ripristino', { id: toastId });
            }
        } catch {
            toast.error('Errore durante il ripristino', { id: toastId });
        }
    };

    return (
        <>
            {/* Actions Bar */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <span className="text-blue-900 font-medium">
                        {selectedCount} {selectedCount === 1 ? 'contatto selezionato' : 'contatti selezionati'}
                    </span>

                    {!isProcessing && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleAction('delete', true)}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-red-300 text-red-700 rounded hover:bg-red-50 transition-colors"
                                title="Elimina (recuperabile)"
                            >
                                <Trash2 className="w-4 h-4" />
                                Elimina
                            </button>

                            <ExportButton
                                selectedIds={selectedContacts.map(c => c.id)}
                                variant="bulk"
                            />

                            <button
                                onClick={() => handleAction('tag')}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                                disabled
                                title="Funzione in arrivo"
                            >
                                <Tag className="w-4 h-4" />
                                Aggiungi Tag
                            </button>

                            <button
                                onClick={() => handleAction('assign')}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                                disabled
                                title="Funzione in arrivo"
                            >
                                <UserPlus className="w-4 h-4" />
                                Assegna
                            </button>

                            {/* Undo button for recent deletions */}
                            {lastDeletedIds.length > 0 && (
                                <button
                                    onClick={handleUndo}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-green-300 text-green-700 rounded hover:bg-green-50 transition-colors"
                                    title="Annulla ultima eliminazione"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Ripristina
                                </button>
                            )}
                        </div>
                    )}

                    {isProcessing && (
                        <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span className="text-blue-700">Elaborazione in corso...</span>
                        </div>
                    )}
                </div>

                <button
                    onClick={onClearSelection}
                    className="text-blue-700 hover:text-blue-900 transition-colors"
                    disabled={isProcessing}
                    title="Deseleziona tutto"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in zoom-in-90 duration-200">
                        <div className="flex items-start gap-4 mb-4">
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${confirmAction === 'hard_delete' ? 'bg-red-100' : 'bg-orange-100'
                                }`}>
                                <AlertTriangle className={`w-6 h-6 ${confirmAction === 'hard_delete' ? 'text-red-600' : 'text-orange-600'
                                    }`} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {confirmTitle}
                                </h3>
                                <p className="text-gray-600">
                                    {confirmMessage}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowConfirm(false);
                                    setConfirmAction(null);
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Annulla
                            </button>
                            <button
                                onClick={confirmAndExecute}
                                className={`px-4 py-2 rounded-lg text-white transition-colors ${confirmAction === 'hard_delete'
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-orange-600 hover:bg-orange-700'
                                    }`}
                            >
                                {confirmAction === 'hard_delete' ? 'Elimina Permanentemente' : 'Conferma'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}