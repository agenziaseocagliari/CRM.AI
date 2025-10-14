import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import ProductionErrorBoundary from './components/ProductionErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

// Debug logging per produzione
console.log('🚀 Inizializzazione app...');
console.log('Environment:', {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  MODE: import.meta.env.MODE,
  PROD: import.meta.env.PROD,
});

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('❌ Root element non trovato!');
    throw new Error('Failed to find the root element');
  }
  
  console.log('✅ Root element trovato, creando app...');
  
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ProductionErrorBoundary>
        <ErrorBoundary>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </ErrorBoundary>
      </ProductionErrorBoundary>
    </React.StrictMode>,
  );
  
  console.log('✅ App renderizzata con successo!');
} catch (error) {
  console.error('❌ Errore durante l\'inizializzazione:', error);
  // Fallback per errori critici
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : 'Stack non disponibile';
    rootElement.innerHTML = `
      <div style="padding: 20px; background: #fee; border: 2px solid #f00; margin: 20px; border-radius: 8px;">
        <h1>❌ Errore di Inizializzazione</h1>
        <p><strong>Errore:</strong> ${errorMessage}</p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
        <details>
          <summary>Dettagli Tecnici</summary>
          <pre>${errorStack}</pre>
        </details>
      </div>
    `;
  }
}
