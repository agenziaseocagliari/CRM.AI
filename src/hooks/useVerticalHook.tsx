import { useContext } from 'react';
import { VerticalContext } from '@/contexts/VerticalContext';

// Hook to use the vertical context
export function useVertical() {
  const context = useContext(VerticalContext);
  if (!context) {
    throw new Error('useVertical must be used within a VerticalProvider');
  }
  return context;
}