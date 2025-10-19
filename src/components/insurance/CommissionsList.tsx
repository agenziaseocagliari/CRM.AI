import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
    AlertCircle,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Download,
    Edit,
    Eye,
    FileText,
    Filter,
    Loader,
    RotateCcw,
    Search
} from "lucide-react";
import Papa from 'papaparse';
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import { supabase } from "../../lib/supabaseClient";

// TypeScript Interfaces
interface Commission {
  id: string;
  policy_id?: string;
  contact_id: string;
  commission_type: string;
  commission_amount: string;
  status: string;
  calculation_date: string;
  payment_date?: string;
  contact_name: string;
  policy_number: string;
}

interface Filters {
  search: string;
  status: string;
  startDate: string;
  endDate: string;
}

const CommissionsList: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();

  // State Management
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [filteredCommissions, setFilteredCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: 'all',
    startDate: '',
    endDate: ''
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch Data from Supabase
  const fetchCommissions = React.useCallback(async () => {
    if (!session?.user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('insurance_commissions')
        .select(`
          id,
          policy_id,
          contact_id,
          commission_type,
          commission_amount,
          status,
          calculation_date,
          payment_date,
          contacts!inner(name),
          insurance_policies(policy_number)
        `)
        .order('calculation_date', { ascending: false });

      if (fetchError) throw fetchError;

      // Transform data to flatten nested objects  
      const transformedData: Commission[] = data?.map((item: {
        id: string;
        policy_id?: string;
        contact_id: string;
        commission_type: string;
        commission_amount: string;
        status: string;
        calculation_date: string;
        payment_date?: string;
        contacts: { name: string }[];
        insurance_policies: { policy_number: string }[];
      }) => ({
        id: item.id,
        policy_id: item.policy_id,
        contact_id: item.contact_id,
        commission_type: item.commission_type,
        commission_amount: item.commission_amount,
        status: item.status,
        calculation_date: item.calculation_date,
        payment_date: item.payment_date,
        contact_name: item.contacts?.[0]?.name || 'N/A',
        policy_number: item.insurance_policies?.[0]?.policy_number || 'N/A'
      })) || [];

      setCommissions(transformedData);
      setFilteredCommissions(transformedData);
    } catch (err) {
      console.error('Error fetching commissions:', err);
      setError(err instanceof Error ? err.message : 'Errore nel caricamento delle provvigioni');
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  // Apply Filters
  const applyFilters = React.useCallback(() => {
    let filtered = [...commissions];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(commission =>
        commission.commission_type.toLowerCase().includes(searchLower) ||
        commission.contact_name?.toLowerCase().includes(searchLower) ||
        commission.policy_number?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(commission => commission.status === filters.status);
    }

    // Date range filter
    if (filters.startDate) {
      filtered = filtered.filter(commission => 
        new Date(commission.calculation_date) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(commission => 
        new Date(commission.calculation_date) <= new Date(filters.endDate)
      );
    }

    setFilteredCommissions(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [commissions, filters]);

  // Effects
  useEffect(() => {
    fetchCommissions();
  }, [fetchCommissions]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Helper Functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'calculated': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'base': return 'Base';
      case 'renewal': return 'Rinnovo';
      case 'bonus': return 'Bonus';
      case 'override': return 'Override';
      default: return type;
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(parseFloat(amount) || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      startDate: '',
      endDate: ''
    });
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredCommissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCommissions = filteredCommissions.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Export Functions
  const exportToCsv = () => {
    const csvData = filteredCommissions.map(commission => ({
      'ID Commissione': commission.id,
      'Numero Polizza': commission.policy_number,
      'Cliente': commission.contact_name,
      'Tipo Commissione': commission.commission_type,
      'Importo': commission.commission_amount,
      'Status': commission.status,
      'Data Calcolo': new Date(commission.calculation_date).toLocaleDateString('it-IT'),
      'Data Pagamento': commission.payment_date ? new Date(commission.payment_date).toLocaleDateString('it-IT') : 'N/A'
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `commissioni_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPdf = () => {
    const doc = new jsPDF();
    
    // Aggiungi titolo
    doc.setFontSize(16);
    doc.text('Lista Commissioni', 14, 15);
    doc.setFontSize(10);
    doc.text(`Esportato il ${new Date().toLocaleDateString('it-IT')}`, 14, 25);

    // Prepara i dati per la tabella
    const tableData = filteredCommissions.map(commission => [
      commission.id.substring(0, 8) + '...',
      commission.policy_number,
      commission.contact_name,
      commission.commission_type,
      `€${parseFloat(commission.commission_amount).toFixed(2)}`,
      commission.status,
      new Date(commission.calculation_date).toLocaleDateString('it-IT'),
      commission.payment_date ? new Date(commission.payment_date).toLocaleDateString('it-IT') : 'N/A'
    ]);

    // Aggiungi tabella
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (doc as any).autoTable({
      head: [['ID', 'Polizza', 'Cliente', 'Tipo', 'Importo', 'Status', 'Calcolo', 'Pagamento']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    doc.save(`commissioni_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Caricamento provvigioni...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Errore</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchCommissions}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Lista Provvigioni</h1>
          <p className="text-gray-600 mt-2">
            Gestisci e monitora tutte le provvigioni assicurative
          </p>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ricerca
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cerca per tipo, cliente, polizza..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stato
                </label>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Tutti gli stati</option>
                    <option value="pending">In attesa</option>
                    <option value="calculated">Calcolato</option>
                    <option value="paid">Pagato</option>
                    <option value="cancelled">Annullato</option>
                  </select>
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Inizio
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Fine
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <button
                  onClick={resetFilters}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reset Filtri</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={exportToCsv}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={exportToPdf}
                  className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Mostrando {startIndex + 1}-{Math.min(endIndex, filteredCommissions.length)} di {filteredCommissions.length} provvigioni
          </p>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {currentCommissions.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna provvigione trovata</h3>
              <p className="text-gray-500">
                {filteredCommissions.length === 0 && commissions.length > 0
                  ? 'Prova a modificare i filtri di ricerca'
                  : 'Non ci sono provvigioni da visualizzare'
                }
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Importo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data Calcolo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data Pagamento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Polizza
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Azioni
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentCommissions.map((commission) => (
                      <tr key={commission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {getTypeLabel(commission.commission_type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          {formatCurrency(commission.commission_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(commission.status)}`}>
                            {commission.status === 'pending' && 'In attesa'}
                            {commission.status === 'calculated' && 'Calcolato'}
                            {commission.status === 'paid' && 'Pagato'}
                            {commission.status === 'cancelled' && 'Annullato'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(commission.calculation_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(commission.payment_date || '')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {commission.contact_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {commission.policy_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => navigate(`/assicurazioni/provvigioni/${commission.id}`)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              title="Visualizza dettagli"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => navigate(`/assicurazioni/provvigioni/${commission.id}/edit`)}
                              className="text-gray-600 hover:text-gray-900 transition-colors"
                              title="Modifica"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Precedente
                      </button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`relative inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md ${
                              page === currentPage
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Successivo
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="text-sm text-gray-700">
                      Pagina {currentPage} di {totalPages}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommissionsList;