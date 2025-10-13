'use client';

import { X } from 'lucide-react';
import { FilterState } from './ContactSearch';

interface ContactFiltersProps {
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
}

export default function ContactFilters({
    filters,
    onFiltersChange
}: ContactFiltersProps) {

    const toggleFilter = (key: keyof FilterState) => {
        onFiltersChange({
            ...filters,
            [key]: !filters[key]
        });
    };

    const clearAllFilters = () => {
        onFiltersChange({
            hasEmail: false,
            hasPhone: false,
            hasCompany: false,
            recent: false,
        });
    };

    const hasActiveFilters = Object.values(filters).some(Boolean);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Filtri Avanzati</h3>
                {hasActiveFilters && (
                    <button 
                        onClick={clearAllFilters} 
                        className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        Cancella Tutti
                    </button>
                )}
            </div>

            {/* Quick Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <FilterButton
                    active={filters.hasEmail}
                    onClick={() => toggleFilter('hasEmail')}
                    label="Ha Email"
                />
                <FilterButton
                    active={filters.hasPhone}
                    onClick={() => toggleFilter('hasPhone')}
                    label="Ha Telefono"
                />
                <FilterButton
                    active={filters.hasCompany}
                    onClick={() => toggleFilter('hasCompany')}
                    label="Ha Azienda"
                />
                <FilterButton
                    active={filters.recent}
                    onClick={() => toggleFilter('recent')}
                    label="Recenti (7gg)"
                />
            </div>

            {/* Active Filter Badges */}
            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2">
                    {filters.hasEmail && (
                        <FilterBadge
                            label="Ha Email"
                            onRemove={() => toggleFilter('hasEmail')}
                        />
                    )}
                    {filters.hasPhone && (
                        <FilterBadge
                            label="Ha Telefono"
                            onRemove={() => toggleFilter('hasPhone')}
                        />
                    )}
                    {filters.hasCompany && (
                        <FilterBadge
                            label="Ha Azienda"
                            onRemove={() => toggleFilter('hasCompany')}
                        />
                    )}
                    {filters.recent && (
                        <FilterBadge
                            label="Recenti"
                            onRemove={() => toggleFilter('recent')}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

function FilterButton({ 
    active, 
    onClick, 
    label 
}: {
    active: boolean;
    onClick: () => void;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                active 
                    ? 'bg-blue-50 border-blue-500 text-blue-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
        >
            {label}
        </button>
    );
}

function FilterBadge({ 
    label, 
    onRemove 
}: {
    label: string;
    onRemove: () => void;
}) {
    return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            {label}
            <button 
                onClick={onRemove} 
                className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
            >
                <X className="w-3 h-3" />
            </button>
        </span>
    );
}