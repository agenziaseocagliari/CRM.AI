import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useCrmData } from '../hooks/useCrmData';

export const TestComponent: React.FC = () => {
  console.log('🧪 TestComponent is rendering');
  
  try {
    const contextData = useOutletContext<ReturnType<typeof useCrmData>>();
    console.log('🧪 Context data received:', contextData);
    
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">🧪 Test Component</h1>
        <div className="bg-green-100 p-4 rounded">
          <p>✅ Component is working!</p>
          <p>Context loaded: {contextData ? 'Yes' : 'No'}</p>
          <p>Organization: {contextData?.organization?.name || 'Not loaded'}</p>
        </div>
      </div>
    );
  } catch (error) {
    console.error('🧪 TestComponent error:', error);
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4 text-red-600">🧪 Test Component ERROR</h1>
        <div className="bg-red-100 p-4 rounded">
          <p>❌ Error: {String(error)}</p>
        </div>
      </div>
    );
  }
};