import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { CheckSquare, Calendar, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface BulkRenewalActionsProps {
  selectedPolicies: string[];
  onRenewalComplete: () => void;
  onClearSelection: () => void;
}

export function BulkRenewalActions({ 
  selectedPolicies, 
  onRenewalComplete, 
  onClearSelection 
}: BulkRenewalActionsProps) {
  const [renewalMonths, setRenewalMonths] = useState<number>(12);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);

  async function handleBulkRenewal() {
    if (selectedPolicies.length === 0) return;

    setProcessing(true);
    setResult(null);

    try {
      // Fetch current end dates
      const { data: policies, error: fetchError } = await supabase
        .from('insurance_policies')
        .select('id, end_date')
        .in('id', selectedPolicies);

      if (fetchError) throw fetchError;

      // Calculate new end dates
      const updates = policies!.map(policy => {
        const currentEnd = new Date(policy.end_date);
        const newEnd = new Date(currentEnd);
        newEnd.setMonth(newEnd.getMonth() + renewalMonths);

        return {
          id: policy.id,
          end_date: newEnd.toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        };
      });

      // Batch update in single transaction
      let successCount = 0;
      let failCount = 0;

      for (const update of updates) {
        const { error } = await supabase
          .from('insurance_policies')
          .update({
            end_date: update.end_date,
            updated_at: update.updated_at,
          })
          .eq('id', update.id);

        if (error) {
          console.error(`Failed to renew policy ${update.id}:`, error);
          failCount++;
        } else {
          successCount++;
        }
      }

      setResult({ success: successCount, failed: failCount });

      // Trigger callback to refresh calendar
      if (successCount > 0) {
        setTimeout(() => {
          onRenewalComplete();
          onClearSelection();
        }, 2000);
      }

    } catch (error) {
      console.error('Bulk renewal error:', error);
      setResult({ success: 0, failed: selectedPolicies.length });
    } finally {
      setProcessing(false);
    }
  }

  if (selectedPolicies.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-4 rounded-r-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <CheckSquare className="h-5 w-5 text-blue-600 mr-2" />
          <span className="font-medium text-blue-900">
            {selectedPolicies.length} {selectedPolicies.length === 1 ? 'polizza selezionata' : 'polizze selezionate'}
          </span>
        </div>

        <button
          onClick={onClearSelection}
          className="text-sm text-blue-700 hover:text-blue-900 underline"
        >
          Deseleziona tutto
        </button>
      </div>

      {/* Renewal Configuration */}
      <div className="mt-4 flex items-center gap-4">
        <label className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-600" />
          <span className="text-sm text-gray-700">Rinnova per:</span>
          <select
            value={renewalMonths}
            onChange={(e) => setRenewalMonths(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={6}>6 mesi</option>
            <option value={12}>12 mesi</option>
            <option value={24}>24 mesi</option>
            <option value={36}>36 mesi</option>
          </select>
        </label>

        <button
          onClick={handleBulkRenewal}
          disabled={processing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Elaborazione...
            </>
          ) : (
            <>
              <Calendar className="h-4 w-4" />
              Rinnova Selezionate
            </>
          )}
        </button>
      </div>

      {/* Result Message */}
      {result && (
        <div className={`mt-4 p-3 rounded-lg flex items-center ${
          result.failed === 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {result.failed === 0 ? (
            <>
              <CheckCircle2 className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">
                ✅ {result.success} {result.success === 1 ? 'polizza rinnovata' : 'polizze rinnovate'} con successo!
              </span>
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">
                ⚠️ {result.success} rinnovate, {result.failed} fallite. Verifica i log.
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
