import { useState, useEffect } from 'react';
import { WorkflowCanvas } from '../../../components/automation';

export default function AutomationPage() {
  const [renderError, setRenderError] = useState<string | null>(null);
  
  useEffect(() => {
    console.log('🚀 AutomationPage mounted successfully');
  }, []);

  let RenderCanvas;
  try {
    RenderCanvas = <WorkflowCanvas />;
  } catch (err) {
    console.error('❌ AutomationPage WorkflowCanvas error:', err);
    setRenderError(err instanceof Error ? err.message : String(err));
    RenderCanvas = (
      <div className="flex items-center justify-center h-full bg-red-50">
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Error Loading Automation Builder
          </h2>
          <p className="text-red-500 mb-4">
            {renderError || 'An unknown error occurred'}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">
          Visual Automation Builder
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Create automated workflows with drag-and-drop interface
        </p>
        {renderError && (
          <div className="mt-2 text-sm text-red-600">
            ⚠️ Component error detected - check console for details
          </div>
        )}
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-hidden">
        {RenderCanvas}
      </div>
    </div>
  );
}