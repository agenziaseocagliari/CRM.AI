import { NODE_LIBRARY, NodeDefinition } from '@/lib/nodes/nodeLibrary';
import { Search } from 'lucide-react';
import React, { useState } from 'react';

export default function NodeSidebar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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
    event.dataTransfer.setData('application/reactflow', JSON.stringify({
      type: node.type === 'trigger' ? 'input' : 'default',
      nodeType: node.id,
      label: node.label,
      category: node.category,
      icon: node.icon,
      color: node.color,
      config: node.config || []
    }));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-lg mb-3">Nodi Disponibili</h3>
        
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
      
      {/* Node List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
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
                  className="p-3 bg-white border border-gray-200 rounded-lg cursor-move hover:shadow-md transition-all hover:border-blue-300 group"
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
                    <div 
                      className="w-3 h-3 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: node.color }}
                    />
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
                  className="p-3 bg-white border border-gray-200 rounded-lg cursor-move hover:shadow-md transition-all hover:border-green-300 group"
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
                    <div 
                      className="w-3 h-3 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: node.color }}
                    />
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
    </div>
  );
}