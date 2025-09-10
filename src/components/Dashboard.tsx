import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card } from './ui/Card';
import { Opportunity, PipelineStage } from '../types';
import { DollarSignIcon, UsersIcon, CheckCircleIcon, TrendingUpIcon } from './ui/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useCrmData } from '../hooks/useCrmData';


export const Dashboard: React.FC = () => {
  const { opportunities, contacts } = useOutletContext<ReturnType<typeof useCrmData>>();

  // FIX: Replaced .flat() with a more robust method (reduce) to avoid type inference issues that caused the array to be typed as `unknown[]`.
  const allOpportunities: Opportunity[] = Object.values(opportunities).reduce((acc, val) => acc.concat(val), []);
  const totalRevenue = allOpportunities.filter(op => op.stage === 'Won').reduce((sum, op) => sum + op.value, 0);
  
  // Calcolo dinamico basato sui contatti totali, non solo sui lead.
  // Per una metrica più precisa, potremmo filtrare i contatti creati di recente.
  // Per ora, mostriamo il totale dei contatti.
  const totalContactsCount = contacts?.length || 0;

  const dealsWon = opportunities[PipelineStage.Won]?.length || 0;
  const conversionRate = allOpportunities.length > 0 ? ((dealsWon / allOpportunities.length) * 100).toFixed(1) : 0;

  // Dati per il grafico a barre della pipeline
  const pipelineData = Object.values(PipelineStage).map(stage => ({
    name: stage,
    // FIX: Correctly access the length of the array for each stage, handling cases where a stage might have no opportunities.
    Opportunità: opportunities[stage]?.length || 0,
  }));
  
  // Dati mock per il grafico a torta (da sostituire con dati reali quando disponibili)
  const leadSourceData = [
      { name: 'Sito Web', value: 400 },
      { name: 'Referral', value: 300 },
      { name: 'Social Media', value: 250 },
      { name: 'Eventi', value: 180 },
  ];
  const COLORS = ['#4f46e5', '#34d399', '#f59e0b', '#ec4899'];


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card title="Fatturato Totale" value={`€${totalRevenue.toLocaleString('it-IT')}`} icon={<DollarSignIcon className="w-8 h-8 text-white" />} color="bg-blue-500" />
        <Card title="Contatti Totali" value={totalContactsCount.toString()} icon={<UsersIcon className="w-8 h-8 text-white" />} color="bg-green-500" />
        <Card title="Affari Vinti" value={dealsWon.toString()} icon={<CheckCircleIcon className="w-8 h-8 text-white" />} color="bg-yellow-500" />
        <Card title="Tasso di Conversione" value={`${conversionRate}%`} icon={<TrendingUpIcon className="w-8 h-8 text-white" />} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Panoramica Pipeline</h2>
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
        <div className="bg-card p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Fonti dei Lead</h2>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={leadSourceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        // FIX: Explicitly cast the label props to `any` to resolve a TypeScript
                        // type inference issue with the `recharts` library. The library correctly
                        // provides the `percent` property at runtime, but the type definition
                        // seems to be incomplete, causing a compile-time error.
                        label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                        {leadSourceData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};