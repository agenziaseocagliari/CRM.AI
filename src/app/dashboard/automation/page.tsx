import WorkflowCanvas from '../../../components/automation/WorkflowCanvas';

export default function AutomationPage() {
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
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-hidden">
        <WorkflowCanvas />
      </div>
    </div>
  );
}