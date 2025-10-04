import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '2px solid #ff6b6b',
          borderRadius: '8px',
          backgroundColor: '#ffe0e0',
          fontFamily: 'Arial, sans-serif'
        }}>
          <h2 style={{ color: '#d63031', marginBottom: '16px' }}>
            🚨 Application Error
          </h2>
          <p style={{ marginBottom: '16px' }}>
            Something went wrong during app initialization. This might be due to:
          </p>
          <ul style={{ marginBottom: '16px', paddingLeft: '20px' }}>
            <li>Missing or incorrect environment variables</li>
            <li>Network connectivity issues</li>
            <li>JavaScript execution errors</li>
          </ul>
          
          <details style={{ marginBottom: '16px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              📋 Technical Details
            </summary>
            <div style={{
              marginTop: '10px',
              padding: '10px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'monospace',
              overflowX: 'auto'
            }}>
              <strong>Error:</strong> {this.state.error?.message}<br />
              <strong>Stack:</strong><br />
              <pre>{this.state.error?.stack}</pre>
              {this.state.errorInfo && (
                <>
                  <strong>Component Stack:</strong><br />
                  <pre>{this.state.errorInfo.componentStack}</pre>
                </>
              )}
            </div>
          </details>

          <div style={{ marginBottom: '16px' }}>
            <strong>Environment Check:</strong>
            <ul style={{ marginTop: '8px', paddingLeft: '20px', fontSize: '14px' }}>
              <li>VITE_SUPABASE_URL: {(import.meta as unknown as { env: Record<string, string | undefined> }).env?.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</li>
              <li>VITE_SUPABASE_ANON_KEY: {(import.meta as unknown as { env: Record<string, string | undefined> }).env?.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</li>
              <li>VITE_APP_ENV: {(import.meta as unknown as { env: Record<string, string | undefined> }).env?.VITE_APP_ENV || 'Not set'}</li>
            </ul>
          </div>

          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#0984e3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔄 Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}