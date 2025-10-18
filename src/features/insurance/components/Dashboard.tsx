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
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

interface InsurancePolicy {
  id: string;
  status: string;
  premium_amount: number;
  coverage_amount: number;
  created_at: string;
  premium_frequency: string;
  end_date: string;
  policy_type?: string;
  policy_number?: string;
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
  const [revenueByType, setRevenueByType] = useState<Array<{
    name: string;
    value: number;
    color: string;
  }>>([]);
  const [policiesTrend, setPoliciesTrend] = useState<Array<{
    month: string;
    count: number;
  }>>([]);
  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string;
    type: 'policy_created' | 'policy_expiring' | 'policy_renewed';
    title: string;
    subtitle: string;
    date: Date;
    icon: React.ElementType;
    iconColor: string;
  }>>([]);

  // Define chart colors
  const CHART_COLORS = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#06b6d4'  // cyan
  ];

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
        revenueData,
        chartData,
        trendData,
        activityData
      ] = await Promise.all([
        fetchPoliciesStats(),
        fetchExpiringPolicies(),
        fetchRevenueStats(),
        fetchRevenueByType(),
        fetchPoliciesTrend(),
        fetchRecentActivity()
      ]);

      setStats({
        ...policiesData,
        ...expiringData,
        ...revenueData
      });
      setRevenueByType(chartData);
      setPoliciesTrend(trendData);
      setRecentActivity(activityData);
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

  const fetchRevenueByType = async () => {
    const { data, error } = await supabase
      .from('insurance_policies')
      .select('policy_type, premium_amount, premium_frequency')
      .eq('organization_id', organizationId)
      .eq('status', 'active') as { data: InsurancePolicy[] | null; error: unknown };

    if (error) throw error;

    // Group by policy type and calculate monthly revenue
    const typeMap = new Map();

    data?.forEach((policy: InsurancePolicy) => {
      const type = policy.policy_type || 'Altro';
      const premium = policy.premium_amount || 0;

      // Convert to monthly
      let monthlyPremium = premium;
      if (policy.premium_frequency === 'quarterly') monthlyPremium = premium / 3;
      if (policy.premium_frequency === 'annual') monthlyPremium = premium / 12;

      typeMap.set(type, (typeMap.get(type) || 0) + monthlyPremium);
    });

    // Convert to chart format
    const chartData = Array.from(typeMap.entries()).map(([name, value], index) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: Math.round(value as number),
      color: CHART_COLORS[index % CHART_COLORS.length]
    }));

    return chartData;
  };

  const fetchPoliciesTrend = async () => {
    const { data, error } = await supabase
      .from('insurance_policies')
      .select('created_at')
      .eq('organization_id', organizationId)
      .gte('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true }) as { data: InsurancePolicy[] | null; error: unknown };

    if (error) throw error;

    // Group by month
    const monthMap = new Map();
    const now = new Date();
    
    // Initialize last 6 months with 0
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toISOString().slice(0, 7); // YYYY-MM
      const monthName = date.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' });
      monthMap.set(key, { month: monthName, count: 0 });
    }

    // Count policies per month
    data?.forEach((policy: InsurancePolicy) => {
      const key = policy.created_at.slice(0, 7);
      if (monthMap.has(key)) {
        monthMap.get(key).count++;
      }
    });

    return Array.from(monthMap.values());
  };

  const fetchRecentActivity = async () => {
    const { data, error } = await supabase
      .from('insurance_policies')
      .select('id, policy_number, policy_type, status, created_at, end_date')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(10) as { data: InsurancePolicy[] | null; error: unknown };

    if (error) throw error;

    const activities: Array<{
      id: string;
      type: 'policy_created' | 'policy_expiring' | 'policy_renewed';
      title: string;
      subtitle: string;
      date: Date;
      icon: React.ElementType;
      iconColor: string;
    }> = [];
    const now = new Date();

    data?.forEach((policy: InsurancePolicy) => {
      // Recent creations (last 30 days)
      const createdDate = new Date(policy.created_at);
      if ((now.getTime() - createdDate.getTime()) < 30 * 24 * 60 * 60 * 1000) {
        activities.push({
          id: policy.id,
          type: 'policy_created',
          title: `Nuova polizza ${policy.policy_type}`,
          subtitle: `N. ${policy.policy_number}`,
          date: createdDate,
          icon: FileText,
          iconColor: 'bg-blue-500'
        });
      }

      // Expiring soon (next 30 days)
      if (policy.status === 'active' && policy.end_date) {
        const endDate = new Date(policy.end_date);
        const daysUntil = Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        
        if (daysUntil > 0 && daysUntil <= 30) {
          activities.push({
            id: `${policy.id}-expiring`,
            type: 'policy_expiring',
            title: `Scadenza polizza ${policy.policy_type}`,
            subtitle: `In scadenza tra ${daysUntil} giorni`,
            date: endDate,
            icon: Calendar,
            iconColor: 'bg-orange-500'
          });
        }
      }
    });

    // Sort by date descending
    activities.sort((a, b) => b.date.getTime() - a.date.getTime());

    return activities.slice(0, 10);
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
          {revenueByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}

                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `€${value.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400">
              <FileText className="w-12 h-12 mb-2" />
              <p>Nessuna polizza attiva</p>
              <p className="text-sm">Aggiungi polizze per visualizzare i dati</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Trend Polizze (6 mesi)</h3>
          
          {policiesTrend.length > 0 && policiesTrend.some(d => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={policiesTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400">
              <TrendingUp className="w-12 h-12 mb-2" />
              <p>Dati insufficienti</p>
              <p className="text-sm">Aggiungi polizze per vedere il trend</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickActionButton
          title="Nuova Polizza"
          subtitle="Aggiungi polizza"
          icon={FileText}
          onClick={() => window.location.href = '/assicurazioni/polizze/new'}
          color="blue"
        />
        
        <QuickActionButton
          title="Registra Sinistro"
          subtitle="Nuovo sinistro"
          icon={AlertCircle}
          onClick={() => window.location.href = '/assicurazioni/sinistri/new'}
          color="red"
        />
        
        <QuickActionButton
          title="Scadenzario"
          subtitle="Vedi scadenze"
          icon={Calendar}
          onClick={() => window.location.href = '/assicurazioni/scadenzario'}
          color="orange"
        />
        
        <QuickActionButton
          title="Report"
          subtitle="Provvigioni"
          icon={DollarSign}
          onClick={() => window.location.href = '/assicurazioni/provvigioni'}
          color="green"
        />
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Attività Recenti</h3>
        
        {recentActivity.length > 0 ? (
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition">
                <div className={`${activity.iconColor} p-2 rounded-lg`}>
                  <activity.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-500">{activity.subtitle}</p>
                </div>
                <span className="text-xs text-gray-400">
                  {activity.date.toLocaleDateString('it-IT', { 
                    day: 'numeric', 
                    month: 'short' 
                  })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-400 text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
            <p>Nessuna attività recente</p>
            <p className="text-sm">Le attività appariranno qui</p>
          </div>
        )}
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

// Quick Action Button Component
interface QuickActionButtonProps {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  onClick: () => void;
  color: 'blue' | 'red' | 'orange' | 'green';
}

function QuickActionButton({ title, subtitle, icon: Icon, onClick, color }: QuickActionButtonProps) {
  const colors = {
    blue: 'bg-blue-500 hover:bg-blue-600',
    red: 'bg-red-500 hover:bg-red-600',
    orange: 'bg-orange-500 hover:bg-orange-600',
    green: 'bg-green-500 hover:bg-green-600'
  };

  return (
    <button
      onClick={onClick}
      className={`${colors[color]} text-white rounded-lg p-4 text-left hover:shadow-lg transition-all`}
    >
      <Icon className="w-6 h-6 mb-2" />
      <p className="font-semibold">{title}</p>
      <p className="text-sm opacity-90">{subtitle}</p>
    </button>
  );
}