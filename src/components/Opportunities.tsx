import React, { useCallback, useEffect, useState } from 'react';
// FIX: Corrected the import for useOutletContext from 'react-router-dom' to resolve module export errors.
import toast from 'react-hot-toast';
import { useLocation, useOutletContext } from 'react-router-dom';

import { useCrmData } from '../hooks/useCrmData';
import { supabase } from '../lib/supabaseClient';
import { OpportunitiesData, Opportunity, PipelineStage } from '../types';
import { UniversalAIChat } from './ai/UniversalAIChat';
// Pipeline diagnostic removed for production

import { EditIcon, PlusIcon, TrashIcon } from './ui/icons';
import { Modal } from './ui/Modal';



import { diagnosticLogger } from '../lib/mockDiagnosticLogger';

// Error interface for proper typing
interface ApiError {
    message: string;
    status?: number;
    code?: string;
}

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

const KanbanCard: React.FC<{ 
  opportunity: Opportunity;
  onEdit: (opportunity: Opportunity) => void;
  onDelete: (opportunity: Opportunity) => void;
}> = ({ opportunity, onEdit, onDelete }) => {
  const onDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('opportunityId', opportunity.id.toString());
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="bg-white p-4 mb-3 rounded-lg shadow cursor-grab active:cursor-grabbing border-l-4 border-primary relative group"
    >
      <p className="font-semibold text-gray-800">{opportunity.contact_name}</p>
      <p className="text-sm text-gray-600">€{opportunity.value.toLocaleString('it-IT')}</p>
      <p className="text-xs text-gray-400 mt-2">Assegnato a: {opportunity.assigned_to}</p>
      <p className="text-xs text-gray-500 mt-1">Scadenza: {new Date(opportunity.close_date).toLocaleDateString('it-IT')}</p>
      
      <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/50 backdrop-blur-sm rounded">
        <button onClick={() => onEdit(opportunity)} title="Modifica" className="p-1 hover:bg-gray-200 rounded">
            <EditIcon className="w-4 h-4 text-gray-600" />
        </button>
        <button onClick={() => onDelete(opportunity)} title="Elimina" className="p-1 hover:bg-gray-200 rounded">
            <TrashIcon className="w-4 h-4 text-red-500" />
        </button>
      </div>
    </div>
  );
};

