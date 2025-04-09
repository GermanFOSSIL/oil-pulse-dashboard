
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { LoadingFallback } from './ui/loading-fallback';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error en el componente:', error);
    console.error('Información del error:', errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null
    });
    window.location.href = '/';
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <LoadingFallback
          title="Algo salió mal"
          description={`Se ha producido un error en la aplicación: ${this.state.error?.message}`}
          onRetry={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}
