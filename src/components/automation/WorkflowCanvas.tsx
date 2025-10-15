import { useWorkflowExecution, useWorkflows } from '@/lib/workflowApi';
import { SimulationResult, SimulationStep, WorkflowSimulator } from '@/lib/workflowSimulator';
import {
  addEdge,
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Edge,
  Node,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Beaker, Play, Save, Sparkles, Trash2 } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import GenerateWorkflowModal from './GenerateWorkflowModal';
import NodeSidebar from './NodeSidebar';
import WorkflowSimulationPanel from './WorkflowSimulationPanel';

const initialNodes: Node[] = [
  {
    id: 'trigger-1',
    type: 'input',
    data: { 
      label: 'Form Submission Trigger',
      nodeType: 'form_submit',
      description: 'When a form is submitted'
    },
    position: { x: 100, y: 100 },
    className: 'border-blue-500',
  },
  {
    id: 'action-1',
    type: 'default',
    data: { 
      label: 'AI Score Contact',
      nodeType: 'ai_score',
      description: 'Score lead with DataPizza AI'
    },
    position: { x: 400, y: 100 },
    className: 'border-green-500',
  },
];

const initialEdges: Edge[] = [
  { 
    id: 'e1-2', 
    source: 'trigger-1', 
    target: 'action-1', 
    animated: true,
    style: { stroke: '#3b82f6' }
  },
];

let nodeId = 3;
const getNodeId = () => `node_${nodeId++}`;

