
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card } from './ui/Card';
import { Opportunity, PipelineStage } from '../types';
import { DollarSignIcon, UsersIcon, CheckCircleIcon, TrendingUpIcon } from './ui/icons';

interface DashboardProps {
  opportunities: Record<PipelineStage, Opportunity[]>;
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export const Dashboard: React.FC<DashboardProps> = ({ opportunities }) => {
  const allOpportunities: Opportunity[] = Object.values(opportunities).flat();
  const totalRevenue = allOpportunities.filter(op => op.stage === 'Won').reduce((sum, op) => sum + op.value, 0);
  const newLeadsCount = opportunities['New Lead']?.length || 0;
  const dealsWon = opportunities['Won']?.length || 0;
  const conversionRate = allOpportunities.length > 0 ? ((dealsWon / allOpportunities.length) * 100).toFixed(1) : 0;

  const pipelineData = (Object.keys(opportunities) as PipelineStage[]).map((stage) => ({
    name: stage,
    value: opportunities[stage].reduce((sum, op) => sum + op.value, 0),
    count: opportunities[stage].length
  }));

  const salesByStageData = (Object.keys(opportunities) as PipelineStage[]).map((stage) => ({
    name: stage,
    count: opportunities[stage].length,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card title="Fatturato Totale" value={`€${totalRevenue.toLocaleString('it-IT')}`} icon={<DollarSignIcon className="w-8 h-8 text-white" />} color="bg-blue-500" />
        <Card title="Nuovi Lead" value={newLeadsCount.toString()} icon={<UsersIcon className="w-8 h-8 text-white" />} color="bg-green-500" />
        <Card title="Affari Vinti" value={dealsWon.toString()} icon={<CheckCircleIcon className="w-8 h-8 text-white" />} color="bg-yellow-500" />
        <Card title="Tasso di Conversione" value={`${conversionRate}%`} icon={<TrendingUpIcon className="w-8 h-8 text-white" />} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Valore Pipeline per Fase</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pipelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `€${Number(value) / 1000}k`} />
              <Tooltip formatter={(value) => `€${Number(value).toLocaleString('it-IT')}`} />
              <Legend />
              <Bar dataKey="value" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Opportunità per Fase</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={salesByStageData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={110}
                fill="#8884d8"
                dataKey="count"
                nameKey="name"
                label={(props: any) => `${props.name} ${props.percent ? (props.percent * 100).toFixed(0) : 0}%`}
              >
                {salesByStageData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} opportunità`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};