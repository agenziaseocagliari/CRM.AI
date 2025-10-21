/**
 * PoliciesList Component - Main list view for insurance policies
 * Features: Table view, filters, search, pagination, CRUD actions
 */

import {
    AlertTriangle,
    Building2,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Edit2,
    Eye,
    FileText,
    Filter,
    Plus,
    Search,
    Trash2
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { diagnostics } from '../../../utils/diagnostics';

import { InsurancePoliciesMeta } from '../../../components/PageMeta';
import { ROUTES } from '../../../config/routes';
import { useCrmData } from '../../../hooks/useCrmData';
import { supabase } from '../../../lib/supabaseClient';
import {
    DEFAULT_POLICY_FILTERS,
    InsurancePolicyWithContact,
    POLICY_STATUSES,
    POLICY_STATUS_COLORS,
    POLICY_STATUS_LABELS,
    POLICY_TYPES,
    POLICY_TYPE_LABELS,
    PolicyFilters,
    formatCurrency,
    formatDate,
    isPolicyExpired,
    isPolicyExpiringSoon
} from '../types/insurance';

const ITEMS_PER_PAGE = 25;

export const PoliciesList: React.FC = () => {
  const navigate = useNavigate();
  const contextData = useOutletContext<ReturnType<typeof useCrmData>>();
  const { organization } = contextData || {};
  
  // State Management
  const [policies, setPolicies] = useState<InsurancePolicyWithContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PolicyFilters>(DEFAULT_POLICY_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>('end_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Fetch policies from database
  const fetchPolicies = useCallback(async () => {
    if (!organization?.id) {
      return;
    }

    
    setLoading(true);
    try {
      const query = supabase
        .from('insurance_policies')
        .select(`
          *,
          contact:contacts!fk_insurance_policies_contact(
            id,
            name,
            email,
            phone,
            company
          )
        `)
        .eq('organization_id', organization.id);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching policies:', error);
        toast.error('Errore nel caricamento delle polizze');
        return;
      }

      setPolicies(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Errore nel caricamento delle polizze');
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  // Filter and sort policies
  const filteredPolicies = useMemo(() => {
    let filtered = [...policies];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(policy => 
        policy.policy_number.toLowerCase().includes(searchLower) ||
        policy.contact.name.toLowerCase().includes(searchLower) ||
        policy.insurance_company.toLowerCase().includes(searchLower)
      );
    }

    // Policy type filter
    if (filters.policy_type) {
      filtered = filtered.filter(policy => policy.policy_type === filters.policy_type);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(policy => policy.status === filters.status);
    }

    // Company filter
    if (filters.insurance_company) {
      const companyLower = filters.insurance_company.toLowerCase();
      filtered = filtered.filter(policy => 
        policy.insurance_company.toLowerCase().includes(companyLower)
      );
    }

    // Expiry filter
    if (filters.expiry_filter !== 'all') {
      const today = new Date();
      const daysMap = { '30_days': 30, '60_days': 60, '90_days': 90 };
      const days = daysMap[filters.expiry_filter as keyof typeof daysMap];
      
      filtered = filtered.filter(policy => {
        const endDate = new Date(policy.end_date);
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= days && diffDays >= 0;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;

      switch (sortField) {
        case 'contact.name':
          aValue = a.contact.name;
          bValue = b.contact.name;
          break;
        case 'premium_amount':
          aValue = a.premium_amount;
          bValue = b.premium_amount;
          break;
        case 'end_date':
          aValue = new Date(a.end_date);
          bValue = new Date(b.end_date);
          break;
        case 'policy_number':
          aValue = a.policy_number;
          bValue = b.policy_number;
          break;
        case 'policy_type':
          aValue = a.policy_type;
          bValue = b.policy_type;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'insurance_company':
          aValue = a.insurance_company;
          bValue = b.insurance_company;
          break;
        default:
          aValue = a.policy_number;
          bValue = b.policy_number;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [policies, filters, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredPolicies.length / ITEMS_PER_PAGE);
  const paginatedPolicies = filteredPolicies.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Expiring policies count
  const expiringPoliciesCount = policies.filter(policy => 
    isPolicyExpiringSoon(policy.end_date)
  ).length;

  // Event Handlers
  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  useEffect(() => {
    diagnostics.log('component', 'PoliciesList.useEffect', {
      mounted: true,
      organizationId: organization?.id,
      location: window.location.pathname,
      policiesCount: policies.length,
      loading
    });
  }, [organization?.id, policies.length, loading]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (key: keyof PolicyFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleCreatePolicy = () => {
    navigate(ROUTES.insurance.policiesNew);
  };

  const handleViewPolicy = (id: string) => {
    navigate(ROUTES.insurance.policiesDetail(id));
  };

  const handleEditPolicy = (id: string) => {
    navigate(ROUTES.insurance.policiesEdit(id));
  };

  const handleDeletePolicy = async (policy: InsurancePolicyWithContact) => {
    if (!window.confirm(`Sei sicuro di voler eliminare la polizza ${policy.policy_number}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('insurance_policies')
        .delete()
        .eq('id', policy.id);

      if (error) {
        console.error('Error deleting policy:', error);
        toast.error('Errore nell\'eliminazione della polizza');
        return;
      }

      toast.success('Polizza eliminata con successo');
      fetchPolicies();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Errore nell\'eliminazione della polizza');
    }
  };

  const resetFilters = () => {
    setFilters(DEFAULT_POLICY_FILTERS);
    setCurrentPage(1);
  };

  // Render
  diagnostics.log('render', 'PoliciesList', { 
    rendering: true, 
    policies: policies.length,
    loading,
    organization: organization?.id 
  });

  return (
    <>
      <InsurancePoliciesMeta />
      
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Gestione Polizze
            </h1>
            <p className="text-gray-600">
              {filteredPolicies.length} polizze trovate
              {expiringPoliciesCount > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {expiringPoliciesCount} in scadenza
                </span>
              )}
            </p>
          </div>
          
          <button
            onClick={handleCreatePolicy}
            className="mt-4 lg:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuova Polizza
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Cerca per numero, cliente, compagnia..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Policy Type Filter */}
            <div>
              <select
                value={filters.policy_type}
                onChange={(e) => handleFilterChange('policy_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tutti i tipi</option>
                {POLICY_TYPES.map(type => (
                  <option key={type} value={type}>
                    {POLICY_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tutti gli stati</option>
                {POLICY_STATUSES.map(status => (
                  <option key={status} value={status}>
                    {POLICY_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>

            {/* Expiry Filter */}
            <div>
              <select
                value={filters.expiry_filter}
                onChange={(e) => handleFilterChange('expiry_filter', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tutte le scadenze</option>
                <option value="30_days">Entro 30 giorni</option>
                <option value="60_days">Entro 60 giorni</option>
                <option value="90_days">Entro 90 giorni</option>
              </select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Filter className="w-4 h-4" />
              <span>Filtri attivi</span>
            </div>
            <button
              onClick={resetFilters}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Reimposta filtri
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Caricamento polizze...</p>
            </div>
          ) : paginatedPolicies.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nessuna polizza trovata
              </h3>
              <p className="text-gray-600 mb-4">
                {filteredPolicies.length === 0 && policies.length === 0
                  ? 'Crea la prima polizza per iniziare.'
                  : 'Prova a modificare i filtri di ricerca.'
                }
              </p>
              {filteredPolicies.length === 0 && policies.length === 0 && (
                <button
                  onClick={handleCreatePolicy}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crea prima polizza
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('policy_number')}
                          className="flex items-center space-x-1 hover:text-gray-700"
                        >
                          <span>Numero Polizza</span>
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('contact.name')}
                          className="flex items-center space-x-1 hover:text-gray-700"
                        >
                          <span>Cliente</span>
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('policy_type')}
                          className="flex items-center space-x-1 hover:text-gray-700"
                        >
                          <span>Tipo</span>
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('status')}
                          className="flex items-center space-x-1 hover:text-gray-700"
                        >
                          <span>Stato</span>
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('insurance_company')}
                          className="flex items-center space-x-1 hover:text-gray-700"
                        >
                          <span>Compagnia</span>
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('premium_amount')}
                          className="flex items-center space-x-1 hover:text-gray-700"
                        >
                          <span>Premio</span>
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('end_date')}
                          className="flex items-center space-x-1 hover:text-gray-700"
                        >
                          <span>Scadenza</span>
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Azioni
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedPolicies.map((policy) => {
                      const isExpiringSoon = isPolicyExpiringSoon(policy.end_date);
                      const isExpired = isPolicyExpired(policy.end_date);
                      
                      return (
                        <tr key={policy.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <FileText className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm font-medium text-gray-900">
                                {policy.policy_number}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {policy.contact.name}
                              </div>
                              {policy.contact.company && (
                                <div className="text-sm text-gray-500 flex items-center">
                                  <Building2 className="w-3 h-3 mr-1" />
                                  {policy.contact.company}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">
                              {POLICY_TYPE_LABELS[policy.policy_type]}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${POLICY_STATUS_COLORS[policy.status]}`}>
                              {POLICY_STATUS_LABELS[policy.status]}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {policy.insurance_company}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(policy.premium_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                              <span className={`text-sm ${
                                isExpired ? 'text-red-600 font-medium' :
                                isExpiringSoon ? 'text-orange-600 font-medium' :
                                'text-gray-900'
                              }`}>
                                {formatDate(policy.end_date)}
                              </span>
                              {(isExpired || isExpiringSoon) && (
                                <AlertTriangle className="w-4 h-4 text-orange-500 ml-1" />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleViewPolicy(policy.id)}
                                className="text-blue-600 hover:text-blue-700"
                                title="Visualizza"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditPolicy(policy.id)}
                                className="text-gray-600 hover:text-gray-700"
                                title="Modifica"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePolicy(policy)}
                                className="text-red-600 hover:text-red-700"
                                title="Elimina"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="text-sm text-gray-700">
                        Mostrando{' '}
                        <span className="font-medium">
                          {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                        </span>{' '}
                        -{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * ITEMS_PER_PAGE, filteredPolicies.length)}
                        </span>{' '}
                        di{' '}
                        <span className="font-medium">{filteredPolicies.length}</span>{' '}
                        risultati
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-gray-700">
                        Pagina {currentPage} di {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};