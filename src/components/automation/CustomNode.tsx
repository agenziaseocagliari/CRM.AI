import React, { useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Info, X } from 'lucide-react';

const NODE_DESCRIPTIONS: Record<string, string> = {
  'trigger-form-submit': 'Si attiva quando un utente invia un modulo sul sito web. Puoi specificare quale modulo monitorare.',
  'trigger-contact-created': 'Si attiva quando viene creato un nuovo contatto nel CRM. Utile per automazioni di benvenuto.',
  'trigger-deal-won': 'Si attiva quando un affare viene marcato come vinto. Perfetto per follow-up post-vendita.',
  'action-send-email': 'Invia un\'email personalizzata. Supporta variabili dinamiche come {{name}}, {{email}}, ecc.',
  'action-ai-score': 'Calcola un punteggio AI per il lead basato su engagement, fit, e intent. Ritorna un valore 0-100.',
  'action-wait': 'Mette in pausa il workflow per un tempo specificato. Utile per email di follow-up ritardate.',
  'action-add-tag': 'Aggiunge un tag al contatto o deal per segmentazione e filtering.',
  'action-create-deal': 'Crea un nuovo affare nel CRM con valore, fase, e assegnazione automatica.',
  'action-condition-if': 'Divide il workflow in base a una condizione. Es: se punteggio > 70, vai a path A, altrimenti B.',
};

export default function CustomNode({ id, data, selected }: NodeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const nodeType = (data.nodeType as string) || '';
  const description = NODE_DESCRIPTIONS[nodeType] || 'Nessuna descrizione disponibile.';
  const isConfigured = data.config && Object.keys(data.config).length > 0;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };
  
  const confirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Trigger node deletion via React Flow's API
    const event = new CustomEvent('deleteNode', { detail: { nodeId: id } });
    window.dispatchEvent(event);
    setShowDeleteConfirm(false);
  };
  
  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg border-2 bg-white min-w-[180px] relative group ${
        selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
      }`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Delete Button */}
      {!showDeleteConfirm && (
        <button
          onClick={handleDeleteClick}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Elimina nodo"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      
      {/* Delete Confirmation Popup */}
      {showDeleteConfirm && (
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white border-2 border-red-500 rounded-lg shadow-xl p-3 w-64">
            <div className="text-sm font-medium mb-2">Eliminare questo nodo?</div>
            <div className="flex gap-2">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
              >
                Elimina
              </button>
              <button
                onClick={cancelDelete}
                className="flex-1 border border-gray-300 px-3 py-1 rounded text-sm hover:bg-gray-50"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Handles */}
      {data.category !== 'trigger' && (
        <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-500" />
      )}
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-green-500" />

      {/* Node Content */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">{data.icon as string}</span>
        <div className="flex-1">
          <div className="font-medium text-sm">{data.label as string}</div>
          <div className="text-xs text-gray-500">{data.category as string}</div>
        </div>
        <Info className="w-4 h-4 text-gray-400" />
      </div>
      
      {/* Config Indicator */}
      {!isConfigured && data.category !== 'trigger' && (
        <div className="absolute top-1 right-1">
          <div className="w-2 h-2 bg-yellow-500 rounded-full" title="Configurazione richiesta" />
        </div>
      )}
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 max-w-xs shadow-xl">
            <div className="font-semibold mb-1">{data.label as string}</div>
            <div className="text-gray-300">{description}</div>
            <div className="mt-2 text-gray-400 text-xs">
              💡 Doppio click per configurare
            </div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="border-8 border-transparent border-t-gray-900" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}