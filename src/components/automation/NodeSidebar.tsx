import { NODE_LIBRARY, NodeDefinition } from '@/lib/nodes/nodeLibrary';
import { Info, Search } from 'lucide-react';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';

const NODE_DESCRIPTIONS: Record<string, string> = {
  'trigger-form-submit': 'Si attiva quando un utente invia un modulo sul sito web. Puoi specificare quale modulo monitorare per avviare l\'automazione.',
  'trigger-contact-created': 'Si attiva automaticamente quando viene creato un nuovo contatto nel CRM. Perfetto per email di benvenuto e onboarding.',
  'trigger-deal-won': 'Si attiva quando un affare viene marcato come vinto. Ideale per follow-up post-vendita, richieste recensioni, upselling.',
  'trigger-deal-lost': 'Si attiva quando un affare viene perso. Utile per survey e win-back campaigns.',
  'trigger-email-received': 'Si attiva quando ricevi un\'email da un contatto. Può triggerare risposte automatiche o task assignment.',
  'trigger-task-completed': 'Si attiva quando un\'attività viene completata. Utile per catene di task o notification ai manager.',
  'trigger-schedule-time': 'Si attiva in base a un orario programmato (es: ogni giorno alle 9:00). Perfetto per report giornalieri.',
  'trigger-webhook': 'Riceve dati da servizi esterni via HTTP POST. Integra qualsiasi app che supporti webhook.',
  'trigger-contact-updated': 'Si attiva quando un contatto viene modificato. Utile per sincronizzazione dati o scoring dinamico.',
  
  'action-send-email': 'Invia un\'email personalizzata con variabili dinamiche come {{name}}, {{email}}, {{company}}. Supporta HTML e allegati.',
  'action-ai-score': 'Calcola un punteggio AI (0-100) per il lead basato su engagement, fit aziendale, e intent signals.',
  'action-ai-classify': 'Classifica automaticamente il contatto in categorie (Enterprise, SMB, Startup, Individual) usando AI.',
  'action-ai-enrich': 'Arricchisce i dati del contatto con informazioni aziendali, social profiles, e technographics.',
  'action-ai-sentiment': 'Analizza il sentiment di una email o messaggio (Positivo, Neutro, Negativo) per prioritizzazione.',
  'action-create-deal': 'Crea un nuovo affare nel CRM con valore, fase, data di chiusura prevista, e assegnazione automatica.',
  'action-update-deal': 'Aggiorna un affare esistente cambiando fase, valore, o altri campi. Utile per pipeline automation.',
  'action-add-tag': 'Aggiunge uno o più tag al contatto per segmentazione avanzata. Es: "hot-lead", "webinar-attendee".',
  'action-remove-tag': 'Rimuove tag specifici dal contatto. Utile per cleanup o cambio stato.',
  'action-assign-user': 'Assegna il contatto o deal a un utente specifico del team. Supporta round-robin e territory-based.',
  'action-create-task': 'Crea un\'attività per un membro del team con titolo, descrizione, data scadenza, e priorità.',
  'action-wait': 'Mette in pausa il workflow per un periodo specifico (minuti, ore, giorni). Perfetto per drip campaigns.',
  'action-wait-until': 'Attende fino a una data/ora specifica o fino a quando una condizione diventa vera.',
  'action-condition-if': 'Divide il workflow in due path basato su una condizione. Es: se score > 70, vai a sales, altrimenti a nurture.',
  'action-switch': 'Crea multiple branch basate su valori diversi. Es: routing per industry, company size, region.',
  'action-loop-foreach': 'Itera su un array di elementi eseguendo azioni per ciascuno. Es: invia email a tutti i membri di un team.',
  'action-webhook-call': 'Chiama un endpoint HTTP esterno con dati del workflow. Integra con qualsiasi API RESTful.',
  'action-api-request': 'Esegue una richiesta API personalizzata (GET, POST, PUT, DELETE) con headers e body custom.',
  'action-slack-message': 'Invia un messaggio a un canale Slack. Perfetto per notifiche team in real-time.',
  'action-sms': 'Invia un SMS al numero del contatto. Richiede integrazione con Twilio o simili.',
};

