import React, { useState, useEffect } from 'react';
import { Opportunity, PipelineStage, OpportunitiesData, Contact } from '../types';
import { supabase } from '../lib/supabaseClient';
import { Modal } from './ui/Modal';
import { PlusIcon, EditIcon, TrashIcon } from './ui/icons';

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

interface OpportunitiesProps {
  initialData: OpportunitiesData;
  contacts: Contact[];
  refetchData: () => void;
}

const initialFormState = {
    contact_name: '',
    value: 0,
    assigned_to: '',
    close_date: new Date().toISOString().split('T')[0],
};

export const Opportunities: React.FC<OpportunitiesProps> = ({ initialData, contacts, refetchData }) => {
  const [boardData, setBoardData] = useState<OpportunitiesData>(initialData);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  
  // Form and data states
  const [formData, setFormData] = useState<Omit<Opportunity, 'id' | 'organization_id' | 'created_at'>>(initialFormState as any);
  const [opportunityToModify, setOpportunityToModify] = useState<Opportunity | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    setBoardData(initialData);
  }, [initialData]);

  const handleOpenAddModal = () => {
    setModalMode('add');
    setFormData({
        ...initialFormState,
        stage: PipelineStage.NewLead,
        contact_name: contacts?.[0]?.name || '' // Pre-select first contact if available
    });
    setSaveError('');
    setIsModalOpen(true);
  };

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
    setSaveError('');
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

  const onDrop = (targetStage: PipelineStage) => async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    const opportunityId = e.dataTransfer.getData('opportunityId');
    if (!opportunityId) return;

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
    
    if (!foundOpportunity || !sourceStage || sourceStage === targetStage) return;
    
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
        if (error) throw error;
    } catch (err) {
        console.error("Errore durante l'aggiornamento dell'opportunità:", err);
        setBoardData(originalData); // Revert on failure
    }
  };
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError('');

    try {
        if (modalMode === 'edit' && opportunityToModify) {
            const { error } = await supabase.from('opportunities').update(formData).eq('id', opportunityToModify.id);
            if (error) throw error;
        } else {
            const { error } = await supabase.from('opportunities').insert(formData);
            if (error) throw error;
        }
        refetchData();
        handleCloseModals();
    } catch (err: any) {
        setSaveError(`Errore nel salvataggio: ${err.message}`);
    } finally {
        setIsSaving(false);
    }
  }

  const handleDelete = async () => {
    if (!opportunityToModify) return;
    setIsSaving(true);
    try {
        const { error } = await supabase.from('opportunities').delete().eq('id', opportunityToModify.id);
        if (error) throw error;
        refetchData();
        handleCloseModals();
    } catch (err: any) {
        alert(`Errore: ${err.message}`); // Simple alert for delete error
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary">Pipeline Opportunità</h1>
        <button onClick={handleOpenAddModal} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2">
            <PlusIcon className="w-5 h-5" />
            <span>Aggiungi Opportunità</span>
        </button>
      </div>
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {Object.values(PipelineStage).map(stage => (
            <KanbanColumn
                key={stage}
                stage={stage}
                opportunities={boardData[stage] || []}
                onDrop={onDrop(stage)}
                onEdit={handleOpenEditModal}
                onDelete={handleOpenDeleteModal}
            />
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModals} title={modalMode === 'add' ? 'Crea Nuova Opportunità' : 'Modifica Opportunità'}>
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

            {saveError && <p className="text-red-500 text-sm">{saveError}</p>}
            <div className="flex justify-end pt-4 border-t mt-4">
                 <button type="button" onClick={handleCloseModals} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 mr-2">Annulla</button>
                <button type="submit" disabled={isSaving} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400">{isSaving ? 'Salvataggio...' : 'Salva'}</button>
            </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={handleCloseModals} title="Conferma Eliminazione">
        <p>Sei sicuro di voler eliminare l'opportunità per <strong>{opportunityToModify?.contact_name}</strong>? Questa azione è irreversibile.</p>
        <div className="flex justify-end pt-4 border-t mt-4">
              <button type="button" onClick={handleCloseModals} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 mr-2">Annulla</button>
              <button onClick={handleDelete} disabled={isSaving} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400">{isSaving ? 'Eliminazione...' : 'Elimina'}</button>
        </div>
      </Modal>
    </>
  );
};