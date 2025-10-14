import React, { Component, ErrorInfo } from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ProductionErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error to production monitoring
    console.error('Production Error Boundary caught an error:', error, errorInfo);
    
    // Optional: Send to error tracking service
    // Example: Sentry.captureException(error, { contexts: { errorInfo } });
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Oops! Qualcosa è andato storto
              </h2>
              <p className="text-gray-600 mb-6">
                Si è verificato un errore inaspettato. Il nostro team è stato notificato e stiamo lavorando per risolverlo.
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Ricarica la pagina
              </button>
              
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors font-medium"
              >
                Riprova
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm font-medium text-gray-600 mb-2">
                  Dettagli errore (solo sviluppo)
                </summary>
                <div className="bg-red-50 p-3 rounded text-xs font-mono text-red-800 overflow-auto max-h-32">
                  <div className="font-bold mb-2">{this.state.error.name}: {this.state.error.message}</div>
                  <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ProductionErrorBoundary;
