import type { NodeDefinition } from '@/lib/nodes/nodeLibrary';
// useWorkflows removed - using SavedWorkflowsPanel's database save instead
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
import { AlertTriangle, Beaker, ChevronDown, Play, Redo, Sparkles, Trash2, Undo } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import '../../styles/workflowCanvas.css';
import CustomNode from './CustomNode';
import GenerateWorkflowModal from './GenerateWorkflowModal';
import { useUndoRedo } from './hooks/useUndoRedo';
import NodeConfigPanel from './NodeConfigPanel';
import NodeSidebar from './NodeSidebar';
import SavedWorkflowsPanel from './SavedWorkflowsPanel';
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
  // isSaving state removed - using SavedWorkflowsPanel's database save instead
  const [isExecuting, setIsExecuting] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  // ReactFlow refs and state for drag-drop
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  
  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSteps, setSimulationSteps] = useState<SimulationStep[]>([]);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | undefined>();

  // Enterprise features state
  const [selectedNodeForConfig, setSelectedNodeForConfig] = useState<Node | null>(null);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Saved workflows state
  const [workflowsKey, setWorkflowsKey] = useState(0);

  // Workflow management hooks
  // createWorkflow removed - using SavedWorkflowsPanel's database save instead

  // Undo/Redo functionality
  const { undo, redo, canUndo, canRedo, takeSnapshot } = useUndoRedo(nodes, edges, setNodes, setEdges);

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

  // handleSaveWorkflow removed - using SavedWorkflowsPanel's database save instead

  // Keyboard shortcuts with enterprise features
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + S = Save (show hint to use panel button)
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        alert('💾 Usa il pulsante "Salva Workflow Corrente" nel pannello in basso per salvare nel database');
      }
      
      // Ctrl/Cmd + A = Select All
      if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        event.preventDefault();
        setNodes(nds => nds.map(n => ({ ...n, selected: true })));
        setEdges(eds => eds.map(e => ({ ...e, selected: true })));
        console.log('✅ All elements selected');
      }

      // Ctrl/Cmd + Z = Undo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
      }

      // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z = Redo
      if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
        event.preventDefault();
        redo();
      }

      // Delete key = Delete selected
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const selectedNodes = nodes.filter(n => n.selected);
        const selectedEdges = edges.filter(e => e.selected);
        
        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
          takeSnapshot(); // Save state before deletion for undo
        }
        
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
  }, [nodes, edges, onNodesDelete, onEdgesDelete, setNodes, setEdges, undo, redo, takeSnapshot]);

  // Delete node event listener for custom node X button
  useEffect(() => {
    const handleDeleteNode = (event: CustomEvent<{ nodeId: string }>) => {
      const nodeId = event.detail.nodeId;
      takeSnapshot(); // Save state for undo
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      console.log('🗑️ Node deleted via X button:', nodeId);
    };
    
    window.addEventListener('deleteNode', handleDeleteNode as EventListener);
    return () => window.removeEventListener('deleteNode', handleDeleteNode as EventListener);
  }, [setNodes, setEdges, takeSnapshot]);

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

  // Double-click handler for node configuration
  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodeForConfig(node);
    setIsConfigPanelOpen(true);
    console.log('🔧 Opening config for:', node.data.label);
  }, []);

  // Config save handler
  const handleSaveNodeConfig = useCallback((nodeId: string, config: Record<string, string | number>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, config } }
          : node
      )
    );
    console.log('✅ Node config saved:', nodeId, config);
    takeSnapshot(); // Save state for undo/redo
  }, [setNodes, takeSnapshot]);

  // Workflow validation
  const validateWorkflow = useCallback(() => {
    const errors: string[] = [];

    // Check if there's at least one trigger
    const triggers = nodes.filter(n => n.data.category === 'trigger');
    if (triggers.length === 0) {
      errors.push('⚠️ Workflow deve avere almeno un trigger');
    }

    // Check if nodes are connected
    const connectedNodeIds = new Set(edges.flatMap(e => [e.source, e.target]));
    const disconnectedNodes = nodes.filter(n => !connectedNodeIds.has(n.id) && nodes.length > 1);
    if (disconnectedNodes.length > 0) {
      errors.push(`⚠️ ${disconnectedNodes.length} nodi non connessi`);
    }

    // Check if nodes need configuration
    const unconfiguredNodes = nodes.filter(n =>
      n.data.category !== 'trigger' &&
      (!n.data.config || Object.keys(n.data.config).length === 0)
    );
    if (unconfiguredNodes.length > 0) {
      errors.push(`⚠️ ${unconfiguredNodes.length} nodi richiedono configurazione`);
    }

    setValidationErrors(errors);
    return errors;
  }, [nodes, edges]);

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

  // Handler to load workflow from saved workflows panel
  const handleLoadWorkflow = useCallback((nodes: Node[], edges: Edge[]) => {
    setNodes(nodes);
    setEdges(edges);
    console.log('✅ Workflow caricato:', nodes.length, 'nodi');
  }, [setNodes, setEdges]);

  // Handler for workflow saved callback
  const handleWorkflowSaved = useCallback(() => {
    // Refresh workflows list
    setWorkflowsKey(prev => prev + 1);
  }, []);

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
      <div className="flex flex-col h-full overflow-hidden">
        {/* Top Section: Sidebar + Canvas */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* Desktop Sidebar - Independent scroll container */}
          <div className="hidden lg:flex lg:flex-col lg:w-[150px] xl:w-[180px] border-r overflow-y-auto flex-shrink-0">
            <NodeSidebar />
          </div>
          
          {/* Mobile Sidebar - Collapsible with proper height */}
          <div className="lg:hidden flex-shrink-0">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="w-full bg-gray-100 px-4 py-3 flex items-center justify-between border-b"
            >
              <span className="font-medium text-sm">📋 Nodi Disponibili</span>
              <ChevronDown className={`w-5 h-5 transition-transform ${mobileSidebarOpen ? 'rotate-180' : ''}`} />
            </button>
            {mobileSidebarOpen && (
              <div className="border-b max-h-[40vh] overflow-y-auto bg-white">
                <NodeSidebar />
              </div>
            )}
          </div>
          
          {/* Canvas Container - CRITICAL: Must have min-h-0 and min-w-0 */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
            {/* Toolbar - MUST BE flex-shrink-0 */}
            <div className="flex-shrink-0 bg-white border-b px-2 sm:px-4 py-2 sm:py-3">
              <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 -mb-1">{/* Genera AI */}
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 bg-purple-600 text-white rounded text-xs sm:text-sm whitespace-nowrap flex items-center gap-1 sm:gap-2 hover:bg-purple-700"
                >
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Genera con AI</span>
                  <span className="sm:hidden">AI</span>
                </button>

                {/* Esegui Workflow */}
                <button
                  onClick={handleRunWorkflow}
                  disabled={isExecuting || nodes.length === 0}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 bg-green-600 text-white rounded text-xs sm:text-sm whitespace-nowrap flex items-center gap-1 sm:gap-2 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{isExecuting ? 'Esecuzione...' : 'Esegui'}</span>
                  <span className="sm:hidden">▶️</span>
                </button>

                {/* Simula Workflow */}
                <button
                  onClick={handleSimulateWorkflow}
                  disabled={isSimulating || nodes.length === 0}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 bg-orange-600 text-white rounded text-xs sm:text-sm whitespace-nowrap flex items-center gap-1 sm:gap-2 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Beaker className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{isSimulating ? 'Simulazione...' : 'Simula'}</span>
                  <span className="sm:hidden">🧪</span>
                </button>

                {/* Pulisci Canvas */}
                <button
                  onClick={handleClearCanvas}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 bg-red-600 text-white rounded text-xs sm:text-sm whitespace-nowrap flex items-center gap-1 sm:gap-2 hover:bg-red-700"
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Pulisci</span>
                  <span className="sm:hidden">🗑️</span>
                </button>

                {/* Enterprise Features - Hidden on mobile */}
                <div className="hidden sm:flex border-l border-gray-300 ml-2 pl-2 items-center gap-2">
                  <button
                    onClick={undo}
                    disabled={!canUndo}
                    className="flex items-center px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Annulla (Ctrl+Z)"
                  >
                    <Undo className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={redo}
                    disabled={!canRedo}
                    className="flex items-center px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Ripeti (Ctrl+Y)"
                  >
                    <Redo className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={validateWorkflow}
                    className="flex items-center px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                    title="Valida Workflow"
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </button>
                </div>

                {/* Stats - Responsive */}
                <div className="ml-auto text-[10px] sm:text-xs text-gray-600 flex items-center gap-2 sm:gap-3 px-2">
                  <span>Nodi: {nodes.length}</span>
                  <span className="hidden sm:inline">|</span>
                  <span>Connessioni: {edges.length}</span>
                  {validationErrors.length > 0 && (
                    <span className="text-yellow-600">
                      ⚠️ {validationErrors.length}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* ReactFlow Canvas - CRITICAL: Must have explicit height and touch handling */}
            <div ref={reactFlowWrapper} className="flex-1 min-h-0 relative bg-gray-50 touch-none">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={{ default: CustomNode, input: CustomNode }}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodesDelete={onNodesDelete}
                onEdgesDelete={onEdgesDelete}
                onNodeDoubleClick={onNodeDoubleClick}
                onInit={handleInit}
                onDrop={onDrop}
                onDragOver={onDragOver}
                fitView
                fitViewOptions={{
                  padding: 0.2,
                  includeHiddenNodes: false,
                }}
                minZoom={0.2}
                maxZoom={1.5}
                defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
                panOnDrag={true}
                panOnScroll={false}
                zoomOnScroll={false}
                zoomOnPinch={true}
                preventScrolling={true}
                nodesDraggable={true}
                nodesConnectable={true}
                elementsSelectable={true}
                selectNodesOnDrag={false}
                deleteKeyCode={['Delete', 'Backspace']}
                className="absolute inset-0 touch-pan-x touch-pan-y bg-gradient-to-br from-gray-50 to-gray-100"
                style={{ 
                  width: '100%', 
                  height: '100%',
                  touchAction: 'none'
                }}
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
                  gap={16} 
                  size={1}
                  variant={BackgroundVariant.Dots}
                />
                <Controls 
                  className="!bottom-20 !left-4 bg-white border border-gray-300 shadow-lg rounded-lg" 
                  showZoom={true}
                  showFitView={true}
                  showInteractive={false}
                />
                <MiniMap 
                  nodeColor={(node) => {
                    if (node.type === 'input') return '#3b82f6';
                    return '#10b981';
                  }}
                  className="hidden lg:block !bottom-4 !right-4 bg-white border border-gray-300 shadow-lg rounded-lg"
                  maskColor="rgba(50, 50, 50, 0.6)"
                  nodeStrokeWidth={3}
                  position="bottom-right"
                />
              </ReactFlow>
            </div>
          </div>
        </div>

        {/* Bottom Panel - Responsive with proper scrolling - IMPROVED HEIGHT */}
        <div className="flex-shrink-0 h-64 lg:h-80 border-t bg-white overflow-auto">
          <SavedWorkflowsPanel
            key={workflowsKey}
            onLoadWorkflow={handleLoadWorkflow}
            currentNodes={nodes}
            currentEdges={edges}
            onWorkflowSaved={handleWorkflowSaved}
          />
        </div>

        {/* Instructions - Responsive */}  
        <div className="bg-blue-50 border-t border-blue-200 p-2 sm:p-3 text-xs sm:text-sm text-blue-800">
          💡 <strong className="hidden sm:inline">Suggerimenti Enterprise:</strong>
          <strong className="sm:hidden">Suggerimenti:</strong>
          <span className="hidden lg:inline"> Trascina nodi dalla sidebar | Doppio-click per configurare | 
          Seleziona + Canc per eliminare | Connetti trascinando dai punti di connessione | 
          Ctrl+S per salvare | Ctrl+Z/Y per annulla/ripeti | Hover sui nodi per info</span>
          <span className="lg:hidden"> Trascina nodi | Doppio-click per configurare | Ctrl+S salva</span>
        </div>
      </div>

      {/* AI Generation Modal */}
      <GenerateWorkflowModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onGenerate={handleGeneratedWorkflow}
      />

      {/* Node Configuration Panel */}
      <NodeConfigPanel
        node={selectedNodeForConfig}
        isOpen={isConfigPanelOpen}
        onClose={() => setIsConfigPanelOpen(false)}
        onSave={handleSaveNodeConfig}
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

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded shadow-lg max-w-sm">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
            <h4 className="text-sm font-medium text-yellow-800">Avvisi Workflow</h4>
          </div>
          <div className="mt-2 text-sm text-yellow-700">
            {validationErrors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        </div>
      )}
    </ReactFlowProvider>
  );
}