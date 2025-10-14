import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useCrmData } from '../hooks/useCrmData';
import { DashboardService, DashboardStats, RecentActivity } from '../services/dashboardService';
import { Opportunity, PipelineStage } from '../types';
import { UniversalAIChat } from './ai/UniversalAIChat';
import { EnhancedStatCard } from './dashboard/EnhancedStatCard';
import QuickActions from './dashboard/QuickActions';
import { RecentActivityFeed } from './dashboard/RecentActivityFeed';
import { SessionHealthIndicator } from './SessionHealthIndicator';
import {
    CalendarIcon,
    ChartBarIcon,
    CheckCircleIcon,
    ClipboardDataIcon,
    ClockIcon,
    DollarSignIcon,
    TrendingUpIcon,
    UsersIcon
} from './ui/icons';




export const Dashboard: React.FC = () => {
  const { opportunities, contacts, organization } = useOutletContext<ReturnType<typeof useCrmData>>();
  const navigate = useNavigate();
  
  // Enhanced state for dashboard data
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load enhanced dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!organization?.id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const [stats, activities] = await Promise.all([
          DashboardService.getDashboardStats(organization.id),
          DashboardService.getRecentActivity(organization.id, 8)
        ]);
        
        setDashboardStats(stats);
        setRecentActivities(activities);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Errore nel caricamento dei dati della dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [organization?.id]);

  // Legacy data calculations for backward compatibility
  const allOpportunities: Opportunity[] = Object.keys(opportunities).reduce<Opportunity[]>(
    (acc, key) => acc.concat(opportunities[key as PipelineStage]),
    [],
  );
  const legacyTotalRevenue = allOpportunities.filter(op => op.stage === 'Won').reduce((sum, op) => sum + op.value, 0);
  const legacyContactsCount = contacts?.length || 0;
  const legacyDealsWon = opportunities[PipelineStage.Won]?.length || 0;
  const legacyConversionRate = allOpportunities.length > 0 ? ((legacyDealsWon / allOpportunities.length) * 100) : 0;

  // Use enhanced data if available, fallback to legacy
  const displayStats = useMemo(() => dashboardStats || {
    totalRevenue: legacyTotalRevenue,
    monthlyRevenue: 0,
    totalContacts: legacyContactsCount,
    newContactsThisMonth: 0,
    totalDeals: allOpportunities.length,
    dealsWon: legacyDealsWon,
    dealsLost: 0,
    conversionRate: legacyConversionRate,
    totalEvents: 0,
    eventsThisMonth: 0,
    formSubmissions: 0,
    formSubmissionsThisMonth: 0,
  }, [dashboardStats, legacyTotalRevenue, legacyContactsCount, allOpportunities.length, legacyDealsWon, legacyConversionRate]);

  // Chart data
  const pipelineData = Object.values(PipelineStage).map(stage => ({
    name: stage,
    Opportunità: opportunities[stage]?.length || 0,
  }));
  
  // Enhanced lead source data (to be replaced with real data)
  const leadSourceData = useMemo(() => [
    { name: 'Sito Web', value: displayStats.formSubmissions * 0.4 },
    { name: 'Referral', value: displayStats.totalContacts * 0.3 },
    { name: 'Social Media', value: displayStats.totalContacts * 0.2 },
    { name: 'Eventi', value: displayStats.totalEvents * 0.1 },
  ], [displayStats]);
  
  const COLORS = ['#4f46e5', '#34d399', '#f59e0b', '#ec4899'];

  // Quick actions handlers
  const handleQuickAction = useCallback((action: string) => {
    console.log(`Quick action clicked: ${action}`); // Debug log
    switch (action) {
      case 'add-contact':
        console.log('Navigating to contacts with add modal...'); // Debug
        navigate('/dashboard/contacts', { state: { openAddModal: true } });
        break;
      case 'create-deal':
        console.log('Navigating to opportunities with add modal...'); // Debug
        navigate('/dashboard/opportunities', { state: { openAddModal: true } });
        break;
      case 'schedule-event':
        console.log('Navigating to calendar with add modal...'); // Debug
        navigate('/dashboard/calendar', { state: { openAddModal: true } });
        break;
      case 'create-form':
        console.log('Navigating to forms with add modal...'); // Debug
        navigate('/dashboard/forms', { state: { openAddModal: true } });
        break;
      case 'send-email':
        console.log('Navigating to contacts with email modal...'); // Debug
        navigate('/dashboard/contacts', { state: { openEmailModal: true } });
        break;
      case 'view-pipeline':
        console.log('Navigating to opportunities pipeline...'); // Debug
        navigate('/dashboard/opportunities');
        break;
      default:
        console.log('Unknown action:', action);
    }
  }, [navigate]);




  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
        <div className="text-sm text-gray-500">
          {organization?.name && `Organizzazione: ${organization.name}`}
        </div>
      </div>
      
      {/* Session Health Indicator */}
      <SessionHealthIndicator compact={false} checkInterval={5} />
      
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <EnhancedStatCard
          title="Fatturato Totale"
          value={`€${displayStats.totalRevenue.toLocaleString('it-IT')}`}
          icon={<DollarSignIcon className="w-6 h-6 text-white" />}
          color="bg-green-500"
          loading={loading}
          onClick={() => navigate('/pipeline')}
          subtitle="Ricavi da deals vinti"
          trend={displayStats.monthlyRevenue > 0 ? {
            value: Math.round((displayStats.monthlyRevenue / displayStats.totalRevenue) * 100),
            label: "questo mese",
            isPositive: true
          } : undefined}
        />
        
        <EnhancedStatCard
          title="Contatti Totali"
          value={displayStats.totalContacts.toString()}
          icon={<UsersIcon className="w-6 h-6 text-white" />}
          color="bg-blue-500"
          loading={loading}
          onClick={() => navigate('/contacts')}
          subtitle="Persone nel CRM"
          trend={displayStats.newContactsThisMonth > 0 ? {
            value: displayStats.newContactsThisMonth,
            label: "nuovi questo mese",
            isPositive: true
          } : undefined}
        />
        
        <EnhancedStatCard
          title="Deals Vinti"
          value={displayStats.dealsWon.toString()}
          icon={<CheckCircleIcon className="w-6 h-6 text-white" />}
          color="bg-emerald-500"
          loading={loading}
          onClick={() => navigate('/pipeline')}
          subtitle={`${displayStats.dealsLost} persi`}
        />
        
        <EnhancedStatCard
          title="Conversione"
          value={`${displayStats.conversionRate.toFixed(1)}%`}
          icon={<TrendingUpIcon className="w-6 h-6 text-white" />}
          color="bg-purple-500"
          loading={loading}
          subtitle={`${displayStats.totalDeals} deals totali`}
          trend={{
            value: displayStats.conversionRate,
            label: "tasso successo",
            isPositive: displayStats.conversionRate > 20
          }}
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <EnhancedStatCard
          title="Eventi"
          value={displayStats.totalEvents.toString()}
          icon={<CalendarIcon className="w-6 h-6 text-white" />}
          color="bg-indigo-500"
          loading={loading}
          onClick={() => navigate('/calendar')}
          subtitle={`${displayStats.eventsThisMonth} questo mese`}
        />
        
        <EnhancedStatCard
          title="Form Compilati"
          value={displayStats.formSubmissions.toString()}
          icon={<ClipboardDataIcon className="w-6 h-6 text-white" />}
          color="bg-orange-500"
          loading={loading}
          onClick={() => navigate('/forms')}
          subtitle={`${displayStats.formSubmissionsThisMonth} questo mese`}
        />
        
        <EnhancedStatCard
          title="Attività Recenti"
          value={recentActivities.length.toString()}
          icon={<ClockIcon className="w-6 h-6 text-white" />}
          color="bg-cyan-500"
          loading={loading}
          subtitle="Nelle ultime ore"
        />
        
        <EnhancedStatCard
          title="Performance"
          value={displayStats.conversionRate > 25 ? "Eccellente" : displayStats.conversionRate > 15 ? "Buona" : "Da migliorare"}
          icon={<ChartBarIcon className="w-6 h-6 text-white" />}
          color={displayStats.conversionRate > 25 ? "bg-green-500" : displayStats.conversionRate > 15 ? "bg-yellow-500" : "bg-red-500"}
          loading={loading}
          subtitle="Valutazione generale"
        />
      </div>

      {/* Dashboard Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts Section - Takes up 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pipeline Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Panoramica Pipeline</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={pipelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Opportunità" fill="#4f46e5" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Lead Sources Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Fonti dei Lead</h2>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={leadSourceData}
                    cx="40%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={85}
                    fill="#8884d8"
                    dataKey="value"
                    label={(props: Record<string, unknown>) => {
                      // Only show labels for slices that are large enough (>8%)
                      const percent = props.percent as number;
                      return percent > 0.08 ? `${(percent * 100).toFixed(0)}%` : '';
                    }}
                  >
                    {leadSourceData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string) => [`${value}`, name]}
                    labelFormatter={() => ''}
                  />
                  <Legend 
                    verticalAlign="middle" 
                    align="right"
                    layout="vertical"
                    iconSize={12}
                    wrapperStyle={{
                      paddingLeft: "20px",
                      fontSize: "14px"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions */}
          <QuickActions />
        </div>

        {/* Recent Activity - Takes up 1 column */}
        <div className="lg:col-span-1">
          <RecentActivityFeed
            activities={recentActivities}
            loading={loading}
            onViewAll={() => navigate('/activity')}
          />
        </div>
      </div>

      {/* Universal AI Chat - Dashboard Analytics */}
      <UniversalAIChat
        currentModule="Dashboard"
        organizationId={organization?.id || "demo-org"}
        userId="demo-user"
        onActionTriggered={(action, data) => {
          console.log('Dashboard AI Action:', action, data);
          // Handle AI actions (analytics, reports, insights, etc.)
        }}
      />
    </div>
  );
};


