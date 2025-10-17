import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface NodesBarProps {
  onCategorySelect?: (category: string) => void;
}

export default function NodesBar({ onCategorySelect }: NodesBarProps) {
  const [selectedCategory, setSelectedCategory] = useState('Tutti');
  const [isExpanded, setIsExpanded] = useState(false);

  const categories = [
    { id: 'all', label: 'Tutti', count: 53 },
    { id: 'forms', label: 'Forms', count: 8 },
    { id: 'crm', label: 'CRM', count: 12 },
    { id: 'email', label: 'Email', count: 6 },
    { id: 'tasks', label: 'Tasks', count: 5 },
    { id: 'time', label: 'Time', count: 4 },
    { id: 'integrations', label: 'Integrations', count: 7 },
    { id: 'files', label: 'Files', count: 3 },
    { id: 'payments', label: 'Payments', count: 4 },
    { id: 'subscriptions', label: 'Subscriptions', count: 2 },
    { id: 'manual', label: 'Manual', count: 3 },
    { id: 'ai', label: 'AI', count: 5 },
    { id: 'notifications', label: 'Notifications', count: 6 },
    { id: 'logic', label: 'Logic', count: 4 },
    { id: 'data', label: 'Data', count: 8 }
  ];

  const handleCategoryClick = (category: typeof categories[0]) => {
    setSelectedCategory(category.label);
    onCategorySelect?.(category.id);
  };

  return (
    <div className="bg-white border-b shadow-sm">
      {/* Desktop: Horizontal scrollable bar */}
      <div className="hidden lg:block">
        <div className="px-4 py-3 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {/* Category tabs */}
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === category.label
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                {category.label}
                <span className="ml-1 text-xs opacity-75">({category.count})</span>
              </button>
            ))}
            
            {/* Stats summary */}
            <div className="ml-auto flex items-center gap-4 text-xs text-gray-600 pl-4 border-l border-gray-200">
              <span className="flex items-center gap-1">
                <span className="text-yellow-500">⚡</span>
                Trigger (15)
              </span>
              <span className="flex items-center gap-1">
                <span className="text-blue-500">⚙️</span>
                Azioni (38)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Collapsible dropdown */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 border-b"
        >
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">📋 Nodi Disponibili</span>
            <span className="text-xs text-gray-600">({selectedCategory})</span>
          </div>
          <ChevronDown 
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          />
        </button>
        
        {isExpanded && (
          <div className="border-b bg-white max-h-48 overflow-y-auto">
            <div className="p-3 grid grid-cols-3 gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    handleCategoryClick(category);
                    setIsExpanded(false);
                  }}
                  className={`p-2 rounded text-xs font-medium transition-colors ${
                    selectedCategory === category.label
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {category.label}
                  <div className="text-[10px] opacity-75">({category.count})</div>
                </button>
              ))}
            </div>
            
            {/* Mobile stats */}
            <div className="px-3 pb-3 flex justify-center gap-4 text-xs text-gray-600">
              <span>⚡ Trigger (15)</span>
              <span>⚙️ Azioni (38)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}