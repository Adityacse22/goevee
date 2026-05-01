import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-black px-6 text-center text-white">
          <div className="max-w-lg space-y-4">
            <h1 className="text-2xl font-semibold text-white">Something went wrong while loading Evee</h1>
            <p className="text-sm text-white/70">
              Open the browser console to see the exact error, then refresh the page.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
