import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { AlertCircle, BarChart3, Download, FileText, Filter } from 'lucide-react';
import Papa from 'papaparse';
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

interface ReportFilters {
  startDate: string;
  endDate: string;
  status?: string;
  commissionType?: string;
}

interface CommissionData {
  id: string;
  policy: {
    policy_number: string;
  };
  contact: {
    name: string;
  };
  commission_type: string;
  commission_amount: number;
  status: string;
  calculation_date: string;
}

// Type for raw data from Supabase query (using unknown for debugging)
interface RawCommissionData {
  id: string;
  policy_id: string;
  contact_id: string;
  commission_type: string;
  commission_amount: number;
  status: string;
  calculation_date: string;
  insurance_policies: unknown;
  contacts: unknown;
}

const CommissionReports: React.FC = () => {
  const { session, organizationId } = useAuth();
  
  // Filters State
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // First day of current month
    endDate: new Date().toISOString().split('T')[0], // Today
    status: '',
    commissionType: ''
  });

  // Data State
  const [commissions, setCommissions] = useState<CommissionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryStats, setSummaryStats] = useState({
    totalCommissions: 0,
    totalAmount: 0,
    averageAmount: 0
  });

  // Commission Types
  const commissionTypes = [
    { value: 'auto', label: 'Auto / RCA' },
    { value: 'vita', label: 'Assicurazione Vita' },
    { value: 'casa', label: 'Assicurazione Casa' },
    { value: 'infortuni', label: 'Infortuni' },
    { value: 'malattia', label: 'Malattia' },
    { value: 'viaggio', label: 'Assicurazione Viaggio' },
    { value: 'responsabilita', label: 'Responsabilità Civile' },
    { value: 'altro', label: 'Altro' }
  ];

  // Status options
  const statusOptions = [
    { value: 'calculated', label: 'Calcolata' },
    { value: 'paid', label: 'Pagata' },
    { value: 'pending', label: 'In Attesa' },
    { value: 'cancelled', label: 'Annullata' }
  ];

  // Fetch filtered data
  const fetchReportData = useCallback(async () => {
    if (!session?.user || !organizationId) return;

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 [CommissionReports] Fetching data with filters:', filters);

      let query = supabase
        .from('insurance_commissions')
        .select(`
          id,
          policy_id,
          contact_id,
          commission_type,
          commission_amount,
          status,
          calculation_date,
          insurance_policies(policy_number),
          contacts(name)
        `)
        .eq('organization_id', organizationId)
        .gte('calculation_date', filters.startDate)
        .lte('calculation_date', filters.endDate)
        .order('calculation_date', { ascending: true });

      // Apply optional filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.commissionType) {
        query = query.eq('commission_type', filters.commissionType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ [CommissionReports] Supabase query error:', error);
        throw error;
      }
      
      console.log('🔍 [CommissionReports] Raw data from Supabase:', data);
      console.log('🔍 [CommissionReports] Query used:', query);

      const rawData = data || [];
      console.log('🔍 [CommissionReports] rawData length:', rawData.length);
      
      // Transform raw data to match CommissionData interface
      const commissionsData: CommissionData[] = rawData.map((item: RawCommissionData, index: number) => {
        console.log(`🔍 [CommissionReports] Processing item ${index}:`, item);
        console.log(`🔍 [CommissionReports] Item ${index} - insurance_policies:`, item.insurance_policies);
        console.log(`🔍 [CommissionReports] Item ${index} - contacts:`, item.contacts);
        
        // Extract policy number from joined insurance_policies
        const policyNumber = (item.insurance_policies as { policy_number?: string })?.policy_number || 'N/A';
        
        // Extract contact name from joined contacts
        const contactName = (item.contacts as { name?: string })?.name || 'N/A';

        console.log(`🔍 [CommissionReports] Item ${index} - Extracted policyNumber:`, policyNumber);
        console.log(`🔍 [CommissionReports] Item ${index} - Extracted contactName:`, contactName);

        return {
          id: item.id,
          policy: {
            policy_number: policyNumber
          },
          contact: {
            name: contactName
          },
          commission_type: item.commission_type,
          commission_amount: item.commission_amount,
          status: item.status,
          calculation_date: item.calculation_date
        };
      });
      
      setCommissions(commissionsData);

      // Calculate summary statistics
      const totalCommissions = commissionsData.length;
      const totalAmount = commissionsData.reduce((sum: number, comm: CommissionData) => sum + comm.commission_amount, 0);
      const averageAmount = totalCommissions > 0 ? totalAmount / totalCommissions : 0;

      setSummaryStats({
        totalCommissions,
        totalAmount,
        averageAmount
      });

      console.log('✅ [CommissionReports] Data fetched successfully:', {
        count: totalCommissions,
        total: totalAmount
      });

    } catch (error) {
      console.error('❌ [CommissionReports] Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  }, [session?.user, organizationId, filters]);

  // Effect to fetch data when filters change
  useEffect(() => {
    fetchReportData();
  }, [filters, session?.user, organizationId, fetchReportData]);

  // Handle filter changes
  const handleFilterChange = (field: keyof ReportFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value || undefined
    }));
  };

  // Generate PDF Report
  const generatePdfReport = () => {
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(16);
      doc.text('Report Provvigioni', 14, 16);
      
      // Subtitle with date range
      doc.setFontSize(12);
      doc.text(`Periodo: ${new Date(filters.startDate).toLocaleDateString('it-IT')} - ${new Date(filters.endDate).toLocaleDateString('it-IT')}`, 14, 24);
      
      // Summary stats
      doc.setFontSize(10);
      doc.text(`Totale Commissioni: ${summaryStats.totalCommissions}`, 14, 32);
      doc.text(`Importo Totale: €${summaryStats.totalAmount.toFixed(2)}`, 14, 38);
      doc.text(`Importo Medio: €${summaryStats.averageAmount.toFixed(2)}`, 14, 44);

      // Table data
      const tableData = commissions.map(comm => [
        comm.policy?.policy_number || 'N/A',
        comm.contact?.name || 'N/A',
        commissionTypes.find(t => t.value === comm.commission_type)?.label || comm.commission_type,
        `€${comm.commission_amount.toFixed(2)}`,
        statusOptions.find(s => s.value === comm.status)?.label || comm.status,
        new Date(comm.calculation_date).toLocaleDateString('it-IT')
      ]);

      // Generate table
      // @ts-ignore - jspdf-autotable doesn't have proper TypeScript types
      doc.autoTable({
        head: [['Polizza', 'Cliente', 'Tipo', 'Importo (€)', 'Stato', 'Data']],
        body: tableData,
        startY: 50,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [59, 130, 246] } // Blue color
      });

      // Save PDF
      const filename = `report_provvigioni_${filters.startDate}_${filters.endDate}.pdf`;
      doc.save(filename);

      console.log('✅ [CommissionReports] PDF generated successfully:', filename);
    } catch (error) {
      console.error('❌ [CommissionReports] Error generating PDF:', error);
      setError('Errore nella generazione del PDF');
    }
  };

  // Generate CSV Report
  const generateCsvReport = () => {
    try {
      const csvData = commissions.map(comm => ({
        Polizza: comm.policy?.policy_number || 'N/A',
        Cliente: comm.contact?.name || 'N/A',
        Tipo: commissionTypes.find(t => t.value === comm.commission_type)?.label || comm.commission_type,
        Importo: comm.commission_amount,
        Stato: statusOptions.find(s => s.value === comm.status)?.label || comm.status,
        Data: comm.calculation_date
      }));

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const filename = `report_provvigioni_${filters.startDate}_${filters.endDate}.csv`;
      
      saveAs(blob, filename);

      console.log('✅ [CommissionReports] CSV generated successfully:', filename);
    } catch (error) {
      console.error('❌ [CommissionReports] Error generating CSV:', error);
      setError('Errore nella generazione del CSV');
    }
  };

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Accesso richiesto per visualizzare i report</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <BarChart3 className="h-8 w-8 mr-3" />
          Report Provvigioni
        </h1>
        <p className="mt-2 text-gray-600">
          Genera report PDF e CSV filtrati per le commissioni assicurative
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Errore</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Filtri Report
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Inizio
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Fine
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stato (Opzionale)
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">Tutti gli stati</option>
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Commission Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo Commissione (Opzionale)
            </label>
            <select
              value={filters.commissionType || ''}
              onChange={(e) => handleFilterChange('commissionType', e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">Tutti i tipi</option>
              {commissionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Totale Commissioni</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.totalCommissions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Download className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Importo Totale</p>
              <p className="text-2xl font-bold text-gray-900">
                €{summaryStats.totalAmount.toLocaleString('it-IT', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2 
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Importo Medio</p>
              <p className="text-2xl font-bold text-gray-900">
                €{summaryStats.averageAmount.toLocaleString('it-IT', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2 
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Export Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Esporta Report</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={generatePdfReport}
            disabled={loading || commissions.length === 0}
            className="flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="h-4 w-4 mr-2" />
            Esporta PDF
          </button>

          <button
            onClick={generateCsvReport}
            disabled={loading || commissions.length === 0}
            className="flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4 mr-2" />
            Esporta CSV
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Risultati ({commissions.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Caricamento dati...</p>
          </div>
        ) : commissions.length === 0 ? (
          <div className="p-6 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nessuna commissione trovata per i filtri selezionati</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Polizza
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
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
                    Data
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {commissions.map((commission) => (
                  <tr key={commission.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {commission.policy?.policy_number || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {commission.contact?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {commissionTypes.find(t => t.value === commission.commission_type)?.label || commission.commission_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      €{commission.commission_amount.toLocaleString('it-IT', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2 
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        commission.status === 'paid' ? 'bg-green-100 text-green-800' :
                        commission.status === 'calculated' ? 'bg-blue-100 text-blue-800' :
                        commission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {statusOptions.find(s => s.value === commission.status)?.label || commission.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(commission.calculation_date).toLocaleDateString('it-IT')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommissionReports;