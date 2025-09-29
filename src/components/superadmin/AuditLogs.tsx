import React, { useState, useMemo } from 'react';
import { useSuperAdminData, AuditLog } from '../../hooks/useSuperAdminData';
import { useDebounce } from '../../hooks/useDebounce';
import { SearchIcon, SortIcon } from '../ui/icons';

type SortKey = keyof AuditLog | 'timestamp';

export const AuditLogs: React.FC = () => {
    const { auditLogs, loading } = useSuperAdminData();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>({ key: 'timestamp', direction: 'descending' });

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const sortedAndFilteredLogs = useMemo(() => {
        let logs = [...auditLogs];

        if (debouncedSearchTerm) {
            logs = logs.filter(log =>
                log.adminEmail.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                log.action.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                (log.targetId && log.targetId.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
            );
        }

        if (sortConfig !== null) {
            logs.sort((a, b) => {
                const aValue = a[sortConfig.key as keyof AuditLog] ?? '';
                const bValue = b[sortConfig.key as keyof AuditLog] ?? '';

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return logs;
    }, [auditLogs, debouncedSearchTerm, sortConfig]);

    const requestSort = (key: SortKey) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const renderSortArrow = (key: SortKey) => {
        if (!sortConfig || sortConfig.key !== key) return <SortIcon className="w-4 h-4 text-gray-400" />;
        return sortConfig.direction === 'ascending' ? '▲' : '▼';
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">Audit Logs</h1>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Cerca per email, azione o ID target..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-card dark:bg-dark-card rounded-lg py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 border"
              />
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>

            <div className="bg-card dark:bg-dark-card shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                             <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                <button onClick={() => requestSort('timestamp')} className="flex items-center space-x-1">
                                    <span>Timestamp</span>
                                    <span>{renderSortArrow('timestamp')}</span>
                                </button>
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                 <button onClick={() => requestSort('adminEmail')} className="flex items-center space-x-1">
                                    <span>Admin</span>
                                    <span>{renderSortArrow('adminEmail')}</span>
                                </button>
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                 <button onClick={() => requestSort('action')} className="flex items-center space-x-1">
                                    <span>Azione</span>
                                    <span>{renderSortArrow('action')}</span>
                                </button>
                            </th>
                             <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Target</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {loading ? (
                            <tr><td colSpan={4} className="text-center py-8">Caricamento log...</td></tr>
                        ) : sortedAndFilteredLogs.map(log => (
                            <tr key={log.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary dark:text-dark-text-secondary">{new Date(log.timestamp).toLocaleString('it-IT')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary dark:text-dark-text-primary">{log.adminEmail}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary dark:text-dark-text-secondary">{log.action}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary dark:text-dark-text-secondary font-mono text-xs">{log.targetId}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 { !loading && sortedAndFilteredLogs.length === 0 && <p className="text-center text-gray-500 py-8">Nessun log trovato.</p> }
            </div>
        </div>
    );
};