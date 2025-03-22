import { Component, ErrorInfo, ReactNode } from 'react';
import { Container } from './Container';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Container maxWidth="lg">
          <div className="min-h-[400px] flex flex-col items-center justify-center text-center space-y-6 p-8">
            <svg
              className="w-16 h-16 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
              <p className="text-[#E8E8E8]">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
            </div>
            <div className="space-x-4">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-[#1DB954] text-white rounded-lg hover:bg-opacity-90 transition"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 border border-[#E8E8E8] text-[#E8E8E8] rounded-lg hover:bg-[#323232] transition"
              >
                Reload page
              </button>
            </div>
          </div>
        </Container>
      );
    }

    return this.props.children;
  }
} 