export default function WorkflowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  
  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSteps, setSimulationSteps] = useState<SimulationStep[]>([]);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | undefined>();

  // Workflow management hooks
  const { createWorkflow } = useWorkflows();
  const { executeWorkflow } = useWorkflowExecution();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const reactFlowBounds = event.currentTarget.getBoundingClientRect();
    const dragData = event.dataTransfer.getData('application/reactflow');
    
    if (!dragData) return;

    const { type, data } = JSON.parse(dragData);
    const position = {
      x: event.clientX - reactFlowBounds.left - 100,
      y: event.clientY - reactFlowBounds.top - 50,
    };

    const newNode: Node = {
      id: getNodeId(),
      type,
      position,
      data: {
        label: data.label,
        nodeType: data.id,
        description: data.description,
      },
      className: data.category === 'trigger' ? 'border-blue-500' : 'border-green-500',
    };

    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleSaveWorkflow = async () => {
    setIsSaving(true);
    try {
      const workflow = await createWorkflow(
        'My Automation Workflow',
        'Auto-generated workflow from visual builder',
        nodes,
        edges
      );
      
      console.log('Workflow saved:', workflow);
      alert(`Workflow "${workflow.name}" saved successfully!`);
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('Error saving workflow: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunWorkflow = async () => {
    setIsExecuting(true);
    try {
      // First create a temporary workflow for execution
      const workflow = await createWorkflow(
        'Test Execution Workflow',
        'Temporary workflow for testing execution',
        nodes,
        edges
      );

      // Execute the workflow with test data
      const execution = await executeWorkflow(workflow, { 
        test: true,
        source: 'manual_trigger',
        timestamp: new Date().toISOString()
      });

      console.log('Workflow execution result:', execution);
      
      const successCount = execution.results.filter(r => r.success).length;
      const totalCount = execution.results.length;
      
      if (execution.success) {
        alert(`Workflow executed successfully! ${successCount}/${totalCount} nodes completed.`);
      } else {
        alert(`Workflow completed with errors. ${successCount}/${totalCount} nodes succeeded. Check console for details.`);
      }
    } catch (error) {
      console.error('Error running workflow:', error);
      alert('Error running workflow: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsExecuting(false);
    }
  };

  const handleClearCanvas = () => {
    if (confirm('Are you sure you want to clear the canvas?')) {
      setNodes([]);
      setEdges([]);
    }
  };

  const handleGeneratedWorkflow = (nodes: Node[], edges: Edge[]) => {
    // Add generated nodes and edges to canvas
    setNodes(nodes);
    setEdges(edges);
    setShowGenerateModal(false);
  };

  const handleSimulateWorkflow = async () => {
    if (nodes.length === 0) {
      alert('Il canvas è vuoto. Aggiungi dei nodi per simulare il workflow.');
      return;
    }

    // Reset simulation state
    setIsSimulating(true);
    setSimulationSteps([]);
    setSimulationResult(undefined);

    try {
      // Create simulator instance
      const simulator = new WorkflowSimulator(nodes, edges);

      // Test data for simulation
      const testData = {
        name: 'Mario Rossi',
        email: 'mario.rossi@example.it',
        phone: '+39 333 1234567',
        company: 'Example SRL',
        formData: {
          message: 'Vorrei maggiori informazioni sui vostri servizi',
          source: 'website',
        },
      };

      // Run simulation with step callback
      const result = await simulator.simulate(testData, (step: SimulationStep) => {
        // Update steps array
        setSimulationSteps((prev) => {
          const existingIndex = prev.findIndex((s) => s.stepId === step.stepId);
          if (existingIndex >= 0) {
            // Update existing step
            const updated = [...prev];
            updated[existingIndex] = step;
            return updated;
          } else {
            // Add new step
            return [...prev, step];
          }
        });

        // Update node styles to reflect execution status
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === step.nodeId) {
              let borderColor = 'border-gray-300';
              if (step.status === 'running') {
                borderColor = 'border-yellow-400';
              } else if (step.status === 'success') {
                borderColor = 'border-green-500';
              } else if (step.status === 'error') {
                borderColor = 'border-red-500';
              } else if (step.status === 'skipped') {
                borderColor = 'border-orange-400';
              }

              return {
                ...node,
                className: `${borderColor} ${
                  step.status === 'running' ? 'shadow-lg shadow-yellow-200' : ''
                }`,
              };
            }
            return node;
          })
        );
      });

      setSimulationResult(result);

      console.log('✅ Simulation completed:', result);
    } catch (error) {
      console.error('❌ Simulation error:', error);
      alert(
        'Errore durante la simulazione: ' +
          (error instanceof Error ? error.message : 'Errore sconosciuto')
      );
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCloseSimulation = () => {
    setSimulationSteps([]);
    setSimulationResult(undefined);

    // Reset node styles
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        className: node.data.category === 'trigger' ? 'border-blue-500' : 'border-green-500',
      }))
    );
  };

  return (
    <ReactFlowProvider>
      <div className="flex h-full">
        <NodeSidebar />
        
        <div className="flex flex-col flex-1">
          {/* Toolbar */}
          <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2">
            <button
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate with AI
            </button>

            <button
              onClick={handleSaveWorkflow}
              disabled={isSaving}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Workflow'}
            </button>
            
            <button
              onClick={handleRunWorkflow}
              disabled={isExecuting || nodes.length === 0}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4 mr-2" />
              {isExecuting ? 'Running...' : 'Run Workflow'}
            </button>

            <button
              onClick={handleSimulateWorkflow}
              disabled={isSimulating || nodes.length === 0}
              className="flex items-center px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Beaker className="w-4 h-4 mr-2" />
              {isSimulating ? 'Simulazione...' : 'Simula Workflow'}
            </button>
            
            <button
              onClick={handleClearCanvas}
              className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Canvas
            </button>

            <div className="ml-auto text-sm text-gray-600">
              Nodes: {nodes.length} | Edges: {edges.length}
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1" onDrop={onDrop} onDragOver={onDragOver}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              fitView
              className="bg-gray-50"
            >
              <Background variant={BackgroundVariant.Dots} />
              <Controls />
            </ReactFlow>
          </div>
        </div>
      </div>

      {/* AI Generation Modal */}
      <GenerateWorkflowModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onGenerate={handleGeneratedWorkflow}
      />

      {/* Simulation Panel */}
      {simulationSteps.length > 0 && (
        <WorkflowSimulationPanel
          steps={simulationSteps}
          isRunning={isSimulating}
          result={simulationResult}
          onClose={handleCloseSimulation}
        />
      )}
    </ReactFlowProvider>
  );
}