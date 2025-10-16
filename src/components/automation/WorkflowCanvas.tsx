import type { NodeDefinition } from '@/lib/nodes/nodeLibrary';
import { useWorkflows } from '@/lib/workflowApi';
import { ExecutionResult, ExecutionStep, WorkflowExecutor } from '@/lib/workflowExecutor';
import { SimulationResult, SimulationStep, WorkflowSimulator } from '@/lib/workflowSimulator';
import {
  addEdge,
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Edge,
  MiniMap,
  Node,
  ReactFlow,
  ReactFlowInstance,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Beaker, Play, Save, Sparkles, Trash2 } from 'lucide-react';
import React, { useCallback, useRef, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import '../../styles/workflowCanvas.css';
import GenerateWorkflowModal from './GenerateWorkflowModal';
import NodeSidebar from './NodeSidebar';
import WorkflowSimulationPanel from './WorkflowSimulationPanel';

const initialNodes: Node[] = [
  {
    id: 'trigger-1',
    type: 'input',
    data: { 
      label: 'Trigger Invio Modulo',
      nodeType: 'form_submit',
      description: 'Quando un modulo viene inviato',
      category: 'trigger'
    },
    position: { x: 100, y: 100 },
    style: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      border: '2px solid #2563eb',
      borderRadius: '12px',
      padding: '12px',
      minWidth: '160px',
      fontWeight: '500',
      color: '#ffffff',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      fontSize: '14px',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    },
    className: 'node-trigger',
  },
  {
    id: 'action-1',
    type: 'default',
    data: { 
      label: 'Valuta Contatto AI',
      nodeType: 'ai_score',
      description: 'Valuta lead con DataPizza AI',
      category: 'ai'
    },
    position: { x: 400, y: 100 },
    style: {
      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      border: '2px solid #7c3aed',
      borderRadius: '12px',
      padding: '12px',
      minWidth: '160px',
      fontWeight: '500',
      color: '#ffffff',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      fontSize: '14px',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    },
    className: 'node-ai',
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

// Node IDs are now generated using UUIDs in onDrop handler

export default function WorkflowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  
  // ReactFlow refs and state for drag-drop
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  
  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSteps, setSimulationSteps] = useState<SimulationStep[]>([]);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | undefined>();

  // Workflow management hooks
  const { createWorkflow } = useWorkflows();

  // Helper functions for professional node styling
  const getNodeBackgroundColor = (category: string) => {
    switch (category) {
      case 'trigger':
        return 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
      case 'action':
        return 'linear-gradient(135deg, #10b981 0%, #047857 100%)';
      case 'logic':
        return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
      case 'ai':
        return 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
      default:
        return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
    }
  };

  const getNodeBorderColor = (category: string) => {
    switch (category) {
      case 'trigger':
        return '#2563eb';
      case 'action':
        return '#059669';
      case 'logic':
        return '#f59e0b';
      case 'ai':
        return '#7c3aed';
      default:
        return '#6b7280';
    }
  };

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, animated: true }, eds));
      console.log('✅ Nodes connected:', params.source, '→', params.target);
    },
    [setEdges]
  );

  // Delete nodes handler (Delete/Backspace key)
  const onNodesDelete = useCallback((deleted: Node[]) => {
    console.log('🗑️ Nodes deleted:', deleted.map(n => n.data.label));
    // Also remove any edges connected to deleted nodes
    const deletedNodeIds = deleted.map(n => n.id);
    setEdges((eds) => eds.filter(edge => 
      !deletedNodeIds.includes(edge.source) && !deletedNodeIds.includes(edge.target)
    ));
  }, [setEdges]);

  // Delete edges handler (Delete/Backspace key)
  const onEdgesDelete = useCallback((deleted: Edge[]) => {
    console.log('🗑️ Edges deleted:', deleted.map(e => `${e.source} → ${e.target}`));
  }, []);

  // Clear canvas function
  const handleClearCanvas = useCallback(() => {
    if (confirm('Vuoi cancellare tutti i nodi e connessioni?')) {
      setNodes([]);
      setEdges([]);
      console.log('🗑️ Canvas cleared');
    }
  }, [setNodes, setEdges]);

  // Save workflow function
  const handleSaveWorkflow = useCallback(async () => {
    setIsSaving(true);
    try {
      const workflow = await createWorkflow(
        'My Automation Workflow',
        'Auto-generated workflow from visual builder',
        nodes,
        edges
      );
      
      console.log('Workflow saved:', workflow);
      alert(`Workflow "${workflow.name}" salvato con successo!`);
    } catch (error) {
      console.error('Errore salvataggio workflow:', error);
      alert('Errore salvataggio workflow: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
    } finally {
      setIsSaving(false);
    }
  }, [createWorkflow, nodes, edges]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + S = Save
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleSaveWorkflow();
      }
      
      // Ctrl/Cmd + A = Select All
      if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        event.preventDefault();
        setNodes(nds => nds.map(n => ({ ...n, selected: true })));
        setEdges(eds => eds.map(e => ({ ...e, selected: true })));
        console.log('✅ All elements selected');
      }

      // Delete key = Delete selected
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const selectedNodes = nodes.filter(n => n.selected);
        const selectedEdges = edges.filter(e => e.selected);
        
        if (selectedNodes.length > 0) {
          onNodesDelete(selectedNodes);
          setNodes(nds => nds.filter(n => !n.selected));
        }
        
        if (selectedEdges.length > 0) {
          onEdgesDelete(selectedEdges);
          setEdges(eds => eds.filter(e => !e.selected));
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveWorkflow, nodes, edges, onNodesDelete, onEdgesDelete, setNodes, setEdges]);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    console.log('🎯 DROP EVENT TRIGGERED');
    console.log('📦 reactFlowWrapper:', reactFlowWrapper.current ? 'EXISTS' : 'NULL');
    console.log('🔧 reactFlowInstance:', reactFlowInstance ? 'EXISTS' : 'NULL');

    // Check 1: Wrapper exists
    if (!reactFlowWrapper.current) {
      console.error('❌ reactFlowWrapper is null');
      return;
    }

    // Check 2: Instance exists AND has screenToFlowPosition method (ReactFlow v12)
    if (!reactFlowInstance || typeof reactFlowInstance.screenToFlowPosition !== 'function') {
      console.error('❌ ReactFlow instance not ready. Instance:', reactFlowInstance);
      console.error('❌ Available methods:', reactFlowInstance ? Object.keys(reactFlowInstance) : 'N/A');
      alert('Canvas non pronto. Riprova tra 1 secondo.');
      return;
    }

    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const nodeDataString = event.dataTransfer.getData('application/reactflow');

    if (!nodeDataString) {
      console.error('❌ No node data in drop event');
      return;
    }

    let nodeDefinition: NodeDefinition;
    try {
      nodeDefinition = JSON.parse(nodeDataString);
      console.log('✅ Node definition parsed:', nodeDefinition);
    } catch (error) {
      console.error('❌ Invalid node JSON:', error);
      return;
    }

    // Calculate position using ReactFlow v12's screenToFlowPosition method with fallback
    let position;
    try {
      position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      console.log('✅ Position calculated with screenToFlowPosition:', position);
    } catch (error) {
      console.error('❌ screenToFlowPosition() failed:', error);
      // Fallback: use raw coordinates relative to bounds
      position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };
      console.log('⚠️ Using fallback position:', position);
    }

    const newNode: Node = {
      id: `${nodeDefinition.id}-${uuidv4()}`,
      type: nodeDefinition.type === 'trigger' ? 'input' : 'default',
      position,
      data: {
        label: nodeDefinition.label,
        nodeType: nodeDefinition.id,
        category: nodeDefinition.category,
        icon: nodeDefinition.icon,
        color: nodeDefinition.color,
        config: {}
      },
      style: {
        background: getNodeBackgroundColor(nodeDefinition.category),
        border: `2px solid ${getNodeBorderColor(nodeDefinition.category)}`,
        borderRadius: '12px',
        padding: '12px',
        minWidth: '160px',
        fontWeight: '500',
        color: '#ffffff',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        fontSize: '14px',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      },
      className: `node-${nodeDefinition.category}`,
    };

    console.log('🎉 NEW NODE CREATED:', {
      id: newNode.id,
      label: newNode.data.label,
      position: newNode.position,
      category: newNode.data.category
    });

    setNodes((nds) => {
      const updated = nds.concat(newNode);
      console.log('✅ NODES STATE UPDATED:');
      console.log(`   Previous count: ${nds.length}`);
      console.log(`   New count: ${updated.length}`);
      console.log('   All node IDs:', updated.map(n => n.id));
      
      // Verify the new node is in the array
      const foundNode = updated.find(n => n.id === newNode.id);
      if (foundNode) {
        console.log('✅ NEW NODE CONFIRMED IN STATE:', foundNode.data.label);
      } else {
        console.error('❌ NEW NODE NOT FOUND IN STATE!');
      }
      
      return updated;
    });
  }, [reactFlowInstance, setNodes]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // ReactFlow init handler with comprehensive logging
  const handleInit = useCallback((instance: ReactFlowInstance) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log('🚀 ReactFlow onInit called at', timestamp);
    console.log('🔍 Instance type:', typeof instance);
    console.log('🔍 Instance.screenToFlowPosition type:', typeof instance?.screenToFlowPosition);
    
    if (instance) {
      console.log('✅ ReactFlow initialized successfully');
      console.log('📊 ReactFlow instance methods:', Object.keys(instance));
      
      if (typeof instance.screenToFlowPosition === 'function') {
        console.log('✅ instance.screenToFlowPosition is a function (ReactFlow v12)');
      } else {
        console.error('❌ screenToFlowPosition method not found');
        console.error('❌ This may cause drag-drop issues');
      }
      
      setReactFlowInstance(instance);
    } else {
      console.error('❌ ReactFlow initialization failed at', timestamp);
    }
  }, []);

  // Debug reactFlowInstance state changes
  useEffect(() => {
    console.log('🔍 reactFlowInstance state changed:', reactFlowInstance);
    console.log('🔍 Has screenToFlowPosition method?', reactFlowInstance?.screenToFlowPosition !== undefined);
    if (reactFlowInstance) {
      console.log('🔍 Available instance methods:', Object.keys(reactFlowInstance));
    }
  }, [reactFlowInstance]);

  // handleSaveWorkflow moved above to fix dependency order

  const handleRunWorkflow = async () => {
    if (nodes.length === 0) {
      alert('Il canvas è vuoto. Aggiungi nodi prima di eseguire.');
      return;
    }

    setIsExecuting(true);
    
    // Clear previous simulation state
    setSimulationSteps([]);
    setSimulationResult(undefined);

    try {
      console.log('🚀 Starting real workflow execution...');

      // Create workflow executor
      const executor = new WorkflowExecutor({
        organizationId: 'test-org',
        userId: 'test-user',
        workflowId: `workflow_${Date.now()}`
      });

      // Execute workflow with real-time step updates
      const result: ExecutionResult = await executor.execute(
        { nodes, edges },
        (step: ExecutionStep) => {
          console.log('Step executed:', step);
          
          // Convert execution step to simulation step for UI compatibility
          const simulationStep: SimulationStep = {
            stepId: step.stepId,
            nodeId: step.nodeId,
            nodeName: step.nodeName,
            nodeType: step.nodeType,
            status: step.status,
            input: step.input,
            output: step.output,
            duration: step.duration,
            startTime: step.startTime,
          };
          
          // Update simulation steps for UI
          setSimulationSteps(prev => {
            const newSteps = [...prev];
            const existingIndex = newSteps.findIndex(s => s.stepId === step.stepId);
            
            if (existingIndex >= 0) {
              newSteps[existingIndex] = simulationStep;
            } else {
              newSteps.push(simulationStep);
            }
            
            return newSteps;
          });
        }
      );

      // Update simulation result for UI
      setSimulationResult({
        success: result.success,
        steps: result.steps.map(step => ({
          stepId: step.stepId,
          nodeId: step.nodeId,
          nodeName: step.nodeName,
          nodeType: step.nodeType,
          status: step.status,
          input: step.input,
          output: step.output,
          duration: step.duration,
          startTime: step.startTime,
        })),
        successCount: result.successCount,
        errorCount: result.errorCount,
        skippedCount: 0,
        totalDuration: result.totalDuration
      });

      // Show success message
      if (result.success) {
        alert(`✅ Workflow eseguito con successo! ${result.successCount} nodi completati in ${result.totalDuration}ms.`);
      } else {
        alert(`⚠️ Workflow completato con errori. ${result.successCount}/${result.steps.length} nodi riusciti. Controlla i dettagli nell'panel di simulazione.`);
      }

    } catch (error) {
      console.error('❌ Workflow execution failed:', error);
      alert('❌ Errore nell\'esecuzione: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
    } finally {
      setIsExecuting(false);
    }
  };

  // handleClearCanvas is already defined above with useCallback

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
              Genera con AI
            </button>

            <button
              onClick={handleSaveWorkflow}
              disabled={isSaving}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Salvataggio...' : 'Salva Workflow'}
            </button>
            
            <button
              onClick={handleRunWorkflow}
              disabled={isExecuting || nodes.length === 0}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4 mr-2" />
              {isExecuting ? 'Esecuzione...' : 'Esegui Workflow'}
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
              Pulisci Canvas
            </button>

            <div className="ml-auto text-sm text-gray-600">
              Nodi: {nodes.length} | Connessioni: {edges.length}
            </div>
          </div>

          {/* Canvas */}
          <div ref={reactFlowWrapper} className="flex-1 relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodesDelete={onNodesDelete}
              onEdgesDelete={onEdgesDelete}
              onInit={handleInit}
              onDrop={onDrop}
              onDragOver={onDragOver}
              fitView
              nodesDraggable={true}
              nodesConnectable={true}
              elementsSelectable={true}
              selectNodesOnDrag={false}
              deleteKeyCode={['Delete', 'Backspace']}
              className="bg-gradient-to-br from-gray-50 to-gray-100"
              defaultEdgeOptions={{
                type: 'smoothstep',
                animated: true,
                style: { 
                  stroke: '#6366f1', 
                  strokeWidth: 2,
                  filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
                }
              }}
              connectionLineStyle={{
                stroke: '#6366f1',
                strokeWidth: 2,
                strokeDasharray: '5,5'
              }}
            >
              <Background 
                color="#e5e7eb" 
                gap={20} 
                size={1}
                variant={BackgroundVariant.Dots}
              />
              <Controls 
                className="bg-white border border-gray-300 shadow-lg rounded-lg" 
                showZoom={true}
                showFitView={true}
                showInteractive={true}
              />
              <MiniMap 
                nodeColor={(node) => {
                  if (node.type === 'input') return '#3b82f6';
                  return '#10b981';
                }}
                className="bg-white border border-gray-300 shadow-lg rounded-lg"
                maskColor="rgba(50, 50, 50, 0.6)"
                position="bottom-right"
              />
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

      {/* Instructions */}
      <div className="bg-blue-50 border-t border-blue-200 p-3 text-sm text-blue-800">
        💡 <strong>Suggerimenti:</strong> Trascina nodi dalla sidebar | Clicca e trascina per muovere | 
        Seleziona + Canc per eliminare | Connetti trascinando dai punti di connessione | 
        Ctrl+S per salvare | Ctrl+A per selezionare tutto
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