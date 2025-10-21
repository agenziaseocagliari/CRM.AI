import { Tab } from '@headlessui/react';
import {
    ArrowPathIcon,
    ChartBarIcon,
    FunnelIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useOutletContext } from 'react-router-dom';

import { useCrmData } from '../hooks/useCrmData';
import { OpportunitiesData, Opportunity, PipelineStage } from '../types';

// 🔧 TEMPORARY: Chart.js imports DISABLED for debugging
/*
import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
} from 'chart.js';
import { format } from 'date-fns';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement
);
*/

import { format } from 'date-fns';

const REPORTS_VERSION = 'v5.0-CHARTS-DISABLED';
console.log(`📊 [REPORTS INIT] Version: ${REPORTS_VERSION}`);

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export const Reports: React.FC = () => {
  console.log(`🔄 [REPORTS MOUNT] Component rendering - ${REPORTS_VERSION}`);
  
  // Use EXACT same pattern as Opportunities.tsx - Get context data safely
  const contextData = useOutletContext<ReturnType<typeof useCrmData>>();
  const { opportunities: initialData, contacts, organization, refetch: refetchData } = contextData || {};
  
  console.log('📊 REPORTS: Context data received:', { 
    initialData, 
    contacts: contacts?.length || 0, 
    organization: organization?.name || 'none'
  });
  
  // Use same state management as Opportunities
  const [boardData, setBoardData] = useState<OpportunitiesData>(initialData || {});
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Use EXACT same useEffect pattern as Opportunities
  useEffect(() => {
    console.log('🔄 REPORTS: initialData changed, updating boardData:', initialData);
    if (initialData) {
      setBoardData(initialData);
    }
  }, [initialData]);

  // Calculate metrics using same logic as working components
  const allOpportunities: Opportunity[] = Object.keys(boardData).reduce<Opportunity[]>(
    (acc, key) => acc.concat(boardData[key as PipelineStage] || []),
    [],
  );
  
  const totalRevenue = allOpportunities.reduce((sum, op) => sum + (op.value || 0), 0);
  const dealsWon = allOpportunities.filter(op => op.stage === PipelineStage.Won);
  const totalDeals = allOpportunities.length;
  const avgDealSize = totalDeals > 0 ? totalRevenue / totalDeals : 0;
  const conversionRate = totalDeals > 0 ? (dealsWon.length / totalDeals) * 100 : 0;

  // Export functions (using real data from context)
  const exportRevenueCSV = async () => {
    if (!organization) {
      toast.error('Organization not found');
      return;
    }

    try {
      setIsLoading(true);
      
      // Use real opportunities from context
      if (!allOpportunities || allOpportunities.length === 0) {
        toast.error('No opportunities found');
        return;
      }

      const csvContent = [
        'Date,Stage,Deal Name,Value,Status',
        ...allOpportunities.map(opp => 
          `${opp.created_at || new Date().toISOString().split('T')[0]},${opp.stage},${opp.contact_name},${opp.value || 0},${opp.stage}`
        )
      ].join('\\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `revenue-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${allOpportunities.length} opportunities`);
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    } finally {
      setIsLoading(false);
    }
  };

  const exportContactsCSV = async () => {
    if (!organization) {
      toast.error('Organization not found');
      return;
    }

    try {
      setIsLoading(true);
      
      // Use real contacts from context
      if (!contacts || contacts.length === 0) {
        toast.error('No contacts found');
        return;
      }

      const csvRows = ['Name,Email,Phone,Company,Lead Score,Created Date'];
      contacts.forEach(contact => {
        const name = contact.name || '';
        const email = contact.email || '';
        const phone = contact.phone || '';
        const company = contact.company || '';
        const leadScore = contact.lead_score || 0;
        const createdAt = contact.created_at || '';
        csvRows.push(`"${name}","${email}","${phone}","${company}","${leadScore}","${createdAt}"`);
      });
      const csvContent = csvRows.join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `contacts-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${contacts.length} contacts`);
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    } finally {
      setIsLoading(false);
    }
  };

  const exportFunnelCSV = async () => {
    if (!organization) {
      toast.error('Organization not found');
      return;
    }

    try {
      setIsLoading(true);
      
      // Use real opportunities from context grouped by stage
      const stages = ['New Lead', 'Contacted', 'Proposal Sent', 'Won', 'Lost'];
      const funnelData = stages.map(stage => {
        const stageOpps = allOpportunities.filter(op => op.stage === stage);
        const stageValue = stageOpps.reduce((sum, op) => sum + (op.value || 0), 0);
        return {
          stage,
          count: stageOpps.length,
          total_value: stageValue,
          avg_value: stageOpps.length > 0 ? stageValue / stageOpps.length : 0
        };
      });

      const csvContent = [
        'Stage,Count,Total Value,Average Value',
        ...funnelData.map(data => 
          `${data.stage},${data.count},${data.total_value},${data.avg_value.toFixed(2)}`
        )
      ].join('\\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `funnel-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Funnel report exported');
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    } finally {
      setIsLoading(false);
    }
  };

  // 🔧 TEMP: Chart data DISABLED for debugging
  /* ORIGINAL CODE - RE-ENABLE AFTER FIXING CHART.JS:
  const revenueChartData = {
    labels: Object.values(PipelineStage),
    datasets: [
      {
        label: 'Revenue by Stage',
        data: Object.values(PipelineStage).map(stage => {
          const stageOpps = boardData[stage] || [];
          return stageOpps.reduce((sum, op) => sum + (op.value || 0), 0);
        }),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(99, 102, 241, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
      },
    ],
  };

  const pipelineChartData = {
    labels: Object.values(PipelineStage),
    datasets: [
      {
        label: 'Opportunities',
        data: Object.values(PipelineStage).map(stage => (boardData[stage] || []).length),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  const conversionChartData = {
    labels: Object.values(PipelineStage),
    datasets: [
      {
        label: 'Conversion Rate',
        data: Object.values(PipelineStage).map(stage => {
          const stageCount = (boardData[stage] || []).length;
          return totalDeals > 0 ? (stageCount / totalDeals) * 100 : 0;
        }),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        tension: 0.4,
      },
    ],
  };
  */

  const tabsList = [
    { name: 'Revenue Analytics', icon: ChartBarIcon },
    { name: 'Pipeline Funnel', icon: FunnelIcon },
    { name: 'Contact Analytics', icon: UserGroupIcon },
  ];

  const MetricCard = ({ title, value, change }: { title: string; value: string; change?: string }) => (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className="text-sm text-green-600">
              {change}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <button
          onClick={() => refetchData && refetchData()}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
          disabled={isLoading}
        >
          <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <MetricCard 
          title="Total Revenue" 
          value={`€${totalRevenue.toLocaleString()}`} 
        />
        <MetricCard 
          title="Total Opportunities" 
          value={totalDeals.toString()} 
        />
        <MetricCard 
          title="Average Deal Size" 
          value={`€${Math.round(avgDealSize).toLocaleString()}`} 
        />
        <MetricCard 
          title="Conversion Rate" 
          value={`${conversionRate.toFixed(1)}%`} 
        />
      </div>

      {/* Tabs */}
      <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-6">
          {tabsList.map((tab) => (
            <Tab
              key={tab.name}
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white text-blue-700 shadow'
                    : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                )
              }
            >
              <div className="flex items-center justify-center space-x-2">
                <tab.icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </div>
            </Tab>
          ))}
        </Tab.List>
        
        <Tab.Panels>
          <Tab.Panel>
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Revenue by Stage</h3>
                    <button 
                      onClick={exportRevenueCSV}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                      disabled={isLoading}
                    >
                      Export CSV
                    </button>
                  </div>
                  {/* 🔧 TEMP: Chart disabled */}
                  <div className="border-4 border-yellow-500 bg-yellow-50 p-8 rounded text-center">
                    <div className="text-6xl mb-2">📊</div>
                    <p className="font-bold text-yellow-900">Revenue Chart Disabled for Debugging</p>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-4">Stage Breakdown</h3>
                  {Object.values(PipelineStage).map(stage => {
                    const stageOpps = boardData[stage] || [];
                    const stageValue = stageOpps.reduce((sum, op) => sum + (op.value || 0), 0);
                    return (
                      <div key={stage} className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm font-medium">{stage}</span>
                        <div className="text-right">
                          <div className="text-sm font-bold">€{stageValue.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">{stageOpps.length} deals</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Tab.Panel>
          
          <Tab.Panel>
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Pipeline Distribution</h3>
                    <button 
                      onClick={exportFunnelCSV}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                      disabled={isLoading}
                    >
                      Export CSV
                    </button>
                  </div>
                  {/* 🔧 TEMP: Chart disabled */}
                  <div className="border-4 border-yellow-500 bg-yellow-50 p-8 rounded text-center">
                    <div className="text-6xl mb-2">📊</div>
                    <p className="font-bold text-yellow-900">Pipeline Chart Disabled for Debugging</p>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-4">Conversion Funnel</h3>
                  {/* 🔧 TEMP: Chart disabled */}
                  <div className="border-4 border-yellow-500 bg-yellow-50 p-8 rounded text-center">
                    <div className="text-6xl mb-2">📈</div>
                    <p className="font-bold text-yellow-900">Conversion Chart Disabled for Debugging</p>
                  </div>
                </div>
              </div>
            </div>
          </Tab.Panel>
          
          <Tab.Panel>
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Contact Overview</h3>
                    <button 
                      onClick={exportContactsCSV}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                      disabled={isLoading}
                    >
                      Export CSV
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Contacts</span>
                      <span className="font-bold">{contacts?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Lead Score</span>
                      <span className="font-bold">
                        {contacts && contacts.length > 0 
                          ? (contacts.reduce((sum, c) => sum + (c.lead_score || 0), 0) / contacts.length).toFixed(1)
                          : '0'
                        }
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-4">Lead Score Distribution</h3>
                  <div className="space-y-2">
                    {['Hot (80-100)', 'Warm (50-79)', 'Cold (0-49)'].map(category => {
                      const range = category.includes('80-100') ? [80, 100] : 
                                   category.includes('50-79') ? [50, 79] : [0, 49];
                      const count = contacts?.filter(c => 
                        (c.lead_score || 0) >= range[0] && (c.lead_score || 0) <= range[1]
                      ).length || 0;
                      
                      return (
                        <div key={category} className="flex justify-between">
                          <span className="text-sm">{category}</span>
                          <span className="font-bold">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};