const KanbanColumn: React.FC<{
  stage: PipelineStage;
  opportunities: Opportunity[];
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onEdit: (opportunity: Opportunity) => void;
  onDelete: (opportunity: Opportunity) => void;
}> = ({ stage, opportunities, onDrop, onEdit, onDelete }) => {
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const totalValue = opportunities.reduce((sum, op) => sum + op.value, 0);

  return (
    <div
      onDragOver={onDragOver}
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
          <KanbanCard key={op.id} opportunity={op} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
};

// Definisce la struttura dei dati del form per maggiore sicurezza
type OpportunityFormData = Omit<Opportunity, 'id' | 'organization_id' | 'created_at'>;

// Stato iniziale completo e ben definito per il form
const initialFormState: OpportunityFormData = {
    contact_name: '',
    value: 0,
    assigned_to: '',
    close_date: new Date().toISOString().split('T')[0],
    stage: PipelineStage.NewLead, // Imposta uno stage predefinito
};

export const Opportunities: React.FC = () => {
  console.log('🔄 PIPELINE DEBUG: Opportunities component is rendering');
  
  // Get context data safely
  const contextData = useOutletContext<ReturnType<typeof useCrmData>>();
  const { opportunities: initialData, contacts, organization, refetch: refetchData } = contextData || {};
  const location = useLocation();
  console.log('📊 PIPELINE DEBUG: Context data received:', { 
    initialData, 
    contacts: contacts?.length || 0, 
    organization: organization?.name || 'none',
    initialDataKeys: initialData ? Object.keys(initialData) : 'none'
  });
  
  const [boardData, setBoardData] = useState<OpportunitiesData>(initialData || {});
  console.log('📋 PIPELINE DEBUG: Current boardData state:', boardData);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  
  // Stato del form fortemente tipizzato, senza 'as any'
  const [formData, setFormData] = useState<OpportunityFormData>(initialFormState);
  const [opportunityToModify, setOpportunityToModify] = useState<Opportunity | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);

  // ALL HOOKS FIRST - before any conditional returns
  useEffect(() => {
    console.log('🔄 PIPELINE DEBUG: initialData changed, updating boardData:', initialData);
    setBoardData(initialData || {});
  }, [initialData]);

  // Handler functions wrapped in useCallback
  const handleOpenAddModal = useCallback(() => {
    setModalMode('add');
    // Reimposta lo stato del form al suo stato iniziale pulito
    setFormData({
        ...initialFormState,
        contact_name: contacts?.[0]?.name || '' // Pre-seleziona il primo contatto
    });
    setIsModalOpen(true);
  }, [contacts]);

  const handleOpenEditModal = (opportunity: Opportunity) => {
    setModalMode('edit');
    setOpportunityToModify(opportunity);
    setFormData({
        contact_name: opportunity.contact_name,
        value: opportunity.value,
        assigned_to: opportunity.assigned_to,
        close_date: new Date(opportunity.close_date).toISOString().split('T')[0],
        stage: opportunity.stage,
    });
    setIsModalOpen(true);
  };
  
  const handleOpenDeleteModal = (opportunity: Opportunity) => {
    setOpportunityToModify(opportunity);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsModalOpen(false);
    setIsDeleteModalOpen(false);
    setOpportunityToModify(null);
  };

  // Handle navigation state from dashboard quick actions
  useEffect(() => {
    const state = location.state as { openAddModal?: boolean } | null;
    
    if (state?.openAddModal) {
      handleOpenAddModal();
      // Clear the state to prevent reopening on re-renders
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.state, location.pathname, handleOpenAddModal]);

  const onDrop = (targetStage: PipelineStage) => async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    const opportunityId = e.dataTransfer.getData('opportunityId');
    if (!opportunityId) {return;}

    const originalData: OpportunitiesData = JSON.parse(JSON.stringify(boardData));
    let foundOpportunity: Opportunity | undefined;
    let sourceStage: PipelineStage | undefined;

    for (const s of Object.keys(boardData) as PipelineStage[]) {
      const op = boardData[s].find(o => o.id === opportunityId);
      if (op) {
        foundOpportunity = op;
        sourceStage = s;
        break;
      }
    }
    
    if (!foundOpportunity || !sourceStage || sourceStage === targetStage) {return;}
    
    const newData: OpportunitiesData = JSON.parse(JSON.stringify(boardData));
    newData[sourceStage] = newData[sourceStage].filter(op => op.id !== opportunityId);
    const updatedOpportunity = { ...foundOpportunity, stage: targetStage };
    newData[targetStage] = [...newData[targetStage], updatedOpportunity];
    setBoardData(newData);

    try {
        const { error } = await supabase
            .from('opportunities')
            .update({ stage: targetStage })
            .eq('id', opportunityId);
        if (error) {throw error;}
        toast.success(`Opportunità spostata in "${targetStage}"`);
    } catch (err) {
        toast.error("Errore durante l'aggiornamento dell'Opportunità .");
        diagnosticLogger.error('api', "Errore durante l'aggiornamento dell'Opportunità :", err as ApiError);
        setBoardData(originalData); // Ripristina in caso di fallimento
    }
  };
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
        let successMessage = '';
        if (modalMode === 'edit' && opportunityToModify) {
            const { error } = await supabase.from('opportunities').update(formData).eq('id', opportunityToModify.id);
            if (error) {throw error;}
            successMessage = 'Opportunità  aggiornata con successo!';
        } else {
            console.log('🟢 PHASE2: Creating new opportunity in Opportunities component')
            if (!organization) {
                console.error('❌ No organization available')
                throw new Error("Informazioni sull'organizzazione non disponibili. Impossibile creare l'Opportunità.");
            }
            
            // Get current user for created_by field
            const { data: { user } } = await supabase.auth.getUser()
            
            const opportunityData = {
                ...formData,
                organization_id: organization.id,
                created_by: user?.id,
                status: 'open',
                source: 'manual'
            }
            
            console.log('💼 Creating opportunity with data:', opportunityData)
            
            // Use direct INSERT instead of RPC
            const { error } = await supabase
                .from('opportunities')
                .insert(opportunityData)
            
            if (error) {
                console.error('❌ Opportunity creation error:', error)
                throw error;
            }
            console.log('✅ Opportunity created successfully')
            successMessage = 'Opportunità creata con successo!';
        }
        refetchData();
        handleCloseModals();
        toast.success(successMessage);
    } catch (err: unknown) {
        const error = err as ApiError;
        toast.error(`Errore nel salvaggio: ${error.message}`);
    } finally {
        setIsSaving(false);
    }
  }

  const handleDelete = async () => {
    if (!opportunityToModify) {return;}
    setIsSaving(true);
    try {
        const { error } = await supabase.from('opportunities').delete().eq('id', opportunityToModify.id);
        if (error) {throw error;}
        refetchData();
        handleCloseModals();
        toast.success('Opportunità  eliminata!');
    } catch (err: unknown) {
        const error = err as ApiError;
        toast.error(`Errore: ${error.message}`);
    } finally {
        setIsSaving(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'value' ? parseFloat(value) || 0 : value }));
  };

  return (
    <>
      {/* Pipeline diagnostic removed for production */}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary">Pipeline Opportunità </h1>
        <button onClick={handleOpenAddModal} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2">
            <PlusIcon className="w-5 h-5" />
            <span>Aggiungi Opportunità </span>
        </button>
      </div>

      {/* AI Agents Panel - REMOVED: Too cluttered, replaced with integrated LeadScorer chat */}

      <div className="flex space-x-4 overflow-x-auto pb-4">
        {Object.values(PipelineStage).map(stage => {
          const stageOpportunities = boardData[stage] || [];
          console.log(`🎨 PIPELINE DEBUG: Rendering stage "${stage}" with ${stageOpportunities.length} opportunities:`, stageOpportunities);
          
          return (
            <KanbanColumn
                key={stage}
                stage={stage}
                opportunities={stageOpportunities}
                onDrop={onDrop(stage)}
                onEdit={handleOpenEditModal}
                onDelete={handleOpenDeleteModal}
            />
          );
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModals} title={modalMode === 'add' ? 'Crea Nuova Opportunità ' : 'Modifica Opportunità '}>
        <form onSubmit={handleSave} className="space-y-4">
            <div>
                <label htmlFor="contact_name" className="block text-sm font-medium text-gray-700">Contatto *</label>
                <select id="contact_name" name="contact_name" value={formData.contact_name} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                    <option value="" disabled>Seleziona un contatto</option>
                    {contacts.map(contact => (
                        <option key={contact.id} value={contact.name}>{contact.name}</option>
                    ))}
                </select>
            </div>
             <div>
                <label htmlFor="value" className="block text-sm font-medium text-gray-700">Valore (€)</label>
                <input type="number" id="value" name="value" value={formData.value} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
            </div>
             <div>
                <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700">Assegnato a</label>
                <input type="text" id="assigned_to" name="assigned_to" value={formData.assigned_to} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
            </div>
             <div>
                <label htmlFor="close_date" className="block text-sm font-medium text-gray-700">Data di Chiusura Prevista</label>
                <input type="date" id="close_date" name="close_date" value={formData.close_date} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
            </div>

            <div className="flex justify-end pt-4 border-t mt-4">
                 <button type="button" onClick={handleCloseModals} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 mr-2">Annulla</button>
                <button type="submit" disabled={isSaving} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400">{isSaving ? 'Salvataggio...' : 'Salva'}</button>
            </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={handleCloseModals} title="Conferma Eliminazione">
        <p>Sei sicuro di voler eliminare l&apos;Opportunità  per <strong>{opportunityToModify?.contact_name}</strong>? Questa azione è irreversibile.</p>
        <div className="flex justify-end pt-4 border-t mt-4">
              <button type="button" onClick={handleCloseModals} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 mr-2">Annulla</button>
              <button onClick={handleDelete} disabled={isSaving} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400">{isSaving ? 'Eliminazione...' : 'Elimina'}</button>
        </div>
      </Modal>

      {/* Universal AI Chat - Lead Scorer */}
      <UniversalAIChat
        currentModule="Opportunities"
        organizationId="demo-org"
        userId="demo-user"
        onActionTriggered={(action, data) => {
          console.log('Opportunities AI Action:', action, data);
          // Handle AI actions (lead scoring, opportunity analysis, etc.)
        }}
      />
    </>
  );
};


