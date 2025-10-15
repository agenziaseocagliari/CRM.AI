'use client';

import {
    ArcElement,
    Chart as ChartJS,
    ChartOptions,
    Legend,
    Tooltip,
} from 'chart.js';
import { useRef } from 'react';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface LeadCategoryData {
  lead_category: string;
  count: number;
  avg_score: number;
}

interface LeadCategoryChartProps {
  data: LeadCategoryData[];
  isLoading?: boolean;
}

export default function LeadCategoryChart({ data, isLoading = false }: LeadCategoryChartProps) {
  const chartRef = useRef(null);

  // Process data for chart
  const processData = () => {
    const categories = data.map(item => {
      const categoryName = item.lead_category || 'Uncategorized';
      return categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
    });
    
    const counts = data.map(item => item.count);
    
    const colors = [
      'rgba(239, 68, 68, 0.8)',   // red - Hot leads
      'rgba(245, 158, 11, 0.8)',  // amber - Warm leads
      'rgba(59, 130, 246, 0.8)',  // blue - Cold leads
      'rgba(34, 197, 94, 0.8)',   // green - Qualified
      'rgba(147, 51, 234, 0.8)',  // purple - Other
      'rgba(107, 114, 128, 0.8)', // gray - Uncategorized
    ];

    const borderColors = colors.map(color => color.replace('0.8', '1'));

    return {
      labels: categories,
      datasets: [
        {
          data: counts,
          backgroundColor: colors.slice(0, categories.length),
          borderColor: borderColors.slice(0, categories.length),
          borderWidth: 2,
          hoverBorderWidth: 3,
          hoverOffset: 8,
        },
      ],
    };
  };

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 500,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((sum, val) => sum + (val as number), 0);
            const percentage = ((value / total) * 100).toFixed(1);
            const avgScore = data[context.dataIndex]?.avg_score;
            
            return [
              `${label}: ${value} contacts (${percentage}%)`,
              avgScore ? `Avg Score: ${avgScore.toFixed(1)}/100` : ''
            ].filter(Boolean);
          },
        },
      },
    },
    cutout: '60%',
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 h-80">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-48 bg-gray-200 rounded-full mx-auto w-48"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 h-80 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Category Data</h3>
          <p className="text-gray-500">There's no lead category data available.</p>
        </div>
      </div>
    );
  }

  const chartData = processData();
  const totalContacts = data.reduce((sum, item) => sum + item.count, 0);
  const avgOverallScore = data.reduce((sum, item) => sum + (item.avg_score || 0), 0) / data.length;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Lead Categories</h3>
        <div className="text-right">
          <div className="text-sm text-gray-500">Total Contacts</div>
          <div className="text-xl font-bold text-gray-900">{totalContacts}</div>
        </div>
      </div>

      <div className="h-64 relative">
        <Doughnut ref={chartRef} data={chartData} options={options} />
        
        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{totalContacts}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
        </div>
      </div>

      {/* Category Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {data.map((item, index) => {
            const categoryName = item.lead_category || 'Uncategorized';
            const displayName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
            const percentage = ((item.count / totalContacts) * 100).toFixed(1);
            
            return (
              <div key={index} className="text-center">
                <div className="text-lg font-semibold text-gray-900">{item.count}</div>
                <div className="text-sm text-gray-600">{displayName}</div>
                <div className="text-xs text-gray-500">
                  {percentage}% • Score: {(item.avg_score || 0).toFixed(1)}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-800 font-medium">Average Lead Score</span>
            <span className="text-blue-900 font-bold">{avgOverallScore.toFixed(1)}/100</span>
          </div>
        </div>
      </div>
    </div>
  );
}