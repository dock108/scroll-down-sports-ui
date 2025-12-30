import type { ReactNode } from 'react';
import { Component } from 'react';
import { logger } from '../../utils/logger';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    logger.error('UI error boundary captured error.', {
      message: error.message,
      stack: info.componentStack,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white px-6 py-16 text-center">
          <div className="mx-auto max-w-lg space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-8">
            <div className="text-5xl text-red-500">⚠</div>
            <h1 className="text-2xl font-semibold text-gray-900">Something went wrong.</h1>
            <p className="text-gray-600">
              We hit an unexpected error. Refresh the page or try again shortly.
            </p>
            {this.state.message ? (
              <p className="rounded-lg bg-white px-4 py-2 text-sm text-gray-500 shadow-sm">
                {this.state.message}
              </p>
            ) : null}
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="btn-primary btn-primary--sm btn-primary--rounded btn-primary--hover-strong"
              >
                Retry
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary btn-primary--sm btn-primary--rounded btn-shadow-sm"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
