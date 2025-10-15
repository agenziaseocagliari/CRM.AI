'use client';

import {
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    ChartOptions,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
} from 'chart.js';
import { format, parseISO } from 'date-fns';
import { useRef } from 'react';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface RevenueDataPoint {
  month: string;
  stage: string;
  total_revenue: number;
  deals_count: number;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
  chartType: 'line' | 'bar';
  isLoading?: boolean;
}

export default function RevenueChart({ data, chartType, isLoading = false }: RevenueChartProps) {
  const chartRef = useRef(null);

  // Process data for monthly revenue trend (line chart)
  const processMonthlyData = () => {
    const monthlyTotals = data.reduce((acc, item) => {
      const monthKey = format(parseISO(item.month), 'MMM yyyy');
      acc[monthKey] = (acc[monthKey] || 0) + item.total_revenue;
      return acc;
    }, {} as Record<string, number>);

    const labels = Object.keys(monthlyTotals).sort();
    const revenues = labels.map(label => monthlyTotals[label]);

    return {
      labels,
      datasets: [
        {
          label: 'Monthly Revenue',
          data: revenues,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
        },
      ],
    };
  };

  // Process data for revenue by stage (bar chart)
  const processStageData = () => {
    const stageRevenues = data.reduce((acc, item) => {
      acc[item.stage] = (acc[item.stage] || 0) + item.total_revenue;
      return acc;
    }, {} as Record<string, number>);

    const labels = Object.keys(stageRevenues);
    const revenues = Object.values(stageRevenues);

    const colors = [
      'rgba(239, 68, 68, 0.8)',   // red
      'rgba(245, 158, 11, 0.8)',  // amber
      'rgba(34, 197, 94, 0.8)',   // green
      'rgba(59, 130, 246, 0.8)',  // blue
      'rgba(147, 51, 234, 0.8)',  // purple
      'rgba(236, 72, 153, 0.8)',  // pink
    ];

    return {
      labels,
      datasets: [
        {
          label: 'Revenue by Stage',
          data: revenues,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: colors.slice(0, labels.length).map(color => 
            color.replace('0.8', '1')
          ),
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };
  };

  const chartData = chartType === 'line' ? processMonthlyData() : processStageData();

  const getBaseOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
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
        displayColors: true,
        callbacks: {},
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
          },
          callback: (value: string | number) => '€' + Number(value).toLocaleString(),
        },
      },
    },
  });

  const lineOptions: ChartOptions<'line'> = {
    ...getBaseOptions(),
    elements: {
      point: {
        hoverRadius: 8,
      },
    },
  };

  const barOptions: ChartOptions<'bar'> = {
    ...getBaseOptions(),
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 h-96">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Revenue Data</h3>
          <p className="text-gray-500">There's no revenue data available for the selected period.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {chartType === 'line' ? 'Revenue Trend' : 'Revenue by Stage'}
        </h3>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span>Total deals: {data.reduce((sum, item) => sum + item.deals_count, 0)}</span>
          <span>•</span>
          <span>Total revenue: €{data.reduce((sum, item) => sum + item.total_revenue, 0).toLocaleString()}</span>
        </div>
      </div>

      <div className="h-80">
        {chartType === 'line' ? (
          <Line ref={chartRef} data={chartData} options={lineOptions} />
        ) : (
          <Bar ref={chartRef} data={chartData} options={barOptions} />
        )}
      </div>

      {/* Chart Controls */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {chartType === 'line' 
              ? 'Monthly revenue progression over time'
              : 'Revenue breakdown by deal stages'
            }
          </span>
          <span>Data updated in real-time</span>
        </div>
      </div>
    </div>
  );
}