// CommissionDashboard.tsx - Commission Tracking Dashboard
// Sprint 2 Session 2 - UI Implementation

import { CheckCircle, Clock, Euro, List, TrendingUp } from 'lucide-react';
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import { useAuth } from "../../contexts/useAuth";
import { supabase } from "../../lib/supabaseClient";

// TypeScript Interfaces
interface KPIStats {
  mtdAmount: number;
  ytdAmount: number;
  pendingCount: number;
  paidCount: number;
}

interface CommissionAmount {
  commission_amount: string;
}

interface CommissionTypeAmount {
  commission_type: string;
  commission_amount: string;
}

interface CommissionDateAmount {
  calculation_date: string;
  commission_amount: string;
}

interface TypeDistribution {
  [key: string]: string | number;
  name: string;
  value: number;
  color: string;
}

interface TrendPoint {
  month: string;
  amount: number;
}

interface CommissionFilters {
  startDate: string;
  endDate: string;
  status: 'all' | 'pending' | 'calculated' | 'paid' | 'cancelled';
}

const CommissionDashboard: React.FC = () => {
  // Navigation
  const navigate = useNavigate();
  
  // State Management
  const [kpiStats, setKpiStats] = useState<KPIStats>({
    mtdAmount: 0,
    ytdAmount: 0,
    pendingCount: 0,
    paidCount: 0
  });
  
  const [typeDistribution, setTypeDistribution] = useState<TypeDistribution[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<CommissionFilters>({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of year
    endDate: new Date().toISOString().split('T')[0], // Today
    status: 'all'
  });

  const { session } = useAuth();

  // Colors for charts
  const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  // Fetch Functions
  const fetchStats = React.useCallback(async () => {
    if (!session?.user) return;

    try {
      // Get current dates
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      // MTD Amount - Month to Date
      const { data: mtdData, error: mtdError } = await supabase
        .from('insurance_commissions')
        .select('commission_amount')
        .gte('calculation_date', startOfMonth.toISOString())
        .lte('calculation_date', now.toISOString());

      if (mtdError) throw mtdError;

      const mtdAmount = mtdData?.reduce((sum: number, item: CommissionAmount) => sum + (parseFloat(item.commission_amount) || 0), 0) || 0;

      // YTD Amount - Year to Date
      const { data: ytdData, error: ytdError } = await supabase
        .from('insurance_commissions')
        .select('commission_amount')
        .gte('calculation_date', startOfYear.toISOString())
        .lte('calculation_date', now.toISOString());

      if (ytdError) throw ytdError;

      const ytdAmount = ytdData?.reduce((sum: number, item: CommissionAmount) => sum + (parseFloat(item.commission_amount) || 0), 0) || 0;

      // Pending Count
      const { count: pendingCount, error: pendingError } = await supabase
        .from('insurance_commissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      // Paid Count
      const { count: paidCount, error: paidError } = await supabase
        .from('insurance_commissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'paid');

      if (paidError) throw paidError;

      setKpiStats({
        mtdAmount,
        ytdAmount,
        pendingCount: pendingCount || 0,
        paidCount: paidCount || 0
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }, [session?.user]);

  const fetchByType = React.useCallback(async () => {
    if (!session?.user) return;

    try {
      const { data, error } = await supabase
        .from('insurance_commissions')
        .select('commission_type, commission_amount')
        .gte('calculation_date', filters.startDate)
        .lte('calculation_date', filters.endDate);

      if (error) throw error;

      // Group by commission type and sum amounts
      const typeMap: { [key: string]: number } = {};
      
      data?.forEach((item: CommissionTypeAmount) => {
        const type = item.commission_type;
        const amount = parseFloat(item.commission_amount) || 0;
        typeMap[type] = (typeMap[type] || 0) + amount;
      });

      // Convert to chart format with colors
      const typeLabels: { [key: string]: string } = {
        base: 'Base',
        renewal: 'Rinnovo',
        bonus: 'Bonus',
        override: 'Override'
      };

      const typeColors: { [key: string]: string } = {
        base: '#3B82F6',
        renewal: '#10B981',
        bonus: '#F59E0B',
        override: '#EF4444'
      };

      const distribution = Object.entries(typeMap).map(([type, value]) => ({
        name: typeLabels[type] || type,
        value,
        color: typeColors[type] || '#6B7280'
      }));

      setTypeDistribution(distribution);

    } catch (error) {
      console.error('Error fetching type distribution:', error);
      throw error;
    }
  }, [session?.user, filters.startDate, filters.endDate]);

  const fetchTrend = React.useCallback(async () => {
    if (!session?.user) return;

    try {
      // Get last 6 months data
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data, error } = await supabase
        .from('insurance_commissions')
        .select('calculation_date, commission_amount')
        .gte('calculation_date', sixMonthsAgo.toISOString())
        .order('calculation_date', { ascending: true });

      if (error) throw error;

      // Group by month and sum amounts
      const monthMap: { [key: string]: number } = {};
      
      data?.forEach((item: CommissionDateAmount) => {
        const date = new Date(item.calculation_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const amount = parseFloat(item.commission_amount) || 0;
        monthMap[monthKey] = (monthMap[monthKey] || 0) + amount;
      });

      // Convert to chart format
      const trendData = Object.entries(monthMap)
        .map(([month, amount]) => ({
          month,
          amount
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      setTrend(trendData);

    } catch (error) {
      console.error('Error fetching trend data:', error);
      throw error;
    }
  }, [session?.user]);

  // Initialize data on component mount
  const loadDashboardData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchStats(),
        fetchByType(),
        fetchTrend()
      ]);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  }, [fetchStats, fetchByType, fetchTrend]);

  useEffect(() => {
    if (session?.user) {
      loadDashboardData();
    }
  }, [session?.user, loadDashboardData]);

  // Event Handlers
  const handleFilterChange = (newFilters: Partial<CommissionFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Loading State
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-gray-200 rounded"></div>
            <div className="h-80 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="h-5 w-5 text-red-400">⚠️</div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Errore nel caricamento
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Dashboard Provvigioni
            </h1>
            <p className="text-gray-600">
              Monitora le performance delle tue provvigioni assicurative
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/assicurazioni/provvigioni/new')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <Euro className="h-4 w-4 mr-2" />
              Calcola Nuova Provvigione
            </button>
            <button
              onClick={() => navigate('/assicurazioni/provvigioni/list')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <List className="h-4 w-4 mr-2" />
              Vai alla Lista Provvigioni
            </button>
            <button
              onClick={() => navigate('/assicurazioni/provvigioni/reports')}
              className="ml-4 px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            >
              Report Provvigioni
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Inizio
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange({ startDate: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Fine
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange({ endDate: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange({ status: e.target.value as CommissionFilters['status'] })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">Tutti</option>
              <option value="pending">In Pending</option>
              <option value="calculated">Calcolate</option>
              <option value="paid">Pagate</option>
              <option value="cancelled">Annullate</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* MTD Amount */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Euro className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Provvigioni MTD</p>
              <p className="text-2xl font-bold text-gray-900">
                €{kpiStats.mtdAmount.toLocaleString('it-IT', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2 
                })}
              </p>
            </div>
          </div>
        </div>

        {/* YTD Amount */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Provvigioni YTD</p>
              <p className="text-2xl font-bold text-gray-900">
                €{kpiStats.ytdAmount.toLocaleString('it-IT', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2 
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Pending Count */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {kpiStats.pendingCount}
              </p>
            </div>
          </div>
        </div>

        {/* Paid Count */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pagate</p>
              <p className="text-2xl font-bold text-gray-900">
                {kpiStats.paidCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution by Type - Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Distribuzione per Tipo
          </h3>
          {typeDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={typeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [
                    `€${value.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`, 
                    'Importo'
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <p className="text-lg">Nessun dato disponibile</p>
                <p className="text-sm">Aggiungi alcune provvigioni per visualizzare i grafici</p>
              </div>
            </div>
          )}
        </div>

        {/* Monthly Trend - Line Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Trend Mensile (Ultimi 6 Mesi)
          </h3>
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis 
                  tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => [
                    `€${value.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`, 
                    'Provvigioni'
                  ]}
                  labelFormatter={(label) => `Mese: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <p className="text-lg">Nessun dato disponibile</p>
                <p className="text-sm">I dati del trend appariranno una volta inserite le provvigioni</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommissionDashboard;
