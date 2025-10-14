import React from 'react';
import { createRoot } from 'react-dom/client';

// Test minimale per verificare se React si carica
function MinimalApp() {
  console.log('MinimalApp component rendered');
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>🟢 React App Funzionante!</h1>
      <p>Se vedi questo messaggio, React sta funzionando correttamente.</p>
      <p>Timestamp: {new Date().toLocaleString()}</p>
    </div>
  );
}

// Log per debug
console.log('Script main caricato');
console.log('Environment variables:', {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  NODE_ENV: import.meta.env.MODE,
  PROD: import.meta.env.PROD,
});

const container = document.getElementById('root');
if (container) {
  console.log('Container root trovato');
  const root = createRoot(container);
  root.render(<MinimalApp />);
  console.log('App renderizzata');
} else {
  console.error('Container #root non trovato!');
}