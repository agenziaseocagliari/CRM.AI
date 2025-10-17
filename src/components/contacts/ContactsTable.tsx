'use client';

import {
    Calendar,
    ChevronDown,
    ChevronUp,
    Edit,
    Eye,
    Mail,
    MoreVertical,
    Phone,
    Plus,
    Trash2,
    TrendingUp,
    Upload
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Contact } from '../../types';
import { LeadScoreBadge } from '../ui/LeadScoreBadge';
import BulkActionsBar from './BulkActionsBar';
import { FilterState } from './ContactSearch';
import CSVUploadButton from './CSVUploadButton';
import ExportButton from './ExportButton';

interface ContactsTableProps {
    contacts: Contact[];
    onEditContact: (contact: Contact) => void;
    onDeleteContact: (contact: Contact) => void;
    onEmailContact: (contact: Contact) => void;
    _onWhatsAppContact: (contact: Contact) => void;
    onCreateEvent: (contact: Contact) => void;
    _onViewEvents: (contact: Contact) => void;
    onViewContact: (contact: Contact) => void;
    onCreateDeal: (contact: Contact) => void;
    onAddContact: () => void;
    onUploadSuccess: () => void;
    onBulkOperationComplete?: () => void;
    currentFilters?: FilterState & { searchQuery?: string };
}

type SortField = 'name' | 'email' | 'phone' | 'company' | 'created_at' | 'lead_score';
type SortOrder = 'asc' | 'desc';

