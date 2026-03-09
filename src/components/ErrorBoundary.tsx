import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Actualiza el estado para que el siguiente renderizado muestre la UI alternativa
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Registra el error para debugging
    console.error('ErrorBoundary capturó un error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              ¡Oops! Algo salió mal
            </h1>
            
            <p className="text-gray-600 text-center mb-6">
              La aplicación encontró un error inesperado. No te preocupes, puedes intentar recargar la página o volver al inicio.
            </p>

            <div className="flex gap-3 justify-center mb-6">
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Recargar Página
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Home className="w-4 h-4" />
                Ir al Inicio
              </button>
            </div>

            {/* Información del error (solo en desarrollo) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <summary className="font-semibold text-gray-700 cursor-pointer mb-2">
                  Detalles técnicos del error
                </summary>
                
                <div className="mt-3 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Error:</p>
                    <pre className="text-xs bg-red-50 p-3 rounded border border-red-200 overflow-x-auto">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                  
                  {this.state.errorInfo && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Stack Trace:</p>
                      <pre className="text-xs bg-gray-100 p-3 rounded border border-gray-300 overflow-x-auto max-h-64 overflow-y-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                💡 <strong>Sugerencia:</strong> Si el problema persiste, intenta cerrar sesión y volver a iniciarla, o contacta al administrador del sistema.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
