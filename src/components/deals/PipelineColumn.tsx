import { useDroppable } from '@dnd-kit/core';
import { MoreVertical, Plus } from 'lucide-react';
import { Deal, PipelineStage } from '../../services/dealsService';
import DealCard from './DealCard';

interface PipelineColumnProps {
  stage: PipelineStage;
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
  onAddDeal?: (stageId: string) => void;
  onEditStage?: (stage: PipelineStage) => void;
  isDragOver?: boolean;
  isAnyDragging?: boolean;
}

export default function PipelineColumn({ 
  stage, 
  deals, 
  onDealClick, 
  onAddDeal,
  onEditStage,
  isDragOver = false,
  isAnyDragging = false
}: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  // Calculate column statistics
  const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
  const averageProbability = deals.length > 0 
    ? deals.reduce((sum, deal) => sum + deal.probability, 0) / deals.length 
    : 0;

  // Format currency
  const formatCurrency = (value: number, currency: string = 'EUR') => {
    if (value === 0) return '€0';
    
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: currency,
      notation: value >= 1000000 ? 'compact' : 'standard',
      minimumFractionDigits: 0,
      maximumFractionDigits: value >= 1000 ? 0 : 2,
    }).format(value);
  };

  return (
    <div className={`
      flex-shrink-0 w-72 sm:w-80 rounded-xl p-3 sm:p-4 h-fit max-h-[calc(100vh-200px)]
      transition-all duration-200 ease-in-out
      ${isDragOver 
        ? 'bg-blue-50 border-2 border-blue-300 shadow-lg scale-[1.02]' 
        : isAnyDragging 
          ? 'bg-gray-100 border-2 border-gray-200' 
          : 'bg-gray-50 border-2 border-transparent'
      }
    `}>
      {/* Column Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Stage color indicator */}
            <div 
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: stage.color }}
            />
            
            {/* Stage name and count */}
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                {stage.name}
              </h3>
              <p className="text-xs text-gray-500">
                {deals.length} {deals.length === 1 ? 'deal' : 'deals'}
              </p>
            </div>
          </div>

          {/* Column actions */}
          <div className="flex items-center gap-1">
            {/* Add deal button */}
            {onAddDeal && (
              <button
                onClick={() => onAddDeal(stage.id)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
                title="Aggiungi deal"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
            
            {/* Stage options */}
            {onEditStage && (
              <button
                onClick={() => onEditStage(stage)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
                title="Opzioni stage"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Column Statistics */}
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-gray-600 font-medium">Valore totale:</span>
            <span className="font-bold text-green-600">
              {formatCurrency(totalValue)}
            </span>
          </div>
          
          {deals.length > 0 && (
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-gray-600">Probabilità media:</span>
              <span className="font-medium text-blue-600">
                {Math.round(averageProbability)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={`
          min-h-[200px] space-y-3 overflow-y-auto
          transition-all duration-300 ease-in-out rounded-lg p-2
          ${isDragOver || isOver 
            ? 'bg-blue-100 border-2 border-blue-400 border-dashed shadow-inner' 
            : isAnyDragging
              ? 'bg-gray-100 border-2 border-gray-300 border-dashed'
              : 'border-2 border-transparent'
          }
        `}
      >
        {/* Deal Cards */}
        {deals.length > 0 ? (
          deals.map((deal) => (
            <div key={deal.id} className="group">
              <DealCard
                deal={deal}
                onClick={() => onDealClick(deal)}
              />
            </div>
          ))
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Plus className="w-8 h-8" />
            </div>
            <p className="text-sm text-center">
              Nessun deal in questo stage
            </p>
            {onAddDeal && (
              <button
                onClick={() => onAddDeal(stage.id)}
                className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Aggiungi il primo deal
              </button>
            )}
          </div>
        )}

        {/* Enhanced drop indicator */}
        {(isDragOver || isOver) && (
          <div className="flex items-center justify-center py-6">
            <div className="w-full bg-gradient-to-r from-transparent via-blue-400 to-transparent h-1 rounded-full animate-pulse" />
          </div>
        )}

        {/* Drag over message */}
        {isDragOver && deals.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
              Rilascia qui il deal
            </div>
          </div>
        )}
      </div>

      {/* Column Footer */}
      {deals.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Ultimo aggiornamento</span>
            <span>
              {deals.length > 0 
                ? new Date(Math.max(...deals.map(d => new Date(d.updated_at).getTime())))
                    .toLocaleDateString('it-IT', { 
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                : 'N/A'
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
}