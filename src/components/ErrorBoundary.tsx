import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let readable = error.message || 'An unexpected error occurred.';
    try {
      const parsed = JSON.parse(readable) as { error?: string; operationType?: string };
      if (parsed && typeof parsed.error === 'string') {
        readable = parsed.error;
      }
    } catch {
      // Plain error message
    }
    return {
      hasError: true,
      message: readable,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught application error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-[#faf7f0] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#ebe6da] shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#fef2f2] text-[#991b1b] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-[#1f2421]">
                Something went wrong
              </h2>
              <p className="text-xs text-[#6e7268]">
                Please review the message below and try again.
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-[#faf7f0] border border-[#ebe6da] p-3 text-xs text-[#494e45] break-words">
            {this.state.message}
          </div>

          <button
            type="button"
            onClick={this.handleReset}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#087653] hover:bg-[#065c40] text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reload View</span>
          </button>
        </div>
      </div>
    );
  }
}