export default function NodeSidebar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (nodeId: string, event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2, // Center horizontally
      y: rect.top - 10, // Above the node
    });
    setHoveredNode(nodeId);
  };

  const handleMouseLeave = () => {
    setHoveredNode(null);
  };

  // Get unique categories
  const categories = ['all', ...new Set(NODE_LIBRARY.map(n => n.category))];

  // Filter nodes
  const filteredNodes = NODE_LIBRARY.filter(node => {
    const matchesSearch = node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || node.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group by type
  const triggers = filteredNodes.filter(n => n.type === 'trigger');
  const actions = filteredNodes.filter(n => n.type === 'action');

  const onDragStart = (event: React.DragEvent, node: NodeDefinition) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(node));
    event.dataTransfer.effectAllowed = 'move';
    console.log('🎯 Drag started:', node.label);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50">
      {/* Header - flex-shrink-0 */}
      <div className="flex-shrink-0 p-3 border-b border-gray-200">
        <h3 className="font-semibold text-sm mb-3">Nodi Disponibili</h3>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca nodi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {cat === 'all' ? 'Tutti' : cat}
            </button>
          ))}
        </div>
      </div>
      
      {/* Node List - Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4">
        {/* Triggers */}
        {triggers.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center">
              ⚡ Trigger ({triggers.length})
            </h4>
            <div className="space-y-2">
              {triggers.map(node => (
                <div
                  key={node.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, node)}
                  onMouseEnter={(e) => handleMouseEnter(node.id, e)}
                  onMouseLeave={handleMouseLeave}
                  className="relative p-3 bg-white border border-gray-200 rounded-lg cursor-move hover:shadow-md transition-all hover:border-blue-300 group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl" role="img" aria-label={node.label}>
                      {node.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900">{node.label}</div>
                      {node.description && (
                        <div className="text-xs text-gray-500 truncate">{node.description}</div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">{node.category}</div>
                    </div>
                    <Info className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Actions */}
        {actions.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center">
              ⚙️ Azioni ({actions.length})
            </h4>
            <div className="space-y-2">
              {actions.map(node => (
                <div
                  key={node.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, node)}
                  onMouseEnter={(e) => handleMouseEnter(node.id, e)}
                  onMouseLeave={handleMouseLeave}
                  className="relative p-3 bg-white border border-gray-200 rounded-lg cursor-move hover:shadow-md transition-all hover:border-green-300 group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl" role="img" aria-label={node.label}>
                      {node.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900">{node.label}</div>
                      {node.description && (
                        <div className="text-xs text-gray-500 truncate">{node.description}</div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">{node.category}</div>
                    </div>
                    <Info className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {filteredNodes.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">🔍</div>
            <div className="text-sm">Nessun nodo trovato</div>
            <div className="text-xs text-gray-400">Prova un altro termine di ricerca</div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-gray-200 bg-gray-100">
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Totale Nodi:</span>
            <span className="font-medium">{NODE_LIBRARY.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Trigger:</span>
            <span className="font-medium">{NODE_LIBRARY.filter(n => n.type === 'trigger').length}</span>
          </div>
          <div className="flex justify-between">
            <span>Azioni:</span>
            <span className="font-medium">{NODE_LIBRARY.filter(n => n.type === 'action').length}</span>
          </div>
        </div>
      </div>

      {/* Portal Tooltip - renders above everything */}
      {hoveredNode && createPortal(
        <div
          style={{
            position: 'fixed',
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translate(-50%, -100%)',
            zIndex: 99999,
            pointerEvents: 'none',
          }}
          className="w-80"
        >
          <div className="bg-gray-900 text-white text-sm rounded-lg py-3 px-4 shadow-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">
                {filteredNodes.find(n => n.id === hoveredNode)?.icon}
              </span>
              <div className="font-semibold">
                {filteredNodes.find(n => n.id === hoveredNode)?.label}
              </div>
            </div>
            <div className="text-gray-300 mb-2">
              {NODE_DESCRIPTIONS[hoveredNode] || 'Nessuna descrizione disponibile.'}
            </div>
            <div className="text-xs text-gray-400 border-t border-gray-700 pt-2">
              💡 Trascina sul canvas per aggiungere
            </div>
            {/* Arrow pointing down */}
            <div
              style={{
                position: 'absolute',
                bottom: '-8px',
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            >
              <div className="border-8 border-transparent border-t-gray-900" />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
