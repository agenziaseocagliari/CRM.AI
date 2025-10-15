'use client';

import {
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
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ContactGrowthDataPoint {
  date: string;
  new_contacts: number;
}

interface ContactGrowthChartProps {
  data: ContactGrowthDataPoint[];
  isLoading?: boolean;
}

export default function ContactGrowthChart({ data, isLoading = false }: ContactGrowthChartProps) {
  const chartRef = useRef(null);

  // Process data for chart
  const processData = () => {
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const labels = sortedData.map(item => format(parseISO(item.date), 'MMM dd'));
    const newContacts = sortedData.map(item => item.new_contacts);
    
    // Calculate cumulative total
    const cumulativeContacts = newContacts.reduce((acc, current, index) => {
      acc.push(index === 0 ? current : acc[index - 1] + current);
      return acc;
    }, [] as number[]);

    return {
      labels,
      datasets: [
        {
          label: 'New Contacts',
          data: newContacts,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'rgb(34, 197, 94)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
        },
        {
          label: 'Total Contacts',
          data: cumulativeContacts,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.05)',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          borderDash: [5, 5],
        },
      ],
    };
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
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
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            return `${context.dataset.label}: ${value} contacts`;
          },
        },
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
          maxRotation: 45,
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
          callback: function(value) {
            return Number(value).toLocaleString();
          },
        },
      },
    },
    elements: {
      point: {
        hoverRadius: 8,
      },
    },
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 h-80">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Contact Data</h3>
          <p className="text-gray-500">There's no contact growth data available for the selected period.</p>
        </div>
      </div>
    );
  }

  const chartData = processData();
  const totalNewContacts = data.reduce((sum, item) => sum + item.new_contacts, 0);
  const averagePerDay = totalNewContacts / Math.max(data.length, 1);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Contact Growth</h3>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span>Total new: {totalNewContacts}</span>
          <span>•</span>
          <span>Avg/day: {averagePerDay.toFixed(1)}</span>
        </div>
      </div>

      <div className="h-64">
        <Line ref={chartRef} data={chartData} options={options} />
      </div>

      {/* Chart Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalNewContacts}</div>
            <div className="text-gray-500">New Contacts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{averagePerDay.toFixed(1)}</div>
            <div className="text-gray-500">Daily Average</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{data.length}</div>
            <div className="text-gray-500">Days Tracked</div>
          </div>
        </div>
      </div>
    </div>
  );
}