/**
 * Workflow Simulation Panel
 * 
 * Displays real-time execution log of workflow simulation with status indicators and timing.
 * Fixed position at bottom-right of the workflow canvas.
 */

import { SimulationResult, SimulationStep } from '@/lib/workflowSimulator';
import { Beaker, CheckCircle2, ChevronDown, ChevronUp, Clock, Loader2, MinusCircle, X, XCircle } from 'lucide-react';
import React, { useState } from 'react';

interface WorkflowSimulationPanelProps {
    /** Array of simulation steps to display */
    steps: SimulationStep[];
    /** Whether simulation is currently running */
    isRunning: boolean;
    /** Final simulation result (when complete) */
    result?: SimulationResult;
    /** Callback to close the panel */
    onClose: () => void;
}

/**
 * Get status icon and color for a simulation step
 */
function getStatusDisplay(status: SimulationStep['status']): {
    icon: React.ReactNode;
    color: string;
    label: string;
} {
    switch (status) {
        case 'pending':
            return {
                icon: <Clock className="w-4 h-4" />,
                color: 'text-gray-400',
                label: 'In attesa',
            };
        case 'running':
            return {
                icon: <Loader2 className="w-4 h-4 animate-spin" />,
                color: 'text-blue-500',
                label: 'In esecuzione',
            };
        case 'success':
            return {
                icon: <CheckCircle2 className="w-4 h-4" />,
                color: 'text-green-500',
                label: 'Completato',
            };
        case 'error':
            return {
                icon: <XCircle className="w-4 h-4" />,
                color: 'text-red-500',
                label: 'Errore',
            };
        case 'skipped':
            return {
                icon: <MinusCircle className="w-4 h-4" />,
                color: 'text-yellow-500',
                label: 'Saltato',
            };
    }
}

/**
 * Format duration in milliseconds to readable string
 */
