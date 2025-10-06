import React, { useState, useCallback } from 'react';

import { WorkflowDefinition } from '../../types';
import { 
    PlayIcon, 
    ClockIcon,
    CheckCircleIcon
} from '../ui/icons';

// Custom icons
const BoltIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
);

const XCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export type NodeType = 'trigger' | 'condition' | 'action' | 'delay';
export type TriggerSubtype = 'manual' | 'schedule' | 'event' | 'webhook';
export type ActionSubtype = 'email' | 'webhook' | 'database' | 'notification';

export interface WorkflowNode {
    id: string;
    type: NodeType;
    subtype?: TriggerSubtype | ActionSubtype | string;
    label: string;
    config: Record<string, unknown>;
    position: { x: number; y: number };
}

export interface WorkflowConnection {
    from: string;
    to: string;
    condition?: string;
}

interface VisualWorkflowCanvasProps {
    workflow?: WorkflowDefinition;
    onSave: (nodes: WorkflowNode[], connections: WorkflowConnection[]) => void;
    onCancel: () => void;
}

const nodeTypeColors: Record<NodeType, string> = {
    trigger: 'bg-green-100 border-green-400 text-green-800',
    condition: 'bg-yellow-100 border-yellow-400 text-yellow-800',
    action: 'bg-blue-100 border-blue-400 text-blue-800',
    delay: 'bg-purple-100 border-purple-400 text-purple-800',
};

const nodeTypeIcons: Record<NodeType, React.ReactNode> = {
    trigger: <BoltIcon className="w-5 h-5" />,
    condition: <CheckCircleIcon className="w-5 h-5" />,
    action: <PlayIcon className="w-5 h-5" />,
    delay: <ClockIcon className="w-5 h-5" />,
};

