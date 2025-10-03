import React from 'react';
import ReactDOM from 'react-dom/client';
// FIX: Corrected the import for BrowserRouter from 'react-router-dom' to resolve module export errors.
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);