export default function ContactsTable({
    contacts,
    onEditContact,
    onDeleteContact,
    onEmailContact,
    _onWhatsAppContact,
    onCreateEvent,
    _onViewEvents,
    onViewContact,
    onCreateDeal,
    onAddContact,
    onUploadSuccess,
    onBulkOperationComplete,
    currentFilters
}: ContactsTableProps) {
    // Table state
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showActions, setShowActions] = useState<string | null>(null);
    const [sortField, setSortField] = useState<SortField>('created_at');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    // Sorting logic
    const sortedContacts = useMemo(() => {
        const sorted = [...contacts].sort((a, b) => {
            let aValue: string | number | Date | null | undefined = a[sortField];
            let bValue: string | number | Date | null | undefined = b[sortField];

            // Handle different data types
            if (sortField === 'created_at') {
                aValue = new Date(aValue || 0);
                bValue = new Date(bValue || 0);
            } else if (sortField === 'lead_score') {
                aValue = aValue || 0;
                bValue = bValue || 0;
            } else {
                aValue = (aValue || '').toString().toLowerCase();
                bValue = (bValue || '').toString().toLowerCase();
            }

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [contacts, sortField, sortOrder]);

    // Pagination logic
    const totalPages = Math.ceil(sortedContacts.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedContacts = sortedContacts.slice(startIndex, startIndex + pageSize);

    // Handlers
    const handleSort = useCallback((field: SortField) => {
        if (sortField === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
        setCurrentPage(1); // Reset to first page when sorting
    }, [sortField]);

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
        setSelectedIds([]); // Clear selections when changing pages
    }, []);

    const toggleSelection = useCallback((id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    }, []);

    const toggleSelectAll = useCallback(() => {
        const currentPageIds = paginatedContacts.map(c => c.id);
        const allSelected = currentPageIds.every(id => selectedIds.includes(id));

        if (allSelected) {
            // Deselect all on current page
            setSelectedIds(prev => prev.filter(id => !currentPageIds.includes(id)));
        } else {
            // Select all on current page
            setSelectedIds(prev => [...new Set([...prev, ...currentPageIds])]);
        }
    }, [paginatedContacts, selectedIds]);

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ChevronUp className="w-4 h-4 text-gray-400" />;
        return sortOrder === 'asc'
            ? <ChevronUp className="w-4 h-4 text-blue-600" />
            : <ChevronDown className="w-4 h-4 text-blue-600" />;
    };

    const currentPageIds = paginatedContacts.map(c => c.id);
    const isAllSelected = currentPageIds.length > 0 && currentPageIds.every(id => selectedIds.includes(id));
    const isPartiallySelected = currentPageIds.some(id => selectedIds.includes(id)) && !isAllSelected;

    // Get selected contacts for bulk operations
    const selectedContacts = useMemo(() => {
        return contacts.filter(contact => selectedIds.includes(contact.id));
    }, [contacts, selectedIds]);

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Contatti</h1>
                    <p className="text-gray-600 mt-1">
                        {sortedContacts.length} contatti totali
                        {selectedIds.length > 0 && ` • ${selectedIds.length} selezionati`}
                    </p>
                </div>

                <div className="flex gap-3">
                    <ExportButton
                        selectedIds={selectedIds}
                        filters={currentFilters}
                        variant="header"
                        contactCount={sortedContacts.length}
                    />
                    <button
                        onClick={onAddContact}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Nuovo Contatto
                    </button>
                    <CSVUploadButton onUploadSuccess={onUploadSuccess} />
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
                <BulkActionsBar
                    selectedCount={selectedIds.length}
                    selectedContacts={selectedContacts}
                    onClearSelection={() => setSelectedIds([])}
                    onBulkComplete={() => {
                        setSelectedIds([]);
                        onBulkOperationComplete?.();
                    }}
                />
            )}

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {/* Page Size Selector */}
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                        Mostrando {startIndex + 1}-{Math.min(startIndex + pageSize, sortedContacts.length)} di {sortedContacts.length}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">Elementi per pagina:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="w-12 px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        ref={input => {
                                            if (input) input.indeterminate = isPartiallySelected;
                                        }}
                                        onChange={toggleSelectAll}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <button
                                        onClick={() => handleSort('name')}
                                        className="flex items-center gap-2 font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                                    >
                                        Nome
                                        <SortIcon field="name" />
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <button
                                        onClick={() => handleSort('email')}
                                        className="flex items-center gap-2 font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                                    >
                                        Email
                                        <SortIcon field="email" />
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <button
                                        onClick={() => handleSort('phone')}
                                        className="flex items-center gap-2 font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                                    >
                                        Telefono
                                        <SortIcon field="phone" />
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <button
                                        onClick={() => handleSort('company')}
                                        className="flex items-center gap-2 font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                                    >
                                        Azienda
                                        <SortIcon field="company" />
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <button
                                        onClick={() => handleSort('lead_score')}
                                        className="flex items-center gap-2 font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                                    >
                                        Lead Score
                                        <SortIcon field="lead_score" />
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <button
                                        onClick={() => handleSort('created_at')}
                                        className="flex items-center gap-2 font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                                    >
                                        Creato
                                        <SortIcon field="created_at" />
                                    </button>
                                </th>
                                <th className="w-20 px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {paginatedContacts.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center">
                                        <div className="text-gray-400 mb-4">
                                            <Upload className="w-12 h-12 mx-auto mb-2" />
                                        </div>
                                        <p className="text-gray-600 font-medium">Nessun contatto trovato</p>
                                        <p className="text-gray-500 text-sm mt-1">
                                            Inizia importando contatti da CSV o creane uno nuovo
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedContacts.map((contact) => (
                                    <tr
                                        key={contact.id}
                                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={(e) => {
                                            if ((e.target as HTMLElement).closest('input, button, [role="button"]')) return;
                                            onViewContact(contact);
                                        }}
                                    >
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(contact.id)}
                                                onChange={() => toggleSelection(contact.id)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                                                {contact.name}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                {contact.email ? (
                                                    <>
                                                        <Mail className="w-4 h-4 text-gray-400" />
                                                        <span className="truncate max-w-48">{contact.email}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                {contact.phone ? (
                                                    <>
                                                        <Phone className="w-4 h-4 text-gray-400" />
                                                        {contact.phone}
                                                    </>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            <span className="truncate max-w-32 block">{contact.company || '-'}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <LeadScoreBadge
                                                score={contact.lead_score}
                                                category={contact.lead_category}
                                                reasoning={contact.lead_score_reasoning}
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 text-sm">
                                            {contact.created_at ? new Date(contact.created_at).toLocaleDateString('it-IT') : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="relative inline-block">
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setShowActions(showActions === contact.id ? null : contact.id);
                                                    }}
                                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                    type="button"
                                                >
                                                    <MoreVertical className="w-5 h-5 text-gray-600" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                        <div className="text-sm text-gray-700">
                            Pagina {currentPage} di {totalPages}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Precedente
                            </button>

                            <div className="flex gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                                    if (page > totalPages) return null;

                                    return (
                                        <button
                                            key={page}
                                            onClick={() => handlePageChange(page)}
                                            className={`px-3 py-1 border rounded transition-colors ${currentPage === page
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'border-gray-300 hover:bg-gray-100'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Successiva
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Portal-based dropdown menu */}
            {showActions && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowActions(null);
                        }}
                    />

                    {/* Dropdown Menu */}
                    {(() => {
                        const contact = contacts.find(c => c.id === showActions);
                        if (!contact) return null;

                        return (
                            <div className="fixed z-50 w-56 bg-white rounded-lg shadow-xl border border-gray-200 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                <div className="py-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowActions(null);
                                            onViewContact(contact);
                                        }}
                                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                    >
                                        <Eye className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm font-medium">Visualizza</span>
                                    </button>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowActions(null);
                                            onEditContact(contact);
                                        }}
                                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                    >
                                        <Edit className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm font-medium">Modifica</span>
                                    </button>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowActions(null);
                                            onEmailContact(contact);
                                        }}
                                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                    >
                                        <Mail className="w-4 h-4 text-green-600" />
                                        <span className="text-sm font-medium">Invia Email</span>
                                    </button>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowActions(null);
                                            onCreateDeal(contact);
                                        }}
                                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                    >
                                        <TrendingUp className="w-4 h-4 text-purple-600" />
                                        <span className="text-sm font-medium">Crea Opportunità</span>
                                    </button>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowActions(null);
                                            onCreateEvent(contact);
                                        }}
                                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                    >
                                        <Calendar className="w-4 h-4 text-indigo-600" />
                                        <span className="text-sm font-medium">Crea Evento</span>
                                    </button>

                                    <div className="border-t border-gray-100 my-1" />

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowActions(null);
                                            if (confirm(`Eliminare il contatto "${contact.name}"?`)) {
                                                onDeleteContact(contact);
                                            }
                                        }}
                                        className="w-full text-left px-4 py-2.5 hover:bg-red-50 flex items-center gap-3 transition-colors text-red-600"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span className="text-sm font-medium">Elimina</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })()}
                </>
            )}
        </div>
    );
}