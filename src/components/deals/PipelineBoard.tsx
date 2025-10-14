import React, { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { Plus, Settings, Filter, Search, BarChart3, TrendingUp } from 'lucide-react';
import { Deal, PipelineStage, dealsService } from '../../services/dealsService';
import PipelineColumn from './PipelineColumn';
import DealCard from './DealCard';

interface PipelineBoardProps {
  organizationId?: string;
  onDealClick: (deal: Deal) => void;
  onAddDeal?: (stageId?: string) => void;
  onEditStage?: (stage: PipelineStage) => void;
  onStageSettings?: () => void;
  className?: string;
}

export default function PipelineBoard({
  organizationId,
  onDealClick,
  onAddDeal,
  onEditStage,
  onStageSettings,
  className = ''
}: PipelineBoardProps) {
  // State
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [statistics, setStatistics] = useState({
    totalValue: 0,
    totalDeals: 0,
    averageProbability: 0,
    expectedRevenue: 0
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement before drag starts
      },
    })
  );

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load stages and deals
      const [stagesData, dealsData] = await Promise.all([
        dealsService.fetchStages(organizationId),
        dealsService.fetchDeals({ organizationId })
      ]);

      setStages(stagesData);
      setDeals(dealsData);
    } catch (err) {
      console.error('Error loading pipeline data:', err);
      setError('Errore nel caricamento della pipeline. Riprova più tardi.');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  const updateStatistics = useCallback(() => {
    const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    const totalDeals = deals.length;
    const averageProbability = totalDeals > 0 
      ? deals.reduce((sum, deal) => sum + deal.probability, 0) / totalDeals 
      : 0;
    const expectedRevenue = deals.reduce((sum, deal) => 
      sum + ((deal.value || 0) * deal.probability / 100), 0
    );

    setStatistics({
      totalValue,
      totalDeals,
      averageProbability,
      expectedRevenue
    });
  }, [deals]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update statistics when deals change
  useEffect(() => {
    updateStatistics();
  }, [updateStatistics]);

  // Filter deals based on search and user
  const filteredDeals = deals.filter(deal => {
    const matchesSearch = !searchTerm || 
      deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.contact?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (deal.company && deal.company.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesUser = !selectedUserId || deal.assigned_to === selectedUserId;
    
    return matchesSearch && matchesUser;
  });

  // Group deals by stage
  const dealsByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = filteredDeals.filter(deal => deal.stage_id === stage.id);
    return acc;
  }, {} as Record<string, Deal[]>);

  const handleDragStart = (event: DragStartEvent) => {
    const deal = deals.find(d => d.id === event.active.id);
    setActiveDeal(deal || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);

    if (!over || active.id === over.id) return;

    const dealId = active.id as string;
    const newStageId = over.id as string;

    // Find the deal and current stage
    const deal = deals.find(d => d.id === dealId);
    const newStage = stages.find(s => s.id === newStageId);

    if (!deal || !newStage || deal.stage_id === newStageId) return;

    try {
      // Optimistically update UI
      const updatedDeals = deals.map(d => 
        d.id === dealId ? { ...d, stage_id: newStageId } : d
      );
      setDeals(updatedDeals);

      // Update in database
      await dealsService.moveDealToStage(dealId, newStageId);
      
      // Reload data to ensure consistency
      await loadData();
    } catch (error) {
      console.error('Error moving deal:', error);
      // Revert optimistic update on error
      await loadData();
      setError('Errore nello spostamento del deal. Riprova.');
    }
  };

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

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center min-h-[600px] ${className}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Caricamento pipeline...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-[600px] ${className}`}>
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Errore nel caricamento</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Pipeline Header */}
      <div className="mb-6 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        {/* Top Row: Title and Actions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Pipeline Vendite
            </h1>
            <p className="text-gray-600">
              Gestisci i tuoi deal e monitora il processo di vendita
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onAddDeal && (
              <button
                onClick={() => onAddDeal()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nuovo Deal
              </button>
            )}
            
            {onStageSettings && (
              <button
                onClick={onStageSettings}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Stage
              </button>
            )}
          </div>
        </div>

        {/* Statistics Row */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <BarChart3 className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-gray-600">Totale Deal</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{statistics.totalDeals}</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-sm font-medium text-gray-600">Valore Totale</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(statistics.totalValue)}
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <BarChart3 className="w-5 h-5 text-purple-600 mr-2" />
              <span className="text-sm font-medium text-gray-600">Probabilità Media</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {Math.round(statistics.averageProbability)}%
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5 text-orange-600 mr-2" />
              <span className="text-sm font-medium text-gray-600">Ricavi Attesi</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(statistics.expectedRevenue)}
            </p>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca deal, contatti, aziende..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tutti gli utenti</option>
              {/* We'll populate this with actual users later */}
            </select>
          </div>
        </div>
      </div>

      {/* Pipeline Board */}
      <div className="flex-1 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="h-full overflow-x-auto">
            <div className="flex gap-6 pb-6 min-w-fit">
              {stages.map((stage) => (
                <PipelineColumn
                  key={stage.id}
                  stage={stage}
                  deals={dealsByStage[stage.id] || []}
                  onDealClick={onDealClick}
                  onAddDeal={onAddDeal}
                  onEditStage={onEditStage}
                />
              ))}

              {/* Empty state when no stages */}
              {stages.length === 0 && (
                <div className="flex items-center justify-center w-full min-h-[400px]">
                  <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Nessuno stage configurato
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Configura gli stage della pipeline per iniziare a gestire i deal
                    </p>
                    {onStageSettings && (
                      <button
                        onClick={onStageSettings}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Configura Stage
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeDeal ? (
              <div className="rotate-6 shadow-2xl">
                <DealCard deal={activeDeal} onClick={() => {}} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}