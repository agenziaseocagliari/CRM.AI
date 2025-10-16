import { useState, useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';

interface HistoryItem {
  nodes: Node[];
  edges: Edge[];
}

export function useUndoRedo(
  nodes: Node[],
  edges: Edge[],
  setNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void,
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void
) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const takeSnapshot = useCallback(() => {
    const snapshot: HistoryItem = { nodes: [...nodes], edges: [...edges] };
    
    setHistory(prev => {
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(snapshot);
      
      // Limit history to 50 items
      if (newHistory.length > 50) {
        newHistory.shift();
        return newHistory;
      }
      
      return newHistory;
    });
    
    setCurrentIndex(prev => Math.min(prev + 1, 49));
  }, [nodes, edges, currentIndex]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      const prevState = history[currentIndex - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setCurrentIndex(currentIndex - 1);
      console.log('↶ Undo applied');
    }
  }, [history, currentIndex, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      const nextState = history[currentIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setCurrentIndex(currentIndex + 1);
      console.log('↷ Redo applied');
    }
  }, [history, currentIndex, setNodes, setEdges]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return {
    takeSnapshot,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}