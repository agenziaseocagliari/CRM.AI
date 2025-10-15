'use client';

interface DealFunnelStage {
  stage: string;
  count: number;
  total_value: number;
  avg_time_in_stage: number; // days
}

interface DealFunnelChartProps {
  data: DealFunnelStage[];
  isLoading?: boolean;
}

export default function DealFunnelChart({ data, isLoading = false }: DealFunnelChartProps) {
  // Calculate conversion rates between stages
  const processedData = data.map((stage, index) => {
    const previousStage = index > 0 ? data[index - 1] : null;
    const conversionRate = previousStage 
      ? (stage.count / previousStage.count) * 100 
      : 100;
    
    return {
      ...stage,
      conversionRate,
      percentage: (stage.count / data[0]?.count || 1) * 100
    };
  });

  const maxCount = Math.max(...data.map(stage => stage.count));
  const totalValue = data.reduce((sum, stage) => sum + stage.total_value, 0);

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 h-96">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Pipeline Data</h3>
          <p className="text-gray-500">There's no deal funnel data available.</p>
        </div>
      </div>
    );
  }

  const stageColors = [
    'bg-blue-100 border-blue-300 text-blue-800',      // New Lead
    'bg-green-100 border-green-300 text-green-800',   // Contacted
    'bg-yellow-100 border-yellow-300 text-yellow-800', // Qualified
    'bg-purple-100 border-purple-300 text-purple-800', // Proposal
    'bg-red-100 border-red-300 text-red-800',         // Negotiation
    'bg-emerald-100 border-emerald-300 text-emerald-800', // Won
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Deal Funnel</h3>
        <div className="text-right">
          <div className="text-sm text-gray-500">Total Pipeline Value</div>
          <div className="text-xl font-bold text-gray-900">€{totalValue.toLocaleString()}</div>
        </div>
      </div>

      {/* Funnel Visualization */}
      <div className="space-y-4">
        {processedData.map((stage, index) => {
          const widthPercentage = (stage.count / maxCount) * 100;
          const colorClass = stageColors[index % stageColors.length];
          
          return (
            <div key={index} className="relative">
              {/* Stage Container */}
              <div className="flex items-center space-x-4">
                {/* Stage Bar */}
                <div className="flex-1 relative">
                  <div className="h-16 bg-gray-100 rounded-lg overflow-hidden relative">
                    <div 
                      className={`h-full ${colorClass} rounded-lg border-2 transition-all duration-500 ease-out flex items-center justify-between px-4`}
                      style={{ width: `${Math.max(widthPercentage, 20)}%` }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="font-semibold text-lg">{stage.count}</div>
                        <div className="text-sm opacity-80">{stage.stage}</div>
                      </div>
                      <div className="text-right text-sm opacity-80">
                        <div>€{stage.total_value.toLocaleString()}</div>
                        <div>{stage.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stage Statistics */}
                <div className="w-40 text-right text-sm">
                  <div className="font-medium text-gray-900">{stage.count} deals</div>
                  <div className="text-gray-500">
                    {stage.avg_time_in_stage.toFixed(0)} days avg
                  </div>
                  <div className="text-gray-500">
                    €{(stage.total_value / Math.max(stage.count, 1)).toLocaleString()} avg
                  </div>
                </div>
              </div>

              {/* Conversion Arrow and Rate */}
              {index < processedData.length - 1 && (
                <div className="flex items-center justify-center my-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-0.5 bg-gray-300"></div>
                    <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-400"></div>
                    <div className="w-8 h-0.5 bg-gray-300"></div>
                  </div>
                  <div className="ml-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      processedData[index + 1].conversionRate >= 70 
                        ? 'bg-green-100 text-green-800'
                        : processedData[index + 1].conversionRate >= 40
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {processedData[index + 1].conversionRate.toFixed(1)}% conversion
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Funnel Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{data[0]?.count || 0}</div>
            <div className="text-sm text-gray-500">Total Leads</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {data[data.length - 1]?.count || 0}
            </div>
            <div className="text-sm text-gray-500">Deals Won</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {data.length > 0 ? ((data[data.length - 1]?.count / data[0]?.count) * 100).toFixed(1) : 0}%
            </div>
            <div className="text-sm text-gray-500">Overall Conversion</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {data.reduce((sum, stage) => sum + stage.avg_time_in_stage, 0).toFixed(0)}
            </div>
            <div className="text-sm text-gray-500">Avg Cycle (days)</div>
          </div>
        </div>
      </div>

      {/* Bottleneck Analysis */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-3">Bottleneck Analysis</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {processedData.map((stage, index) => {
            if (index === 0) return null; // Skip first stage
            
            const isBottleneck = stage.conversionRate < 50;
            const isGood = stage.conversionRate >= 70;
            
            return (
              <div key={index} className={`p-3 rounded-lg border ${
                isBottleneck 
                  ? 'bg-red-50 border-red-200' 
                  : isGood
                  ? 'bg-green-50 border-green-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{stage.stage}</span>
                  <span className={`text-sm ${
                    isBottleneck 
                      ? 'text-red-600' 
                      : isGood
                      ? 'text-green-600'
                      : 'text-yellow-600'
                  }`}>
                    {stage.conversionRate.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {isBottleneck && '⚠️ Low conversion - needs attention'}
                  {isGood && '✅ Good conversion rate'}
                  {!isBottleneck && !isGood && '⚡ Moderate conversion'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}