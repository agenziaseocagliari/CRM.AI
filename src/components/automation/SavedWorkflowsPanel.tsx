import { supabase } from '@/lib/supabaseClient';
import type { Edge, Node } from '@xyflow/react';
import {
    Check,
    ChevronLeft,
    ChevronRight,
    Copy,
    Edit2,
    FileText,
    Plus,
    Trash2,
    X
} from 'lucide-react';
import { useEffect, useState } from 'react';

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

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.organization_id) {
        console.error('Failed to get organization_id:', profileError);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading workflows:', error.message);
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
      // Get user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('User authentication failed:', userError);
        alert('❌ Errore di autenticazione');
        return;
      }

      // Get organization ID from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError || !profile?.organization_id) {
        console.error('Profile fetch failed:', profileError);
        alert('❌ Impossibile ottenere organization_id');
        return;
      }

      // Prepare workflow data
      const workflowData = {
        name,
        organization_id: profile.organization_id,
        created_by: user.id,
        nodes: currentNodes,
        edges: currentEdges,
        is_active: false,
      };

      // Insert workflow
      const { data: insertedData, error } = await supabase
        .from('workflows')
        .insert(workflowData)
        .select()
        .single();

      if (error) {
        console.error('Insert error:', error.message);
        alert('❌ Errore nel salvare il workflow: ' + error.message);
        return;
      }

      console.log('✅ Workflow saved successfully:', insertedData);
      
      // Reload workflows list
      await loadWorkflows();
      
      alert('✅ Workflow salvato!');
      onWorkflowSaved();
    } catch (error) {
      console.error('❌ Error in handleSaveNew:', error);
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
        .maybeSingle();

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
      <div className="h-12 bg-gray-50 border-t border-gray-200 flex items-center justify-center">
        <button
          onClick={() => setIsCollapsed(false)}
          className="px-4 py-2 hover:bg-gray-200 rounded flex items-center gap-2"
          title="Mostra workflow salvati"
        >
          <ChevronRight className="w-4 h-4 rotate-[-90deg]" />
          <span className="text-sm text-gray-600">
            <span className="hidden sm:inline">Mostra I Miei Workflow</span>
            <span className="sm:hidden">Workflow</span>
            <span className="ml-1">({workflows.length})</span>
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white border-t border-gray-200">
      {/* Header - flex-shrink-0 */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-2 lg:gap-4 flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm lg:text-base">
            <FileText className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
            <span className="hidden sm:inline">I Miei Workflow</span>
            <span className="sm:hidden">Workflow</span>
            <span className="text-sm lg:text-base">({workflows.length})</span>
          </h3>

          <button
            onClick={handleSaveNew}
            className="bg-blue-600 text-white px-2 py-1.5 lg:px-4 lg:py-2 rounded-lg hover:bg-blue-700 flex items-center gap-1 lg:gap-2 text-xs lg:text-sm font-medium shadow-md flex-shrink-0"
            title="Salva il workflow corrente nel database"
          >
            <Plus className="w-3 h-3 lg:w-4 lg:h-4" />
            <span className="hidden sm:inline">💾 Salva Workflow</span>
            <span className="sm:hidden">💾</span>
          </button>
        </div>

        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 hover:bg-gray-200 rounded flex-shrink-0"
          title="Nascondi"
        >
          <ChevronLeft className="w-4 h-4 rotate-[-90deg]" />
        </button>
      </div>

      {/* Content - flex-1 with overflow */}
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden p-4">
        {loading ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            Caricamento...
          </div>
        ) : workflows.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
            <FileText className="w-12 h-12 mb-2 opacity-50" />
            <p>Nessun workflow salvato</p>
            <p className="mt-1">Crea e salva il tuo primo workflow!</p>
          </div>
        ) : (
          /* Mobile: Vertical scroll | Desktop: Horizontal scroll */
          <div className="lg:flex lg:gap-4 lg:h-full lg:overflow-x-auto lg:overflow-y-hidden
                          grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-none gap-4 lg:gap-4">
            {workflows.map(workflow => (
              <div
                key={workflow.id}
                className="lg:min-w-[280px] lg:w-[280px] lg:flex-shrink-0
                           w-full border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow bg-white"
              >
                {/* Workflow Name */}
                {editingId === workflow.id ? (
                  <div className="flex items-center gap-2 mb-3">
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
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-sm text-gray-900 flex-1 line-clamp-2">
                      {workflow.name}
                    </h4>
                    <button
                      onClick={() => handleToggleActive(workflow.id, workflow.is_active)}
                      className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ml-2 ${
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
                <div className="text-xs text-gray-500 mb-4 space-y-1">
                  <div className="truncate">📊 {workflow.nodes?.length || 0} nodi · {workflow.edges?.length || 0} connessioni</div>
                  <div className="truncate">📅 {new Date(workflow.updated_at).toLocaleDateString('it-IT', { 
                    day: '2-digit', 
                    month: 'short', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}</div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleLoad(workflow)}
                    className="col-span-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs lg:text-sm font-medium"
                  >
                    Carica Workflow
                  </button>
                  <button
                    onClick={() => handleStartEdit(workflow)}
                    className="px-2 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-xs flex items-center justify-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span className="hidden lg:inline">Rinomina</span>
                    <span className="lg:hidden">📝</span>
                  </button>
                  <button
                    onClick={() => handleDuplicate(workflow)}
                    className="px-2 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-xs flex items-center justify-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span className="hidden lg:inline">Duplica</span>
                    <span className="lg:hidden">📄</span>
                  </button>
                  <button
                    onClick={() => handleDelete(workflow.id, workflow.name)}
                    className="col-span-2 px-2 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 text-xs flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span className="hidden lg:inline">Elimina Workflow</span>
                    <span className="lg:hidden">🗑️ Elimina</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}