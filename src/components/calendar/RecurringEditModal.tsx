'use client';

import { Calendar, Clock } from 'lucide-react';

interface RecurringEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onChoice: (choice: 'this' | 'series') => void;
    eventTitle?: string;
    action: 'edit' | 'delete';
}

export default function RecurringEditModal({
    isOpen,
    onClose,
    onChoice,
    eventTitle = 'Evento',
    action = 'edit'
}: RecurringEditModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">
                            {action === 'edit' ? 'Modifica' : 'Elimina'} Evento Ricorrente
                        </h3>
                        <p className="text-sm text-gray-600">{eventTitle}</p>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Clock className="w-4 h-4" />
                        <span>🔄 Questo evento fa parte di una serie ricorrente</span>
                    </div>
                    <p className="text-gray-700">
                        Vuoi {action === 'edit' ? 'modificare' : 'eliminare'} solo questa occorrenza o tutta la serie?
                    </p>
                </div>

                <div className="space-y-3 mb-6">
                    <button
                        onClick={() => onChoice('this')}
                        className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200">
                                <Calendar className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold text-gray-900">Solo questo evento</div>
                                <div className="text-sm text-gray-600">
                                    {action === 'edit' ? 'Modifica' : 'Elimina'} solo questa occorrenza specifica
                                </div>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => onChoice('series')}
                        className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 text-left transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200">
                                <Clock className="w-4 h-4 text-orange-600" />
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold text-gray-900">Tutta la serie</div>
                                <div className="text-sm text-gray-600">
                                    {action === 'edit' ? 'Modifica' : 'Elimina'} tutti gli eventi futuri di questa serie
                                </div>
                            </div>
                        </div>
                    </button>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 px-4 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Annulla
                    </button>
                </div>
            </div>
        </div>
    );
}