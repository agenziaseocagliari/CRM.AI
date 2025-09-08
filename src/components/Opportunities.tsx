
import React, { useState, useEffect } from 'react';
import { Opportunity, PipelineStage, OpportunitiesData } from '../types';

const stageColors: Record<PipelineStage, string> = {
  [PipelineStage.NewLead]: 'bg-blue-100 border-blue-400',
  [PipelineStage.Contacted]: 'bg-yellow-100 border-yellow-400',
  [PipelineStage.ProposalSent]: 'bg-indigo-100 border-indigo-400',
  [PipelineStage.Won]: 'bg-green-100 border-green-400',
  [PipelineStage.Lost]: 'bg-red-100 border-red-400',
};

const stageTextColors: Record<PipelineStage, string> = {
    [PipelineStage.NewLead]: 'text-blue-800',
    [PipelineStage.Contacted]: 'text-yellow-800',
    [PipelineStage.ProposalSent]: 'text-indigo-800',
    [PipelineStage.Won]: 'text-green-800',
    [PipelineStage.Lost]: 'text-red-800',
};

const KanbanCard: React.FC<{ opportunity: Opportunity }> = ({ opportunity }) => {
  const onDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('opportunityId', opportunity.id.toString());
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="bg-white p-4 mb-3 rounded-lg shadow cursor-grab active:cursor-grabbing border-l-4 border-primary"
    >
      <p className="font-semibold text-gray-800">{opportunity.contactName}</p>
      <p className="text-sm text-gray-600">€{opportunity.value.toLocaleString('it-IT')}</p>
      <p className="text-xs text-gray-400 mt-2">Assegnato a: {opportunity.assignedTo}</p>
    </div>
  );
};

const KanbanColumn: React.FC<{
  stage: PipelineStage;
  opportunities: Opportunity[];
  // FIX: The onDrop prop should be a proper drag event handler.
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}> = ({ stage, opportunities, onDrop }) => {
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const totalValue = opportunities.reduce((sum, op) => sum + op.value, 0);

  return (
    <div
      onDragOver={onDragOver}
      // FIX: Pass the onDrop event handler directly.
      onDrop={onDrop}
      className="flex-1 bg-gray-100 rounded-lg p-3 min-w-[300px]"
    >
      <div className={`flex justify-between items-center p-2 mb-4 rounded-md ${stageColors[stage]}`}>
        <h3 className={`font-semibold text-lg ${stageTextColors[stage]}`}>{stage}</h3>
        <span className={`font-bold text-sm px-2 py-1 rounded-full ${stageColors[stage]} ${stageTextColors[stage]}`}>{opportunities.length}</span>
      </div>
      <div className='text-sm font-bold text-gray-500 mb-3 px-2'>
        €{totalValue.toLocaleString('it-IT')}
      </div>
      <div className="h-full">
        {opportunities.map((op) => (
          <KanbanCard key={op.id} opportunity={op} />
        ))}
      </div>
    </div>
  );
};

interface OpportunitiesProps {
  initialData: OpportunitiesData;
  setData: React.Dispatch<React.SetStateAction<Record<number, OpportunitiesData>>>;
}

export const Opportunities: React.FC<OpportunitiesProps> = ({ initialData, setData }) => {
  const [boardData, setBoardData] = useState<OpportunitiesData>(initialData);

  useEffect(() => {
    setBoardData(initialData);
  }, [initialData]);

  // FIX: Refactor onDrop handler for clarity and correctness.
  // The outer function takes the target stage, and the inner function is the event handler.
  const onDrop = (targetStage: PipelineStage) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    const opportunityId = parseInt(e.dataTransfer.getData('opportunityId'), 10);
    if (!opportunityId) return;

    let foundOpportunity: Opportunity | undefined;
    let sourceStage: PipelineStage | undefined;

    // Find the opportunity and its source stage
    for (const s of Object.keys(boardData) as PipelineStage[]) {
      const op = boardData[s].find(o => o.id === opportunityId);
      if (op) {
        foundOpportunity = op;
        sourceStage = s;
        break;
      }
    }
    
    if (!foundOpportunity || !sourceStage || sourceStage === targetStage) return;
    
    // Create new state
    const newData = { ...boardData };
    
    // Remove from source
    newData[sourceStage] = newData[sourceStage].filter(op => op.id !== opportunityId);
    
    // Add to target
    foundOpportunity.stage = targetStage;
    newData[targetStage] = [...newData[targetStage], foundOpportunity];
    
    setBoardData(newData);
    // Here you would also update the global state or call an API
    // For now, we are just updating local state for visual feedback.
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary mb-6">Pipeline Opportunità</h1>
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {Object.keys(PipelineStage).map(key => {
            const stage = PipelineStage[key as keyof typeof PipelineStage];
            return (
                <KanbanColumn
                    key={stage}
                    stage={stage}
                    opportunities={boardData[stage] || []}
                    onDrop={onDrop(stage)}
                />
            )
        })}
      </div>
    </div>
  );
};