function formatDuration(ms: number): string {
    if (ms < 1000) {
        return `${ms}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Workflow Simulation Panel Component
 */
export default function WorkflowSimulationPanel({
    steps,
    isRunning,
    result,
    onClose,
}: WorkflowSimulationPanelProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

    const toggleStepExpand = (stepId: number) => {
        const newExpanded = new Set(expandedSteps);
        if (newExpanded.has(stepId)) {
            newExpanded.delete(stepId);
        } else {
            newExpanded.add(stepId);
        }
        setExpandedSteps(newExpanded);
    };

    return (
        <div
            className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-2xl overflow-hidden z-50"
            style={{
                width: isCollapsed ? '320px' : '480px',
                maxHeight: isCollapsed ? '60px' : '600px',
            }}
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                    <Beaker className="w-5 h-5" />
                    <span className="font-semibold">
                        {isRunning ? 'Simulazione in corso...' : 'Simulazione completata'}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Collapse/Expand button */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="text-white hover:bg-orange-700 p-1 rounded transition"
                        title={isCollapsed ? 'Espandi' : 'Riduci'}
                    >
                        {isCollapsed ? (
                            <ChevronUp className="w-4 h-4" />
                        ) : (
                            <ChevronDown className="w-4 h-4" />
                        )}
                    </button>

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-orange-700 p-1 rounded transition"
                        title="Chiudi"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content (visible when not collapsed) */}
            {!isCollapsed && (
                <div className="flex flex-col h-full">
                    {/* Summary Stats */}
                    {result && !isRunning && (
                        <div className="bg-gray-50 border-b border-gray-200 p-3">
                            <div className="grid grid-cols-4 gap-3 text-center">
                                <div>
                                    <div className="text-xs text-gray-500">Tempo Totale</div>
                                    <div className="text-lg font-semibold text-gray-800">
                                        {formatDuration(result.totalDuration)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500">Completati</div>
                                    <div className="text-lg font-semibold text-green-600">
                                        {result.successCount}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500">Errori</div>
                                    <div className="text-lg font-semibold text-red-600">
                                        {result.errorCount}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500">Saltati</div>
                                    <div className="text-lg font-semibold text-yellow-600">
                                        {result.skippedCount}
                                    </div>
                                </div>
                            </div>

                            {/* Success Rate */}
                            <div className="mt-2">
                                <div className="text-xs text-gray-500 mb-1">Tasso di Successo</div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${
                                            result.success ? 'bg-green-500' : 'bg-red-500'
                                        }`}
                                        style={{
                                            width: `${
                                                result.steps.length > 0
                                                    ? (result.successCount / result.steps.length) * 100
                                                    : 0
                                            }%`,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Execution Log */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ maxHeight: '460px' }}>
                        {steps.length === 0 && (
                            <div className="text-center text-gray-400 py-8">
                                <Beaker className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>Avvio simulazione...</p>
                            </div>
                        )}

                        {steps.map((step) => {
                            const statusDisplay = getStatusDisplay(step.status);
                            const isExpanded = expandedSteps.has(step.stepId);

                            return (
                                <div
                                    key={step.stepId}
                                    className={`border rounded-lg p-2 transition-all ${
                                        step.status === 'error'
                                            ? 'border-red-300 bg-red-50'
                                            : step.status === 'success'
                                            ? 'border-green-200 bg-green-50'
                                            : step.status === 'running'
                                            ? 'border-blue-300 bg-blue-50'
                                            : 'border-gray-200 bg-white'
                                    }`}
                                >
                                    {/* Step Header */}
                                    <button
                                        onClick={() => toggleStepExpand(step.stepId)}
                                        className="w-full flex items-start gap-2 text-left"
                                    >
                                        <div className={`mt-0.5 ${statusDisplay.color}`}>
                                            {statusDisplay.icon}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-medium text-sm text-gray-800 truncate">
                                                    {step.nodeName}
                                                </span>
                                                {step.duration > 0 && (
                                                    <span className="text-xs text-gray-500 whitespace-nowrap">
                                                        {formatDuration(step.duration)}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="text-xs text-gray-500">
                                                <span className="font-mono">{step.nodeType}</span>
                                                <span className="mx-1">•</span>
                                                <span className={statusDisplay.color}>
                                                    {statusDisplay.label}
                                                </span>
                                            </div>

                                            {step.error && !isExpanded && (
                                                <div className="text-xs text-red-600 mt-1 truncate">
                                                    ⚠️ {step.error}
                                                </div>
                                            )}
                                        </div>

                                        <ChevronDown
                                            className={`w-4 h-4 text-gray-400 transition-transform ${
                                                isExpanded ? 'rotate-180' : ''
                                            }`}
                                        />
                                    </button>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
                                            {/* Error Message */}
                                            {step.error && (
                                                <div className="bg-red-100 border border-red-200 rounded p-2">
                                                    <div className="text-xs font-semibold text-red-800 mb-1">
                                                        Errore:
                                                    </div>
                                                    <div className="text-xs text-red-700">{step.error}</div>
                                                </div>
                                            )}

                                            {/* Input Data */}
                                            {Object.keys(step.input).length > 0 && (
                                                <div>
                                                    <div className="text-xs font-semibold text-gray-600 mb-1">
                                                        Input:
                                                    </div>
                                                    <pre className="text-xs bg-gray-100 rounded p-2 overflow-x-auto">
                                                        {JSON.stringify(step.input, null, 2)}
                                                    </pre>
                                                </div>
                                            )}

                                            {/* Output Data */}
                                            {step.output && Object.keys(step.output).length > 0 && (
                                                <div>
                                                    <div className="text-xs font-semibold text-gray-600 mb-1">
                                                        Output:
                                                    </div>
                                                    <pre className="text-xs bg-gray-100 rounded p-2 overflow-x-auto">
                                                        {JSON.stringify(step.output, null, 2)}
                                                    </pre>
                                                </div>
                                            )}

                                            {/* Timing Info */}
                                            <div className="text-xs text-gray-500">
                                                <span className="font-semibold">Eseguito:</span>{' '}
                                                {new Date(step.startTime).toLocaleTimeString('it-IT')}
                                                {step.endTime && (
                                                    <>
                                                        {' → '}
                                                        {new Date(step.endTime).toLocaleTimeString('it-IT')}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer with final error (if any) */}
                    {result && result.error && !isRunning && (
                        <div className="bg-red-50 border-t border-red-200 p-3">
                            <div className="flex items-start gap-2">
                                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-sm font-semibold text-red-800">
                                        Simulazione fallita
                                    </div>
                                    <div className="text-xs text-red-700 mt-1">{result.error}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Running indicator */}
                    {isRunning && (
                        <div className="bg-blue-50 border-t border-blue-200 p-3">
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                <div className="text-sm text-blue-800">
                                    Esecuzione in corso... ({steps.length} step completati)
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
