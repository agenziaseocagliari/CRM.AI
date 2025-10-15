'use client';

import { useState } from 'react';
import { Tab } from '@headlessui/react';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function ReportsPage() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for now
  const mockRevenueData = [
    { month: '2025-01', stage: 'Won', total_revenue: 15000, deals_count: 3 },
    { month: '2025-02', stage: 'Won', total_revenue: 22000, deals_count: 4 },
    { month: '2025-03', stage: 'Won', total_revenue: 18000, deals_count: 2 },
  ];

  const mockContactData = [
    { date: '2025-01-15', new_contacts: 12 },
    { date: '2025-01-16', new_contacts: 8 },
    { date: '2025-01-17', new_contacts: 15 },
  ];

  const mockFunnelData = [
    { stage: 'New Lead', count: 100, total_value: 500000, avg_time_in_stage: 2 },
    { stage: 'Contacted', count: 70, total_value: 350000, avg_time_in_stage: 5 },
    { stage: 'Proposal', count: 35, total_value: 175000, avg_time_in_stage: 10 },
    { stage: 'Won', count: 14, total_value: 70000, avg_time_in_stage: 15 },
  ];

  // CSV Export functions
  const exportRevenueCSV = () => {
    const csvContent = [
      ['Date', 'Stage', 'Revenue', 'Deals'],
      ...mockRevenueData.map(row => [
        row.month,
        row.stage,
        row.total_revenue.toString(),
        row.deals_count.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-report.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportContactsCSV = () => {
    const csvContent = [
      ['Date', 'New Contacts'],
      ...mockContactData.map(row => [
        row.date,
        row.new_contacts.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts-report.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportFunnelCSV = () => {
    const csvContent = [
      ['Stage', 'Count', 'Total Value', 'Avg Days'],
      ...mockFunnelData.map(row => [
        row.stage,
        row.count.toString(),
        row.total_value.toString(),
        row.avg_time_in_stage.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `funnel-report.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const refreshData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const tabs = [
    {
      name: 'Revenue',
      icon: ChartBarIcon,
      content: (
        <div className="space-y-6">
          {/* Revenue Filters */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-2">Time Period</label>
                  <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                    <option value="365">Last year</option>
                  </select>
                </div>
              </div>
              <button
                onClick={exportRevenueCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
            </div>
          </div>

          {/* Revenue Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">€55,000</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 text-green-600">
                  <ChartBarIcon className="h-6 w-6" />
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Average Deal</p>
                  <p className="text-2xl font-bold text-gray-900">€6,111</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                  <ChartBarIcon className="h-6 w-6" />
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Deals Won</p>
                  <p className="text-2xl font-bold text-gray-900">9</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
                  <ChartBarIcon className="h-6 w-6" />
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Growth Rate</p>
                  <p className="text-2xl font-bold text-gray-900">+15.2%</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-50 text-orange-600">
                  <ChartBarIcon className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Chart Placeholder */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <ChartBarIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Revenue chart will be displayed here</p>
                <p className="text-sm text-gray-500 mt-2">Chart.js integration in progress</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      name: 'Contacts',
      icon: UserGroupIcon,
      content: (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Contact Analytics</h2>
            <button
              onClick={exportContactsCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>

          {/* Contact Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Contacts</p>
                  <p className="text-2xl font-bold text-gray-900">247</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                  <UserGroupIcon className="h-6 w-6" />
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">New This Month</p>
                  <p className="text-2xl font-bold text-gray-900">35</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 text-green-600">
                  <UserGroupIcon className="h-6 w-6" />
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Avg Lead Score</p>
                  <p className="text-2xl font-bold text-gray-900">72.5/100</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-50 text-orange-600">
                  <UserGroupIcon className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Chart Placeholder */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Growth</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <UserGroupIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Contact analytics will be displayed here</p>
                <p className="text-sm text-gray-500 mt-2">Chart.js integration in progress</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      name: 'Pipeline',
      icon: FunnelIcon,
      content: (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Deal Pipeline Analysis</h2>
            <button
              onClick={exportFunnelCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>

          {/* Pipeline Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-blue-600">100</div>
              <div className="text-sm text-gray-500">Total Leads</div>
            </div>
            <div className="text-center bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-green-600">14</div>
              <div className="text-sm text-gray-500">Deals Won</div>
            </div>
            <div className="text-center bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-purple-600">14%</div>
              <div className="text-sm text-gray-500">Overall Conversion</div>
            </div>
            <div className="text-center bg-white p-4 rounded-lg shadow border">
              <div className="text-2xl font-bold text-orange-600">32</div>
              <div className="text-sm text-gray-500">Avg Cycle (days)</div>
            </div>
          </div>

          {/* Pipeline Funnel */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Deal Funnel</h3>
            <div className="space-y-4">
              {mockFunnelData.map((stage, index) => {
                const widthPercentage = (stage.count / mockFunnelData[0].count) * 100;
                const colors = ['bg-blue-100 border-blue-300', 'bg-green-100 border-green-300', 'bg-yellow-100 border-yellow-300', 'bg-purple-100 border-purple-300'];
                
                return (
                  <div key={index} className="relative">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1 relative">
                        <div className="h-16 bg-gray-100 rounded-lg overflow-hidden relative">
                          <div 
                            className={`h-full ${colors[index]} rounded-lg border-2 transition-all duration-500 ease-out flex items-center justify-between px-4`}
                            style={{ width: `${Math.max(widthPercentage, 20)}%` }}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="font-semibold text-lg">{stage.count}</div>
                              <div className="text-sm opacity-80">{stage.stage}</div>
                            </div>
                            <div className="text-right text-sm opacity-80">
                              <div>€{stage.total_value.toLocaleString()}</div>
                              <div>{widthPercentage.toFixed(1)}%</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="w-40 text-right text-sm">
                        <div className="font-medium text-gray-900">{stage.count} deals</div>
                        <div className="text-gray-500">{stage.avg_time_in_stage} days avg</div>
                        <div className="text-gray-500">€{(stage.total_value / stage.count).toLocaleString()} avg</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="mt-2 text-gray-600">
                Comprehensive insights into your business performance
              </p>
            </div>
            <button
              onClick={refreshData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-8">
            {tabs.map((tab) => (
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
                <div className="flex items-center justify-center gap-2">
                  <tab.icon className="h-5 w-5" />
                  {tab.name}
                </div>
              </Tab>
            ))}
          </Tab.List>
          
          <Tab.Panels className="mt-2">
            {tabs.map((tab, index) => (
              <Tab.Panel
                key={index}
                className="rounded-xl bg-white p-3 ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2"
              >
                {tab.content}
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}