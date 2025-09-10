import React from 'react';
import { Card } from './ui/Card';
import { Opportunity, Contact, PipelineStage } from '../types';
import { DollarSignIcon, UsersIcon, CheckCircleIcon, TrendingUpIcon } from './ui/icons';

interface DashboardProps {
  opportunities: Record<PipelineStage, Opportunity[]>;
  contacts: Contact[];
}

export const Dashboard: React.FC<DashboardProps> = ({ opportunities, contacts }) => {
  // FIX: Replaced .flat() with a more robust method (reduce) to avoid type inference issues that caused the array to be typed as `unknown[]`.
  const allOpportunities: Opportunity[] = Object.values(opportunities).reduce((acc, val) => acc.concat(val), []);
  const totalRevenue = allOpportunities.filter(op => op.stage === 'Won').reduce((sum, op) => sum + op.value, 0);
  
  // Calcolo dinamico basato sui contatti totali, non solo sui lead.
  // Per una metrica più precisa, potremmo filtrare i contatti creati di recente.
  // Per ora, mostriamo il totale dei contatti.
  const totalContactsCount = contacts?.length || 0;

  const dealsWon = opportunities[PipelineStage.Won]?.length || 0;
  const conversionRate = allOpportunities.length > 0 ? ((dealsWon / allOpportunities.length) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card title="Fatturato Totale" value={`€${totalRevenue.toLocaleString('it-IT')}`} icon={<DollarSignIcon className="w-8 h-8 text-white" />} color="bg-blue-500" />
        <Card title="Contatti Totali" value={totalContactsCount.toString()} icon={<UsersIcon className="w-8 h-8 text-white" />} color="bg-green-500" />
        <Card title="Affari Vinti" value={dealsWon.toString()} icon={<CheckCircleIcon className="w-8 h-8 text-white" />} color="bg-yellow-500" />
        <Card title="Tasso di Conversione" value={`${conversionRate}%`} icon={<TrendingUpIcon className="w-8 h-8 text-white" />} color="bg-purple-500" />
      </div>

      {/* SEZIONE GRAFICI TEMPORANEAMENTE DISABILITATA PER DIAGNOSI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-lg shadow animate-pulse">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Diagnosi in corso...</h2>
          <div className="space-y-3">
             <p className="text-gray-600">I grafici sono stati temporaneamente disabilitati per risolvere il problema di caricamento (pagina bianca).</p>
             <p className="text-gray-600">Se l'applicazione è ora visibile, significa che la causa del problema è la libreria dei grafici.</p>
          </div>
        </div>
        <div className="bg-card p-6 rounded-lg shadow hidden lg:block animate-pulse">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Prossimi Passi</h2>
           <p className="text-gray-600">Una volta confermata la causa, procederemo con la correzione definitiva.</p>
        </div>
      </div>
    </div>
  );
};