export default function AutomationDiagnostic() {
  console.log('AutomationDiagnostic Rendered');
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Automation Diagnostic Page</h1>
      <div className="space-y-4">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          ✅ Diagnostic page loaded successfully
        </div>
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          📍 Route: /dashboard/automation/diagnostic
        </div>
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          ⚠️ If this renders but main automation page doesn't, issue is in WorkflowCanvas component
        </div>
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Environment Check:</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>React Router: ✅ Working (this page rendered)</li>
            <li>Tailwind CSS: ✅ Working (styles applied)</li>
            <li>Path Aliases: ✅ Should be fixed now</li>
          </ul>
        </div>
      </div>
    </div>
  );
}