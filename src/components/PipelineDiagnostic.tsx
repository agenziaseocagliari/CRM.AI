// PRODUCTION DIAGNOSTIC COMPONENT
// Add this temporarily to Opportunities.tsx to capture exact issue

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const PipelineDiagnostic: React.FC = () => {
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostic = async () => {
    setIsRunning(true);
    const results: any = {};
    
    try {
      // Test 1: Check authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      results.session = {
        hasUser: !!session?.user,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        error: sessionError?.message
      };

      if (session?.user) {
        // Test 2: Check profile/organization
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', session.user.id)
          .single();

        results.profile = {
          hasProfile: !!profile,
          organizationId: profile?.organization_id,
          error: profileError?.message
        };

        if (profile?.organization_id) {
          // Test 3: Check opportunities query
          const { data: opportunities, error: oppError } = await supabase
            .from('opportunities')
            .select('*')
            .eq('organization_id', profile.organization_id);

          results.opportunities = {
            count: opportunities?.length || 0,
            data: opportunities,
            error: oppError?.message
          };

          // Test 4: Check all opportunities (no org filter)
          const { data: allOpps, error: allOppsError } = await supabase
            .from('opportunities')
            .select('*')
            .limit(10);

          results.allOpportunities = {
            count: allOpps?.length || 0,
            data: allOpps,
            error: allOppsError?.message
          };

          // Test 5: Check organization exists
          const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', profile.organization_id)
            .single();

          results.organization = {
            exists: !!org,
            name: org?.name,
            error: orgError?.message
          };
        }
      }

      setDiagnosticData(results);
    } catch (error) {
      results.criticalError = error instanceof Error ? error.message : 'Unknown error';
      setDiagnosticData(results);
    }
    
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostic();
  }, []);

  if (!diagnosticData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 m-4">
        <h3 className="font-bold text-yellow-800">🔧 Pipeline Diagnostic Running...</h3>
        <p className="text-yellow-700">Analyzing pipeline data flow...</p>
      </div>
    );
  }

  const hasIssues = 
    !diagnosticData.session?.hasUser ||
    !diagnosticData.profile?.hasProfile ||
    diagnosticData.opportunities?.count === 0;

  return (
    <div className={`border rounded-lg p-4 m-4 ${hasIssues ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
      <h3 className={`font-bold ${hasIssues ? 'text-red-800' : 'text-green-800'}`}>
        🔧 Pipeline Diagnostic Results
      </h3>
      
      <div className="mt-4 space-y-3 text-sm">
        <div className={`p-2 rounded ${diagnosticData.session?.hasUser ? 'bg-green-100' : 'bg-red-100'}`}>
          <strong>1. Authentication:</strong> {diagnosticData.session?.hasUser ? '✅ User logged in' : '❌ No user session'}
          {diagnosticData.session?.userEmail && <div>Email: {diagnosticData.session.userEmail}</div>}
          {diagnosticData.session?.error && <div className="text-red-600">Error: {diagnosticData.session.error}</div>}
        </div>

        <div className={`p-2 rounded ${diagnosticData.profile?.hasProfile ? 'bg-green-100' : 'bg-red-100'}`}>
          <strong>2. Profile/Organization:</strong> {diagnosticData.profile?.hasProfile ? '✅ Profile found' : '❌ No profile'}
          {diagnosticData.profile?.organizationId && <div>Org ID: {diagnosticData.profile.organizationId}</div>}
          {diagnosticData.profile?.error && <div className="text-red-600">Error: {diagnosticData.profile.error}</div>}
        </div>

        <div className={`p-2 rounded ${diagnosticData.organization?.exists ? 'bg-green-100' : 'bg-red-100'}`}>
          <strong>3. Organization:</strong> {diagnosticData.organization?.exists ? '✅ Organization found' : '❌ Organization missing'}
          {diagnosticData.organization?.name && <div>Name: {diagnosticData.organization.name}</div>}
          {diagnosticData.organization?.error && <div className="text-red-600">Error: {diagnosticData.organization.error}</div>}
        </div>

        <div className={`p-2 rounded ${(diagnosticData.opportunities?.count || 0) > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
          <strong>4. User's Opportunities:</strong> {diagnosticData.opportunities?.count || 0} found
          {diagnosticData.opportunities?.error && <div className="text-red-600">Error: {diagnosticData.opportunities.error}</div>}
          {diagnosticData.opportunities?.data && diagnosticData.opportunities.data.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer">View opportunities data</summary>
              <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                {JSON.stringify(diagnosticData.opportunities.data, null, 2)}
              </pre>
            </details>
          )}
        </div>

        <div className={`p-2 rounded ${(diagnosticData.allOpportunities?.count || 0) > 0 ? 'bg-green-100' : 'bg-yellow-100'}`}>
          <strong>5. All Opportunities (system-wide):</strong> {diagnosticData.allOpportunities?.count || 0} found
          {diagnosticData.allOpportunities?.error && <div className="text-red-600">Error: {diagnosticData.allOpportunities.error}</div>}
          {diagnosticData.allOpportunities?.data && diagnosticData.allOpportunities.data.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer">View all opportunities</summary>
              <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                {JSON.stringify(diagnosticData.allOpportunities.data, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>

      {diagnosticData.criticalError && (
        <div className="mt-4 p-2 bg-red-100 border border-red-300 rounded">
          <strong className="text-red-800">Critical Error:</strong>
          <div className="text-red-700">{diagnosticData.criticalError}</div>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button 
          onClick={runDiagnostic} 
          disabled={isRunning}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isRunning ? 'Running...' : 'Re-run Diagnostic'}
        </button>
        
        <button 
          onClick={() => {
            const dataStr = JSON.stringify(diagnosticData, null, 2);
            navigator.clipboard.writeText(dataStr);
            alert('Diagnostic data copied to clipboard!');
          }}
          className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
        >
          Copy Results
        </button>
      </div>
    </div>
  );
};