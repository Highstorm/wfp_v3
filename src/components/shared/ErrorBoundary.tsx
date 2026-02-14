import React from "react";
import { logger } from "../../utils/logger";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error("ErrorBoundary caught error", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="container mx-auto p-4">
          <div className="card p-8 text-center">
            <h2 className="text-xl font-semibold text-destructive mb-2">
              Etwas ist schiefgelaufen
            </h2>
            <p className="text-muted-foreground mb-4">
              Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.
            </p>
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
