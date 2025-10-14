import React, { useState, useEffect, useCallback } from 'react';
import { Deal, PipelineStage, dealsService } from '../services/dealsService';
import PipelineBoard from '../components/deals/PipelineBoard';
import DealModal from '../components/deals/DealModal';

export default function DealsPage() {
  // State
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get organization ID from your auth/context system
  // For now we'll use a placeholder - you'll need to integrate this with your auth system
  const organizationId = 'your-organization-id';

  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Load stages first as they're needed for the pipeline
      const stagesData = await dealsService.fetchStages(organizationId);
      setStages(stagesData);
      
      // If no stages exist, create default ones
      if (stagesData.length === 0) {
        await createDefaultStages();
      }
      
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const createDefaultStages = async () => {
    const defaultStages = [
      { name: 'Qualificazione', color: '#3B82F6', order: 0 },
      { name: 'Proposta', color: '#8B5CF6', order: 1 },
      { name: 'Negoziazione', color: '#F59E0B', order: 2 },
      { name: 'Chiuso Vinto', color: '#10B981', order: 3 },
      { name: 'Chiuso Perso', color: '#EF4444', order: 4 }
    ];

    try {
      for (const stage of defaultStages) {
        await dealsService.createStage({
          ...stage,
          organization_id: organizationId
        });
      }
      
      // Reload stages after creation
      const stagesData = await dealsService.fetchStages(organizationId);
      setStages(stagesData);
    } catch (error) {
      console.error('Error creating default stages:', error);
    }
  };

  const handleDealClick = (deal: Deal) => {
    setSelectedDeal(deal);
    setIsModalOpen(true);
  };

  const handleAddDeal = (_stageId?: string) => {
    setSelectedDeal(null);
    setIsModalOpen(true);
  };

  const handleSaveDeal = async (dealData: Partial<Deal>) => {
    try {
      if (selectedDeal) {
        // Update existing deal
        await dealsService.updateDeal(selectedDeal.id, dealData);
      } else {
        // Create new deal
        await dealsService.createDeal({
          ...dealData,
          organization_id: organizationId
        } as Deal);
      }
      
      // The PipelineBoard component will handle reloading its data
      // through its own useEffect when deals change
      
    } catch (error) {
      console.error('Error saving deal:', error);
      throw error; // Re-throw so the modal can handle the error
    }
  };

  const handleEditStage = (stage: PipelineStage) => {
    // TODO: Implement stage editing modal
    console.log('Edit stage:', stage);
  };

  const handleStageSettings = () => {
    // TODO: Implement stage management interface
    console.log('Open stage settings');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDeal(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Caricamento deals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Deals Pipeline
            </h1>
            <p className="text-gray-600 mt-1">
              Gestisci la tua pipeline di vendite con la vista Kanban
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleAddDeal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuovo Deal
            </button>
          </div>
        </div>
      </div>

      {/* Pipeline Board */}
      <div className="flex-1 p-6 overflow-hidden">
        <PipelineBoard
          organizationId={organizationId}
          onDealClick={handleDealClick}
          onAddDeal={handleAddDeal}
          onEditStage={handleEditStage}
          onStageSettings={handleStageSettings}
          className="h-full"
        />
      </div>

      {/* Deal Modal */}
      <DealModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSaveDeal}
        deal={selectedDeal}
        stages={stages}
        organizationId={organizationId}
      />
    </div>
  );
}