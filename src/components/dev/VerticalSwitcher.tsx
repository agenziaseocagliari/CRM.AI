import { useState } from 'react';
import { useVertical } from '@/hooks/verticalUtils';
import { Settings, Zap } from 'lucide-react';

export default function VerticalSwitcher() {
  const { vertical, config, switchVertical, loading } = useVertical();
  const [switching, setSwitching] = useState(false);

  // Only show in development
  if (import.meta.env.PROD) return null;

  const handleSwitch = async (newVertical: string) => {
    if (switching) return;

    const confirmed = window.confirm(
      `Switch to ${newVertical} vertical?\n\nThis will reload the page.`
    );

    if (!confirmed) return;

    try {
      setSwitching(true);
      await switchVertical(newVertical);
    } catch (error) {
      console.error('Error switching vertical:', error);
      alert('Error switching vertical. Check console.');
      setSwitching(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 shadow-2xl z-50 max-w-xs">
      <div className="flex items-center gap-2 mb-3">
        <Settings className="w-4 h-4 text-yellow-600" />
        <h3 className="font-bold text-sm text-yellow-900">🔧 DEV: Vertical Switcher</h3>
      </div>

      {loading ? (
        <p className="text-xs text-gray-600">Loading...</p>
      ) : (
        <>
          <div className="space-y-2 mb-3">
            <button
              onClick={() => handleSwitch('standard')}
              disabled={switching || vertical === 'standard'}
              className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors ${
                vertical === 'standard'
                  ? 'bg-blue-600 text-white cursor-default'
                  : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
              }`}
            >
              📊 Standard CRM
            </button>
            
            <button
              onClick={() => handleSwitch('insurance')}
              disabled={switching || vertical === 'insurance'}
              className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors ${
                vertical === 'insurance'
                  ? 'bg-green-600 text-white cursor-default'
                  : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
              }`}
            >
              🏥 Insurance CRM
            </button>
          </div>

          <div className="pt-3 border-t border-yellow-300">
            <p className="text-xs text-gray-700 mb-1">
              <strong>Current:</strong> {config?.displayName || vertical}
            </p>
            <p className="text-xs text-gray-600">
              {config?.description || 'No description'}
            </p>
            {config?.enabledModules && config.enabledModules.length > 0 && (
              <p className="text-xs text-gray-600 mt-2">
                <strong>Modules:</strong> {config.enabledModules.join(', ')}
              </p>
            )}
          </div>

          {switching && (
            <div className="mt-3 flex items-center gap-2 text-xs text-yellow-700">
              <Zap className="w-3 h-3 animate-pulse" />
              <span>Switching vertical...</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}