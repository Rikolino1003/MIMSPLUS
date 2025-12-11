import React, { Component } from 'react';
import { toast } from 'react-toastify';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
    toast.error('Ocurrió un error al cargar el componente. Por favor, intente nuevamente.');
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
          <h3 className="text-lg font-medium text-red-800 mb-2">Algo salió mal</h3>
          <p className="text-red-700 mb-4">
            Lo sentimos, ocurrió un error al cargar este componente.
          </p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
          >
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
