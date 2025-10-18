import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../contexts/useAuth';
import {
  TrendingUp,
  FileText,
  AlertCircle,
  DollarSign,
  Calendar
} from 'lucide-react';

interface InsurancePolicy {
  id: string;
  status: string;
  premium_amount: number;
  coverage_amount: number;
  created_at: string;
  premium_frequency: string;
  end_date: string;
}

interface DashboardStats {
  totalPolicies: number;
  activePolicies: number;
  policiesValue: number;
  expiringPolicies: number; // prossimi 30 giorni
  averagePremium: number;
  monthlyRevenue: number;
  newPoliciesThisMonth: number;
  totalCoverage: number;
}

export default function InsuranceDashboard() {
  const { jwtClaims } = useAuth();
  const organizationId = jwtClaims?.organization_id;

  const [stats, setStats] = useState<DashboardStats>({
    totalPolicies: 0,
    activePolicies: 0,
    policiesValue: 0,
    expiringPolicies: 0,
    averagePremium: 0,
    monthlyRevenue: 0,
    newPoliciesThisMonth: 0,
    totalCoverage: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organizationId) {
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [
        policiesData,
        expiringData,
        revenueData
      ] = await Promise.all([
        fetchPoliciesStats(),
        fetchExpiringPolicies(),
        fetchRevenueStats()
      ]);

      setStats({
        ...policiesData,
        ...expiringData,
        ...revenueData
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPoliciesStats = async () => {
    const { data, error } = await supabase
      .from('insurance_policies')
      .select('status, premium_amount, coverage_amount, created_at, premium_frequency')
      .eq('organization_id', organizationId) as { data: InsurancePolicy[] | null; error: unknown };

    if (error) throw error;

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalPolicies = data?.length || 0;
    const activePolicies = data?.filter((p: InsurancePolicy) => p.status === 'active').length || 0;
    const policiesValue = data?.reduce((sum: number, p: InsurancePolicy) => sum + (p.premium_amount || 0), 0) || 0;
    const totalCoverage = data?.reduce((sum: number, p: InsurancePolicy) => sum + (p.coverage_amount || 0), 0) || 0;
    const newPoliciesThisMonth = data?.filter((p: InsurancePolicy) => 
      new Date(p.created_at) >= firstDayOfMonth
    ).length || 0;

    const averagePremium = totalPolicies > 0 ? policiesValue / totalPolicies : 0;

    return {
      totalPolicies,
      activePolicies,
      policiesValue,
      newPoliciesThisMonth,
      averagePremium,
      totalCoverage
    };
  };

  const fetchExpiringPolicies = async () => {
    const today = new Date();
    const in30Days = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));

    const { data, error } = await supabase
      .from('insurance_policies')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .gte('end_date', today.toISOString())
      .lte('end_date', in30Days.toISOString());

    if (error) throw error;

    return {
      expiringPolicies: data?.length || 0
    };
  };

  const fetchRevenueStats = async () => {
    const { data, error } = await supabase
      .from('insurance_policies')
      .select('premium_amount, premium_frequency, created_at')
      .eq('organization_id', organizationId)
      .eq('status', 'active') as { data: InsurancePolicy[] | null; error: unknown };

    if (error) throw error;

    // Calculate estimated monthly revenue from active policies
    let monthlyRevenue = 0;
    data?.forEach((policy: InsurancePolicy) => {
      const premium = policy.premium_amount || 0;
      
      // Convert to monthly based on frequency
      switch (policy.premium_frequency) {
        case 'monthly':
          monthlyRevenue += premium;
          break;
        case 'quarterly':
          monthlyRevenue += premium / 3;
          break;
        case 'annual':
          monthlyRevenue += premium / 12;
          break;
        default:
          monthlyRevenue += premium / 12; // assume annual
      }
    });

    return {
      monthlyRevenue: Math.round(monthlyRevenue)
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Dashboard Assicurazioni</h1>
        <p className="text-blue-100">
          Panoramica completa della tua attività assicurativa
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI Card 1: Polizze Attive */}
        <KPICard
          title="Polizze Attive"
          value={stats.activePolicies}
          subtitle={`${stats.totalPolicies} totali`}
          icon={FileText}
          iconColor="bg-blue-500"
          trend={stats.newPoliciesThisMonth > 0 ? 'up' : 'neutral'}
          trendText={`+${stats.newPoliciesThisMonth} questo mese`}
        />

        {/* KPI Card 2: Scadenze Imminenti */}
        <KPICard
          title="Scadenze Imminenti"
          value={stats.expiringPolicies}
          subtitle="Prossimi 30 giorni"
          icon={Calendar}
          iconColor="bg-orange-500"
          trend={stats.expiringPolicies > 10 ? 'warning' : 'neutral'}
          trendText="Richiedono attenzione"
        />

        {/* KPI Card 3: Ricavi Mensili */}
        <KPICard
          title="Ricavi Mensili"
          value={`€${stats.monthlyRevenue.toLocaleString()}`}
          subtitle="Stimati da polizze attive"
          icon={DollarSign}
          iconColor="bg-green-500"
          trend="up"
          trendText="Ricavi ricorrenti"
        />

        {/* KPI Card 4: Copertura Totale */}
        <KPICard
          title="Copertura Totale"
          value={`€${(stats.totalCoverage / 1000).toFixed(0)}K`}
          subtitle={`€${stats.averagePremium.toFixed(0)} premio medio`}
          icon={TrendingUp}
          iconColor="bg-purple-500"
          trend="neutral"
          trendText="Valore assicurato"
        />
      </div>

      {/* Charts Section - Placeholder for now */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue per Tipo Polizza</h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Chart - Coming in next task</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Trend Polizze (6 mesi)</h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Chart - Coming in next task</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed - Placeholder */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Attività Recenti</h3>
        <div className="text-gray-400 text-center py-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Activity feed - Coming in next task</p>
            <p className="text-sm mt-2">Visualizzerà nuove polizze, scadenze, rinnovi</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// KPI Card Component
interface KPICardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  iconColor: string;
  trend?: 'up' | 'down' | 'warning' | 'neutral';
  trendText?: string;
}

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  trend = 'neutral',
  trendText
}: KPICardProps) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    warning: 'text-orange-600',
    neutral: 'text-gray-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`${iconColor} p-3 rounded-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend !== 'neutral' && (
          <TrendingUp className={`w-5 h-5 ${trendColors[trend]}`} />
        )}
      </div>

      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-500">{subtitle}</p>
      
      {trendText && (
        <p className={`text-xs mt-2 ${trendColors[trend]}`}>
          {trendText}
        </p>
      )}
    </div>
  );
}