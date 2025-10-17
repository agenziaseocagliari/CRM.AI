import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useCrmData } from '../../hooks/useCrmData';
import { EnhancedStatCard } from '../dashboard/EnhancedStatCard';
import { SessionHealthIndicator } from '../SessionHealthIndicator';
import {
    ChartBarIcon,
    DollarSignIcon,
    TrendingUpIcon,
    UsersIcon
} from '../ui/icons';

export default function StandardDashboard() {
  const { opportunities, contacts } = useOutletContext<ReturnType<typeof useCrmData>>();

  // Handle different data structures safely
  const opportunitiesArray = Array.isArray(opportunities) ? opportunities : [];
  const contactsArray = Array.isArray(contacts) ? contacts : [];

  // Calculate basic metrics
  const totalRevenue = opportunitiesArray.reduce((sum: number, opp: { value?: number }) => sum + (opp.value || 0), 0);
  const totalContacts = contactsArray.length;
  const totalOpportunities = opportunitiesArray.length;
  const avgDealSize = totalOpportunities > 0 ? totalRevenue / totalOpportunities : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Dashboard Standard</h1>
          <p className="text-gray-600 mt-1">CRM generico per PMI e professionisti</p>
        </div>
        <SessionHealthIndicator />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <EnhancedStatCard
          title="Ricavi Totali"
          value={`€${totalRevenue.toLocaleString()}`}
          icon={<DollarSignIcon className="w-6 h-6" />}
          trend={{ value: 0, label: "+0%", isPositive: true }}
          color="blue"
          subtitle="Ultimo aggiornamento"
        />
        <EnhancedStatCard
          title="Contatti"
          value={totalContacts.toString()}
          icon={<UsersIcon className="w-6 h-6" />}
          trend={{ value: 0, label: "+0%", isPositive: true }}
          color="green"
          subtitle="Totale nel CRM"
        />
        <EnhancedStatCard
          title="Opportunità"
          value={totalOpportunities.toString()}
          icon={<TrendingUpIcon className="w-6 h-6" />}
          trend={{ value: 0, label: "+0%", isPositive: true }}
          color="purple"
          subtitle="Pipeline attiva"
        />
        <EnhancedStatCard
          title="Deal Medio"
          value={`€${avgDealSize.toLocaleString()}`}
          icon={<ChartBarIcon className="w-6 h-6" />}
          trend={{ value: 0, label: "+0%", isPositive: true }}
          color="orange"
          subtitle="Dimensione media"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">📈 Pipeline Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-700">Opportunità Attive</span>
              <span className="font-semibold text-blue-600">{totalOpportunities}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-700">Valore Totale</span>
              <span className="font-semibold text-green-600">€{totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-700">Deal Medio</span>
              <span className="font-semibold text-purple-600">€{avgDealSize.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">📊 CRM Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-700">Contatti Totali</span>
              <span className="font-semibold text-blue-600">{totalContacts}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-700">Tasso Conversione</span>
              <span className="font-semibold text-green-600">
                {totalContacts > 0 ? ((totalOpportunities / totalContacts) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-gray-700">Ricavo per Contatto</span>
              <span className="font-semibold text-purple-600">
                €{totalContacts > 0 ? (totalRevenue / totalContacts).toLocaleString() : 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">🚀 CRM Standard</h3>
        <p className="text-blue-700">
          Stai utilizzando la versione standard del CRM, perfetta per PMI e professionisti. 
          Accedi a contatti, pipeline, calendario, automazioni e reports.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Contatti</span>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Pipeline</span>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Calendario</span>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Automazioni</span>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Reports</span>
        </div>
      </div>
    </div>
  );
}