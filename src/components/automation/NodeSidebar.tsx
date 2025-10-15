import { Brain, Mail, Play, Target, User, Zap } from 'lucide-react';
import React from 'react';

interface NodeType {
  id: string;
  label: string;
  type: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'trigger' | 'action';
  description: string;
}

const nodeTypes: NodeType[] = [
  // Triggers
  { 
    id: 'form_submit', 
    label: 'Form Submit', 
    type: 'input',
    icon: Play,
    category: 'trigger',
    description: 'When a form is submitted'
  },
  { 
    id: 'contact_update', 
    label: 'Contact Update', 
    type: 'input',
    icon: User,
    category: 'trigger',
    description: 'When a contact is updated'
  },
  { 
    id: 'deal_won', 
    label: 'Deal Won', 
    type: 'input',
    icon: Target,
    category: 'trigger',
    description: 'When a deal is won'
  },
  // Actions
  { 
    id: 'send_email', 
    label: 'Send Email', 
    type: 'default',
    icon: Mail,
    category: 'action',
    description: 'Send automated email'
  },
  { 
    id: 'ai_score', 
    label: 'AI Score', 
    type: 'default',
    icon: Brain,
    category: 'action',
    description: 'Score lead with DataPizza AI'
  },
  { 
    id: 'create_deal', 
    label: 'Create Deal', 
    type: 'default',
    icon: Zap,
    category: 'action',
    description: 'Create new deal/opportunity'
  },
];

export default function NodeSidebar() {
  const onDragStart = (event: React.DragEvent, nodeType: string, nodeData: NodeType) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({
      type: nodeType,
      data: nodeData
    }));
    event.dataTransfer.effectAllowed = 'move';
  };

  const triggerNodes = nodeTypes.filter(n => n.category === 'trigger');
  const actionNodes = nodeTypes.filter(n => n.category === 'action');

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Workflow Builder
      </h3>
      
      {/* Triggers Section */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <Play className="w-4 h-4 mr-2" />
          Triggers
        </h4>
        <div className="space-y-2">
          {triggerNodes.map((node) => {
            const IconComponent = node.icon;
            return (
              <div
                key={node.id}
                className="p-3 bg-white rounded-lg border border-gray-200 cursor-move hover:shadow-md transition-shadow group"
                onDragStart={(e) => onDragStart(e, node.type, node)}
                draggable
              >
                <div className="flex items-center mb-1">
                  <IconComponent className="w-4 h-4 mr-2 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">
                    {node.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{node.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions Section */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <Zap className="w-4 h-4 mr-2" />
          Actions
        </h4>
        <div className="space-y-2">
          {actionNodes.map((node) => {
            const IconComponent = node.icon;
            return (
              <div
                key={node.id}
                className="p-3 bg-white rounded-lg border border-gray-200 cursor-move hover:shadow-md transition-shadow group"
                onDragStart={(e) => onDragStart(e, node.type, node)}
                draggable
              >
                <div className="flex items-center mb-1">
                  <IconComponent className="w-4 h-4 mr-2 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">
                    {node.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{node.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="mt-6 p-3 bg-blue-50 rounded-lg">
        <h5 className="text-xs font-medium text-blue-900 mb-1">
          How to use:
        </h5>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Drag nodes to canvas</li>
          <li>• Connect nodes with edges</li>
          <li>• Configure node settings</li>
          <li>• Save and test workflow</li>
        </ul>
      </div>
    </aside>
  );
}