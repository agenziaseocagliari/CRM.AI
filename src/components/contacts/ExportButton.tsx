'use client';

import { useState } from 'react';
import { Download, FileText, Users, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ExportService, ExportOptions } from '../../services/exportService';
import { FilterState } from './ContactSearch';

interface ExportButtonProps {
    selectedIds?: number[];
    filters?: FilterState & { searchQuery?: string };
    variant?: 'default' | 'bulk' | 'header';
    contactCount?: number;
}

export default function ExportButton({
    selectedIds = [],
    filters,
    variant = 'default',
    contactCount = 0
}: ExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [exportSummary, setExportSummary] = useState<any>(null);

    const handleExport = async (exportType: 'all' | 'selected' | 'filtered' = 'all') => {
        if (isExporting) return;

        setIsExporting(true);
        const toastId = toast.loading('Preparazione esportazione...');

        try {
            let exportCount = 0;
            let exportDescription = '';

            switch (exportType) {
                case 'selected':
                    if (selectedIds.length === 0) {
                        toast.error('Nessun contatto selezionato', { id: toastId });
                        return;
                    }
                    await ExportService.exportSelectedContacts(selectedIds);
                    exportCount = selectedIds.length;
                    exportDescription = 'contatti selezionati';
                    break;

                case 'filtered':
                    if (!filters) {
                        toast.error('Nessun filtro applicato', { id: toastId });
                        return;
                    }
                    await ExportService.exportFilteredContacts(filters);
                    exportCount = contactCount;
                    exportDescription = 'contatti filtrati';
                    break;

                case 'all':
                default:
                    await ExportService.exportAllContacts(filters);
                    exportCount = contactCount;
                    exportDescription = 'tutti i contatti';
                    break;
            }

            toast.success(
                `Esportati ${exportCount} ${exportDescription} con successo!`,
                { id: toastId, duration: 5000 }
            );

        } catch (error) {
            console.error('Export error:', error);
            toast.error(
                error instanceof Error ? error.message : 'Errore durante l\'esportazione',
                { id: toastId }
            );
        } finally {
            setIsExporting(false);
        }
    };

    const loadExportSummary = async () => {
        try {
            const options: ExportOptions = {};
            
            if (selectedIds.length > 0) {
                options.contactIds = selectedIds;
            }
            
            if (filters) {
                options.filters = filters;
            }

            const summary = await ExportService.getExportSummary(options);
            setExportSummary(summary);
            setShowSummary(true);
        } catch (error) {
            toast.error('Errore nel calcolare il riassunto esportazione');
        }
    };

    // Bulk variant (used in BulkActionsBar)
    if (variant === 'bulk') {
        return (
            <button
                onClick={() => handleExport('selected')}
                disabled={isExporting || selectedIds.length === 0}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-50 disabled:opacity-50 transition-colors"
                title={`Esporta ${selectedIds.length} contatti selezionati`}
            >
                <Download className="w-4 h-4" />
                {isExporting ? 'Esportazione...' : `Esporta CSV (${selectedIds.length})`}
            </button>
        );
    }

    // Header variant (used in ContactsTable header)
    if (variant === 'header') {
        return (
            <div className="relative">
                <button
                    onClick={loadExportSummary}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                    <Download className="w-4 h-4" />
                    {isExporting ? 'Esportazione...' : 'Esporta CSV'}
                </button>

                {/* Export Options Dropdown */}
                {showSummary && exportSummary && (
                    <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
                        <div className="mb-4">
                            <h3 className="font-semibold text-gray-900 mb-2">Esportazione Contatti</h3>
                            <div className="text-sm text-gray-600 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span>Totale contatti:</span>
                                    <span className="font-medium">{exportSummary.totalContacts}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Con email:</span>
                                    <span className="font-medium">{exportSummary.hasEmail}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Con telefono:</span>
                                    <span className="font-medium">{exportSummary.hasPhone}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Con azienda:</span>
                                    <span className="font-medium">{exportSummary.hasCompany}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Recenti (7gg):</span>
                                    <span className="font-medium">{exportSummary.recentContacts}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {selectedIds.length > 0 && (
                                <button
                                    onClick={() => {
                                        setShowSummary(false);
                                        handleExport('selected');
                                    }}
                                    disabled={isExporting}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 border border-blue-200 text-blue-700 rounded hover:bg-blue-100 disabled:opacity-50 transition-colors"
                                >
                                    <Users className="w-4 h-4" />
                                    Esporta Selezionati ({selectedIds.length})
                                </button>
                            )}

                            {(filters?.hasEmail || filters?.hasPhone || filters?.hasCompany || filters?.recent || filters?.searchQuery) && (
                                <button
                                    onClick={() => {
                                        setShowSummary(false);
                                        handleExport('filtered');
                                    }}
                                    disabled={isExporting}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-green-50 border border-green-200 text-green-700 rounded hover:bg-green-100 disabled:opacity-50 transition-colors"
                                >
                                    <Filter className="w-4 h-4" />
                                    Esporta Filtrati ({exportSummary.totalContacts})
                                </button>
                            )}

                            <button
                                onClick={() => {
                                    setShowSummary(false);
                                    handleExport('all');
                                }}
                                disabled={isExporting}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-gray-50 border border-gray-200 text-gray-700 rounded hover:bg-gray-100 disabled:opacity-50 transition-colors"
                            >
                                <FileText className="w-4 h-4" />
                                Esporta Tutti ({exportSummary.totalContacts})
                            </button>
                        </div>

                        <div className="flex justify-end mt-3 pt-3 border-t">
                            <button
                                onClick={() => setShowSummary(false)}
                                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                Chiudi
                            </button>
                        </div>
                    </div>
                )}

                {/* Click outside to close */}
                {showSummary && (
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowSummary(false)}
                    />
                )}
            </div>
        );
    }

    // Default variant
    return (
        <button
            onClick={() => handleExport('all')}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
            <Download className="w-4 h-4" />
            {isExporting ? 'Esportazione...' : 'Esporta CSV'}
        </button>
    );
}