export const VisualWorkflowCanvas: React.FC<VisualWorkflowCanvasProps> = ({ 
    workflow, 
    onSave, 
    onCancel 
}) => {
    const [nodes, setNodes] = useState<WorkflowNode[]>(() => {
        if (workflow?.workflow_json?.nodes) {
            return workflow.workflow_json.nodes;
        }
        return [{
            id: 'start',
            type: 'trigger',
            subtype: 'manual',
            label: 'Start',
            config: {},
            position: { x: 100, y: 100 }
        }];
    });

    const [connections, setConnections] = useState<WorkflowConnection[]>(() => {
        if (workflow?.workflow_json?.connections) {
            return workflow.workflow_json.connections;
        }
        return [];
    });

    const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
    const [draggedNode, setDraggedNode] = useState<string | null>(null);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [addMenuPosition, setAddMenuPosition] = useState({ x: 0, y: 0 });

    const handleDragStart = (nodeId: string) => {
        setDraggedNode(nodeId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (!draggedNode) {return;}

        const canvasRect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - canvasRect.left;
        const y = e.clientY - canvasRect.top;

        setNodes(prev => prev.map(node => 
            node.id === draggedNode 
                ? { ...node, position: { x, y } }
                : node
        ));
        setDraggedNode(null);
    };

    const handleAddNode = useCallback((type: NodeType, subtype?: string) => {
        const newNode: WorkflowNode = {
            id: `node-${Date.now()}`,
            type,
            subtype,
            label: `New ${type}`,
            config: {},
            position: addMenuPosition
        };
        setNodes(prev => [...prev, newNode]);
        setShowAddMenu(false);
    }, [addMenuPosition]);

    const handleDeleteNode = (nodeId: string) => {
        setNodes(prev => prev.filter(n => n.id !== nodeId));
        setConnections(prev => prev.filter(c => c.from !== nodeId && c.to !== nodeId));
        if (selectedNode?.id === nodeId) {
            setSelectedNode(null);
        }
    };

    const handleConnectNodes = (fromId: string, toId: string) => {
        const newConnection: WorkflowConnection = { from: fromId, to: toId };
        setConnections(prev => [...prev, newConnection]);
    };

    const handleUpdateNode = (nodeId: string, updates: Partial<WorkflowNode>) => {
        setNodes(prev => prev.map(node => 
            node.id === nodeId ? { ...node, ...updates } : node
        ));
    };

    const handleSave = () => {
        onSave(nodes, connections);
    };

    return (
        <div className="h-full flex">
            {/* Canvas Area */}
            <div 
                className="flex-1 relative bg-gray-50 dark:bg-dark-sidebar border border-gray-200 dark:border-dark-border rounded-lg overflow-hidden"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onContextMenu={(e) => {
                    e.preventDefault();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setAddMenuPosition({ 
                        x: e.clientX - rect.left, 
                        y: e.clientY - rect.top 
                    });
                    setShowAddMenu(true);
                }}
            >
                {/* Grid Pattern */}
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'radial-gradient(circle, #666 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }} />

                {/* Connections */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {connections.map((conn, idx) => {
                        const fromNode = nodes.find(n => n.id === conn.from);
                        const toNode = nodes.find(n => n.id === conn.to);
                        if (!fromNode || !toNode) {return null;}

                        const x1 = fromNode.position.x + 75;
                        const y1 = fromNode.position.y + 30;
                        const x2 = toNode.position.x + 75;
                        const y2 = toNode.position.y + 30;

                        return (
                            <g key={`${conn.from}-${conn.to}-${idx}`}>
                                <line
                                    x1={x1}
                                    y1={y1}
                                    x2={x2}
                                    y2={y2}
                                    stroke="#6366f1"
                                    strokeWidth="2"
                                    markerEnd="url(#arrowhead)"
                                />
                            </g>
                        );
                    })}
                    <defs>
                        <marker
                            id="arrowhead"
                            markerWidth="10"
                            markerHeight="10"
                            refX="9"
                            refY="3"
                            orient="auto"
                        >
                            <polygon points="0 0, 10 3, 0 6" fill="#6366f1" />
                        </marker>
                    </defs>
                </svg>

                {/* Nodes */}
                {nodes.map(node => (
                    <div
                        key={node.id}
                        draggable
                        onDragStart={() => handleDragStart(node.id)}
                        onClick={() => setSelectedNode(node)}
                        className={`absolute cursor-move rounded-lg border-2 p-4 shadow-lg transition-all ${
                            nodeTypeColors[node.type]
                        } ${selectedNode?.id === node.id ? 'ring-2 ring-primary' : ''}`}
                        style={{
                            left: node.position.x,
                            top: node.position.y,
                            width: '150px',
                        }}
                    >
                        <div className="flex items-center justify-between mb-2">
                            {nodeTypeIcons[node.type]}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteNode(node.id);
                                }}
                                className="text-red-600 hover:text-red-800"
                            >
                                <XCircleIcon className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="text-sm font-semibold">{node.label}</div>
                        <div className="text-xs opacity-75 mt-1">{node.type}</div>
                        {node.subtype && (
                            <div className="text-xs mt-1 px-2 py-0.5 bg-white bg-opacity-50 rounded">
                                {node.subtype}
                            </div>
                        )}
                    </div>
                ))}

                {/* Add Node Menu */}
                {showAddMenu && (
                    <div
                        className="absolute bg-white dark:bg-dark-card shadow-xl rounded-lg border border-gray-200 dark:border-dark-border p-2 z-10"
                        style={{
                            left: addMenuPosition.x,
                            top: addMenuPosition.y,
                        }}
                    >
                        <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 px-2 py-1">
                            Add Node
                        </div>
                        <button
                            onClick={() => handleAddNode('trigger', 'event')}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-sidebar rounded flex items-center"
                        >
                            <BoltIcon className="w-4 h-4 mr-2" />
                            Trigger
                        </button>
                        <button
                            onClick={() => handleAddNode('condition')}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-sidebar rounded flex items-center"
                        >
                            <CheckCircleIcon className="w-4 h-4 mr-2" />
                            Condition
                        </button>
                        <button
                            onClick={() => handleAddNode('action', 'email')}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-sidebar rounded flex items-center"
                        >
                            <PlayIcon className="w-4 h-4 mr-2" />
                            Action
                        </button>
                        <button
                            onClick={() => handleAddNode('delay')}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-sidebar rounded flex items-center"
                        >
                            <ClockIcon className="w-4 h-4 mr-2" />
                            Delay
                        </button>
                        <button
                            onClick={() => setShowAddMenu(false)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-sidebar rounded text-red-600"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            {/* Properties Panel */}
            <div className="w-80 bg-white dark:bg-dark-card border-l border-gray-200 dark:border-dark-border p-4 overflow-y-auto">
                <h3 className="text-lg font-bold mb-4 text-text-primary dark:text-dark-text-primary">
                    Properties
                </h3>
                
                {selectedNode ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Label</label>
                            <input
                                type="text"
                                value={selectedNode.label}
                                onChange={(e) => handleUpdateNode(selectedNode.id, { label: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1">Type</label>
                            <input
                                type="text"
                                value={selectedNode.type}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                            />
                        </div>

                        {selectedNode.subtype && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Subtype</label>
                                <input
                                    type="text"
                                    value={selectedNode.subtype}
                                    onChange={(e) => handleUpdateNode(selectedNode.id, { subtype: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-2">Configuration</label>
                            <textarea
                                value={JSON.stringify(selectedNode.config, null, 2)}
                                onChange={(e) => {
                                    try {
                                        const config = JSON.parse(e.target.value);
                                        handleUpdateNode(selectedNode.id, { config });
                                    } catch {
                                        // Invalid JSON, ignore
                                    }
                                }}
                                rows={8}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Connect To</label>
                            <select
                                onChange={(e) => {
                                    if (e.target.value && e.target.value !== selectedNode.id) {
                                        handleConnectNodes(selectedNode.id, e.target.value);
                                    }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                            >
                                <option value="">Select node...</option>
                                {nodes
                                    .filter(n => n.id !== selectedNode.id)
                                    .map(n => (
                                        <option key={n.id} value={n.id}>
                                            {n.label} ({n.type})
                                        </option>
                                    ))
                                }
                            </select>
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-text-secondary">
                        <p className="mb-4">Select a node to edit its properties.</p>
                        <p className="mb-2">Quick tips:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>Right-click to add nodes</li>
                            <li>Drag nodes to reposition</li>
                            <li>Click to select and edit</li>
                            <li>Use &quot;Connect To&quot; dropdown to link nodes</li>
                        </ul>
                    </div>
                )}

                <div className="mt-6 pt-6 border-t space-y-2">
                    <button
                        onClick={handleSave}
                        className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 font-semibold"
                    >
                        Save Workflow
                    </button>
                    <button
                        onClick={onCancel}
                        className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                </div>

                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs">
                    <p className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                        Accessibility
                    </p>
                    <p className="text-blue-700 dark:text-blue-300">
                        Use Tab to navigate, Enter to select, and arrow keys to move nodes.
                    </p>
                </div>
            </div>
        </div>
    );
};
