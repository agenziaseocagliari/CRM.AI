import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useOutletContext } from 'react-router-dom';

import { useCrmData } from '../hooks/useCrmData';
import { supabase } from '../lib/supabaseClient';
import { OpportunitiesData, Opportunity, PipelineStage } from '../types';

export const ReportsTest: React.FC = () => {
  console.log('🔄 REPORTS TEST: Component is rendering');
  
  // Use EXACT same pattern as Opportunities.tsx - Get context data safely
  const contextData = useOutletContext<ReturnType<typeof useCrmData>>();
  const { opportunities: initialData, contacts, organization, refetch: refetchData } = contextData || {};
  
  console.log('📊 REPORTS TEST: Context data received:', { 
    initialData, 
    contacts: contacts?.length || 0, 
    organization: organization?.name || 'none',
    initialDataKeys: initialData ? Object.keys(initialData) : 'none'
  });
  
  // Use same state management as Opportunities
  const [boardData, setBoardData] = useState<OpportunitiesData>(initialData || {});
  console.log('📋 REPORTS TEST: Current boardData state:', boardData);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use EXACT same useEffect pattern as Opportunities
  useEffect(() => {
    console.log('🔄 REPORTS TEST: initialData changed, updating boardData:', initialData);
    if (initialData) {
      setBoardData(initialData);
    }
  }, [initialData]);

  // Calculate totals using same logic as working components
  const allOpportunities: Opportunity[] = Object.keys(boardData).reduce<Opportunity[]>(
    (acc, key) => acc.concat(boardData[key as PipelineStage] || []),
    [],
  );
  
  const totalRevenue = allOpportunities.reduce((sum, op) => sum + (op.value || 0), 0);
  const totalCount = allOpportunities.length;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Reports Test - Using Opportunities Pattern</h1>
      
      {loading && <div className="text-blue-600">Loading...</div>}
      {error && <div className="text-red-600">Error: {error}</div>}
      
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-4">Debug Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>Organization: {organization?.name || 'None'}</div>
          <div>Contacts Count: {contacts?.length || 0}</div>
          <div>Initial Data Keys: {initialData ? Object.keys(initialData).join(', ') : 'None'}</div>
          <div>Board Data Keys: {Object.keys(boardData).join(', ')}</div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Opportunities Found: {totalCount}</h2>
        <div className="text-2xl font-bold text-green-600 mb-6">
          Total Revenue: €{totalRevenue.toLocaleString()}
        </div>
        
        {totalCount === 0 ? (
          <div className="text-gray-500">No opportunities found in context</div>
        ) : (
          <div>
            {Object.entries(PipelineStage).map(([key, stage]) => {
              const stageOpps = boardData[stage] || [];
              const stageValue = stageOpps.reduce((sum, op) => sum + (op.value || 0), 0);
              
              return (
                <div key={stage} className="border-b py-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">{stage}</span>
                    <span className="text-gray-600">{stageOpps.length} deals - €{stageValue.toLocaleString()}</span>
                  </div>
                  {stageOpps.map(opp => (
                    <div key={opp.id} className="ml-4 text-sm text-gray-700 border-l-2 border-gray-200 pl-3 mb-1">
                      {opp.contact_name} - €{opp.value?.toLocaleString()} - {opp.stage}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};