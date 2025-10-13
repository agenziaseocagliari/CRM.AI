'use client';

import { Filter, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import ContactFilters from './ContactFilters';

interface ContactSearchProps {
    onSearchChange: (searchTerm: string) => void;
    onFiltersChange: (filters: FilterState) => void;
    initialSearch?: string;
    initialFilters?: FilterState;
}

export interface FilterState {
    hasEmail: boolean;
    hasPhone: boolean;
    hasCompany: boolean;
    recent: boolean;
}

const initialFilterState: FilterState = {
    hasEmail: false,
    hasPhone: false,
    hasCompany: false,
    recent: false,
};

export default function ContactSearch({
    onSearchChange,
    onFiltersChange,
    initialSearch = '',
    initialFilters = initialFilterState
}: ContactSearchProps) {
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<FilterState>(initialFilters);

    const debouncedSearch = useDebounce(searchTerm, 300);

    // Update URL params when search or filters change
    useEffect(() => {
        const urlParams = new URLSearchParams();
        if (debouncedSearch) urlParams.set('q', debouncedSearch);
        if (filters.hasEmail) urlParams.set('hasEmail', 'true');
        if (filters.hasPhone) urlParams.set('hasPhone', 'true');
        if (filters.hasCompany) urlParams.set('hasCompany', 'true');
        if (filters.recent) urlParams.set('recent', 'true');

        const newURL = urlParams.toString()
            ? `${window.location.pathname}?${urlParams.toString()}`
            : window.location.pathname;

        window.history.replaceState({}, '', newURL);
    }, [debouncedSearch, filters]);

    // Notify parent of search changes
    useEffect(() => {
        onSearchChange(debouncedSearch);
    }, [debouncedSearch, onSearchChange]);

    // Notify parent of filter changes
    useEffect(() => {
        onFiltersChange(filters);
    }, [filters, onFiltersChange]);

    const handleClear = () => {
        setSearchTerm('');
        window.history.replaceState({}, '', window.location.pathname);
    };

    const hasActiveFilters = Object.values(filters).some(Boolean);

    return (
        <div className="mb-6 space-y-4">
            {/* Search Bar */}
            <div className="flex gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Cerca contatti per nome, email o azienda..."
                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    {searchTerm && (
                        <button
                            onClick={handleClear}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${showFilters || hasActiveFilters
                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                >
                    <Filter className="w-5 h-5" />
                    Filtri
                    {hasActiveFilters && (
                        <span className="ml-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                            {Object.values(filters).filter(Boolean).length}
                        </span>
                    )}
                </button>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm animate-in slide-in-from-top-2 duration-200">
                    <ContactFilters
                        filters={filters}
                        onFiltersChange={setFilters}
                    />
                </div>
            )}
        </div>
    );
}