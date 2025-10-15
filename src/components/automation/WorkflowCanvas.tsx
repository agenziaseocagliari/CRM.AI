import { useWorkflowExecution, useWorkflows } from '@/lib/workflowApi';
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
import { Play, Save, Trash2 } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import NodeSidebar from './NodeSidebar';

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

  return (
    <ReactFlowProvider>
      <div className="flex h-full">
        <NodeSidebar />
        
        <div className="flex flex-col flex-1">
          {/* Toolbar */}
          <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2">
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
    </ReactFlowProvider>
  );
}