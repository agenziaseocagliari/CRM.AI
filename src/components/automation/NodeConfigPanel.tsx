import { Node } from '@xyflow/react';
import { Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface NodeConfigPanelProps {
  node: Node | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (nodeId: string, config: Record<string, string | number>) => void;
}

export default function NodeConfigPanel({ node, isOpen, onClose, onSave }: NodeConfigPanelProps) {
  const [config, setConfig] = useState<Record<string, string | number>>({});

  useEffect(() => {
    if (node) {
      const nodeConfig = node.data.config || {};
      setConfig(nodeConfig as Record<string, string | number>);
    }
  }, [node]);

  if (!isOpen || !node) return null;

  const handleSave = () => {
    onSave(node.id, config);
    onClose();
  };

  // Get node-specific config fields
  const getConfigFields = () => {
    const nodeType = node.data.nodeType as string;

    switch(nodeType) {
      case 'trigger-form-submit':
        return (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">ID Modulo</label>
              <input
                type="text"
                value={config.formId || ''}
                onChange={(e) => setConfig({ ...config, formId: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="form-123"
              />
            </div>
          </>
        );
      
      case 'action-send-email':
        return (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Email Destinatario</label>
              <input
                type="email"
                value={config.to || ''}
                onChange={(e) => setConfig({ ...config, to: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="utente@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Oggetto</label>
              <input
                type="text"
                value={config.subject || ''}
                onChange={(e) => setConfig({ ...config, subject: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Benvenuto!"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Corpo Email</label>
              <textarea
                value={config.body || ''}
                onChange={(e) => setConfig({ ...config, body: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 h-32"
                placeholder="Ciao {{name}}, benvenuto..."
              />
            </div>
          </>
        );
      
      case 'action-wait':
        return (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Durata (minuti)</label>
              <input
                type="number"
                value={config.duration || 60}
                onChange={(e) => setConfig({ ...config, duration: parseInt(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </>
        );
      
      case 'action-ai-score':
        return (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Campo da Valutare</label>
              <input
                type="text"
                value={config.field || 'contact'}
                onChange={(e) => setConfig({ ...config, field: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Soglia Punteggio</label>
              <input
                type="number"
                value={config.threshold || 70}
                onChange={(e) => setConfig({ ...config, threshold: parseInt(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2"
                min="0"
                max="100"
              />
            </div>
          </>
        );
      
      case 'action-condition-if':
        return (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Condizione</label>
              <input
                type="text"
                value={config.condition || ''}
                onChange={(e) => setConfig({ ...config, condition: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="score > 70"
              />
            </div>
          </>
        );
      
      case 'action-add-tag':
        return (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Tag da Aggiungere</label>
              <input
                type="text"
                value={config.tag || ''}
                onChange={(e) => setConfig({ ...config, tag: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="hot-lead"
              />
            </div>
          </>
        );
      
      case 'action-create-deal':
        return (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Nome Deal</label>
              <input
                type="text"
                value={config.dealName || ''}
                onChange={(e) => setConfig({ ...config, dealName: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Nuovo Deal - {{name}}"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Valore (€)</label>
              <input
                type="number"
                value={config.value || 1000}
                onChange={(e) => setConfig({ ...config, value: parseInt(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Fase</label>
              <select
                value={config.stage || 'prospect'}
                onChange={(e) => setConfig({ ...config, stage: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="prospect">Prospect</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
              </select>
            </div>
          </>
        );
      
      default:
        return (
          <div className="text-sm text-gray-500">
            Nessuna configurazione necessaria per questo tipo di nodo.
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Configura Nodo</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Node Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{node.data.icon as string}</span>
            <div>
              <div className="font-medium">{node.data.label as string}</div>
              <div className="text-sm text-gray-600">{node.data.category as string}</div>
            </div>
          </div>
        </div>
        
        {/* Config Fields */}
        <div className="space-y-4 mb-6">
          {getConfigFields()}
        </div>
        
        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Salva Configurazione
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
}