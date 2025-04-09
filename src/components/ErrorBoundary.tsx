
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error no controlado:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
          <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Algo salió mal</h2>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Se ha producido un error inesperado. Por favor, intente refrescar la página.
          </p>
          <Button 
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
