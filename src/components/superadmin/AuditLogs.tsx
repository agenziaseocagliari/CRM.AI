import React, { useState, useMemo } from 'react';
import { useSuperAdminData, AuditLog } from '../../hooks/useSuperAdminData';
import { useDebounce } from '../../hooks/useDebounce';
import { SearchIcon, SortIcon } from '../ui/icons';
import toast from 'react-hot-toast';

type SortKey = keyof AuditLog | 'timestamp';

export const AuditLogs: React.FC = () => {
    const { auditLogs, loading } = useSuperAdminData();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>({ key: 'timestamp', direction: 'descending' });
    
    // Advanced filters
    const [operationTypeFilter, setOperationTypeFilter] = useState<string>('');
    const [targetTypeFilter, setTargetTypeFilter] = useState<string>('');
    const [resultFilter, setResultFilter] = useState<string>('');
    const [dateRangeStart, setDateRangeStart] = useState<string>('');
    const [dateRangeEnd, setDateRangeEnd] = useState<string>('');
    const [showFilters, setShowFilters] = useState(false);

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const sortedAndFilteredLogs = useMemo(() => {
        let logs = [...auditLogs];

        // Text search
        if (debouncedSearchTerm) {
            logs = logs.filter(log =>
                log.adminEmail.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                log.action.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                (log.targetId && log.targetId.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
            );
        }

        // Operation type filter
        if (operationTypeFilter) {
            logs = logs.filter(log => log.operationType === operationTypeFilter);
        }

        // Target type filter
        if (targetTypeFilter) {
            logs = logs.filter(log => log.targetType === targetTypeFilter);
        }

        // Result filter
        if (resultFilter) {
            logs = logs.filter(log => log.result === resultFilter);
        }

        // Date range filter
        if (dateRangeStart) {
            const startDate = new Date(dateRangeStart);
            logs = logs.filter(log => new Date(log.timestamp) >= startDate);
        }
        if (dateRangeEnd) {
            const endDate = new Date(dateRangeEnd);
            endDate.setHours(23, 59, 59, 999); // Include full day
            logs = logs.filter(log => new Date(log.timestamp) <= endDate);
        }

        // Sorting
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
    }, [auditLogs, debouncedSearchTerm, sortConfig, operationTypeFilter, targetTypeFilter, resultFilter, dateRangeStart, dateRangeEnd]);

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

    const exportToCSV = () => {
        if (sortedAndFilteredLogs.length === 0) {
            toast.error('No logs to export');
            return;
        }

        const headers = ['Timestamp', 'Admin Email', 'Action', 'Operation Type', 'Target Type', 'Target ID', 'Result', 'IP Address'];
        const csvContent = [
            headers.join(','),
            ...sortedAndFilteredLogs.map(log => [
                new Date(log.timestamp).toISOString(),
                log.adminEmail,
                `"${log.action}"`,
                log.operationType || '',
                log.targetType || '',
                log.targetId || '',
                log.result || '',
                log.ipAddress || ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`Exported ${sortedAndFilteredLogs.length} audit logs`);
    };

    const exportToJSON = () => {
        if (sortedAndFilteredLogs.length === 0) {
            toast.error('No logs to export');
            return;
        }

        const jsonContent = JSON.stringify(sortedAndFilteredLogs, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`Exported ${sortedAndFilteredLogs.length} audit logs`);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setOperationTypeFilter('');
        setTargetTypeFilter('');
        setResultFilter('');
        setDateRangeStart('');
        setDateRangeEnd('');
    };

    // Calculate statistics
    const statistics = useMemo(() => {
        const total = sortedAndFilteredLogs.length;
        const successful = sortedAndFilteredLogs.filter(l => l.result === 'SUCCESS').length;
        const failed = sortedAndFilteredLogs.filter(l => l.result === 'FAILURE').length;
        const uniqueAdmins = new Set(sortedAndFilteredLogs.map(l => l.adminEmail)).size;
        
        return { total, successful, failed, uniqueAdmins };
    }, [sortedAndFilteredLogs]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">Audit Logs</h1>
                    <p className="text-text-secondary dark:text-dark-text-secondary mt-1">
                        Comprehensive audit trail of all super admin operations
                    </p>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={exportToCSV}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        📥 Export CSV
                    </button>
                    <button
                        onClick={exportToJSON}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        📥 Export JSON
                    </button>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-dark-card p-4 rounded-lg shadow">
                    <p className="text-sm text-text-secondary dark:text-dark-text-secondary">Total Logs</p>
                    <p className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">{statistics.total}</p>
                </div>
                <div className="bg-white dark:bg-dark-card p-4 rounded-lg shadow">
                    <p className="text-sm text-text-secondary dark:text-dark-text-secondary">Successful</p>
                    <p className="text-2xl font-bold text-green-600">{statistics.successful}</p>
                </div>
                <div className="bg-white dark:bg-dark-card p-4 rounded-lg shadow">
                    <p className="text-sm text-text-secondary dark:text-dark-text-secondary">Failed</p>
                    <p className="text-2xl font-bold text-red-600">{statistics.failed}</p>
                </div>
                <div className="bg-white dark:bg-dark-card p-4 rounded-lg shadow">
                    <p className="text-sm text-text-secondary dark:text-dark-text-secondary">Unique Admins</p>
                    <p className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">{statistics.uniqueAdmins}</p>
                </div>
            </div>

            {/* Search */}
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

            {/* Advanced Filters */}
            <div className="bg-white dark:bg-dark-card p-4 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">
                        Advanced Filters
                    </h3>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="text-primary hover:text-primary-dark"
                    >
                        {showFilters ? '▲ Hide' : '▼ Show'}
                    </button>
                </div>

                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-1">
                                Operation Type
                            </label>
                            <select
                                value={operationTypeFilter}
                                onChange={(e) => setOperationTypeFilter(e.target.value)}
                                className="w-full bg-card dark:bg-dark-card rounded-lg py-2 px-3 border focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">All</option>
                                <option value="CREATE">CREATE</option>
                                <option value="UPDATE">UPDATE</option>
                                <option value="DELETE">DELETE</option>
                                <option value="READ">READ</option>
                                <option value="EXECUTE">EXECUTE</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-1">
                                Target Type
                            </label>
                            <select
                                value={targetTypeFilter}
                                onChange={(e) => setTargetTypeFilter(e.target.value)}
                                className="w-full bg-card dark:bg-dark-card rounded-lg py-2 px-3 border focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">All</option>
                                <option value="USER">USER</option>
                                <option value="ORGANIZATION">ORGANIZATION</option>
                                <option value="PAYMENT">PAYMENT</option>
                                <option value="SYSTEM">SYSTEM</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-1">
                                Result
                            </label>
                            <select
                                value={resultFilter}
                                onChange={(e) => setResultFilter(e.target.value)}
                                className="w-full bg-card dark:bg-dark-card rounded-lg py-2 px-3 border focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">All</option>
                                <option value="SUCCESS">SUCCESS</option>
                                <option value="FAILURE">FAILURE</option>
                                <option value="PARTIAL">PARTIAL</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-1">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={dateRangeStart}
                                onChange={(e) => setDateRangeStart(e.target.value)}
                                className="w-full bg-card dark:bg-dark-card rounded-lg py-2 px-3 border focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-1">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={dateRangeEnd}
                                onChange={(e) => setDateRangeEnd(e.target.value)}
                                className="w-full bg-card dark:bg-dark-card rounded-lg py-2 px-3 border focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={clearFilters}
                                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                )}
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