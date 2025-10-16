import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  FileText,
  Edit2,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  X
} from 'lucide-react';
import type { Node, Edge } from '@xyflow/react';

interface SavedWorkflow {
  id: string;
  name: string;
  description: string | null;
  nodes: Node[];
  edges: Edge[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SavedWorkflowsPanelProps {
  onLoadWorkflow: (nodes: Node[], edges: Edge[]) => void;
  currentNodes: Node[];
  currentEdges: Edge[];
  onWorkflowSaved: () => void;
}

export default function SavedWorkflowsPanel({
  onLoadWorkflow,
  currentNodes,
  currentEdges,
  onWorkflowSaved
}: SavedWorkflowsPanelProps) {
  const [workflows, setWorkflows] = useState<SavedWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading workflows:', error);
      } else {
        setWorkflows(data || []);
      }
    } catch (error) {
      console.error('Error in loadWorkflows:', error);
    }

    setLoading(false);
  };

  const handleSaveNew = async () => {
    if (currentNodes.length === 0) {
      alert('⚠️ Canvas vuoto. Crea un workflow prima di salvare.');
      return;
    }

    const name = prompt('Nome workflow:', 'Nuovo Workflow');
    if (!name) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      const { error } = await supabase
        .from('workflows')
        .insert({
          name,
          organization_id: profile.organization_id,
          created_by: user.id,
          nodes: currentNodes,
          edges: currentEdges,
          is_active: false,
        });

      if (error) {
        console.error('Error saving workflow:', error);
        alert('❌ Errore nel salvare il workflow');
      } else {
        alert('✅ Workflow salvato!');
        loadWorkflows();
        onWorkflowSaved();
      }
    } catch (error) {
      console.error('Error in handleSaveNew:', error);
      alert('❌ Errore nel salvare il workflow');
    }
  };

  const handleLoad = (workflow: SavedWorkflow) => {
    if (confirm(`Caricare il workflow "${workflow.name}"? Il canvas attuale verrà sovrascritto.`)) {
      onLoadWorkflow(workflow.nodes, workflow.edges);
    }
  };

  const handleDuplicate = async (workflow: SavedWorkflow) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      const { error } = await supabase
        .from('workflows')
        .insert({
          name: `${workflow.name} (Copia)`,
          description: workflow.description,
          organization_id: profile.organization_id,
          created_by: user.id,
          nodes: workflow.nodes,
          edges: workflow.edges,
          is_active: false,
        });

      if (!error) {
        loadWorkflows();
      }
    } catch (error) {
      console.error('Error in handleDuplicate:', error);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Eliminare il workflow "${name}"?`)) return;

    try {
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', id);

      if (!error) {
        loadWorkflows();
      }
    } catch (error) {
      console.error('Error in handleDelete:', error);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('workflows')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (!error) {
        loadWorkflows();
      }
    } catch (error) {
      console.error('Error in handleToggleActive:', error);
    }
  };

  const handleStartEdit = (workflow: SavedWorkflow) => {
    setEditingId(workflow.id);
    setEditName(workflow.name);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;

    try {
      const { error } = await supabase
        .from('workflows')
        .update({ name: editName })
        .eq('id', id);

      if (!error) {
        setEditingId(null);
        loadWorkflows();
      }
    } catch (error) {
      console.error('Error in handleSaveEdit:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 hover:bg-gray-200 rounded"
          title="Mostra workflow"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <div className="mt-4 transform -rotate-90 whitespace-nowrap text-sm text-gray-600">
          Workflow
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          I Miei Workflow
        </h3>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 hover:bg-gray-100 rounded"
          title="Nascondi"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Save Current Button */}
      <div className="p-3 border-b border-gray-200">
        <button
          onClick={handleSaveNew}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Salva Workflow Corrente
        </button>
      </div>

      {/* Workflows List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            Caricamento...
          </div>
        ) : workflows.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nessun workflow salvato</p>
            <p className="mt-1">Crea e salva il tuo primo workflow!</p>
          </div>
        ) : (
          workflows.map(workflow => (
            <div
              key={workflow.id}
              className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow bg-white"
            >
              {/* Workflow Name */}
              {editingId === workflow.id ? (
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-2 py-1 border rounded text-sm"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveEdit(workflow.id)}
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-sm text-gray-900 flex-1">
                    {workflow.name}
                  </h4>
                  <button
                    onClick={() => handleToggleActive(workflow.id, workflow.is_active)}
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      workflow.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {workflow.is_active ? '🟢 Attivo' : '⚫ Inattivo'}
                  </button>
                </div>
              )}

              {/* Workflow Info */}
              <div className="text-xs text-gray-500 mb-3 space-y-1">
                <div>📊 {workflow.nodes?.length || 0} nodi</div>
                <div>📅 {new Date(workflow.updated_at).toLocaleDateString('it-IT')}</div>
              </div>

              {/* Actions */}
              <div className="flex gap-1">
                <button
                  onClick={() => handleLoad(workflow)}
                  className="flex-1 px-2 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-xs font-medium"
                  title="Carica workflow"
                >
                  Carica
                </button>
                <button
                  onClick={() => handleStartEdit(workflow)}
                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                  title="Rinomina"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDuplicate(workflow)}
                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                  title="Duplica"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(workflow.id, workflow.name)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                  title="Elimina"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}