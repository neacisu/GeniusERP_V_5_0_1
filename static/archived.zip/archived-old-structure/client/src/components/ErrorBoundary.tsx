import React, { Component, ReactNode, ErrorInfo } from 'react';
import * as Sentry from '@sentry/react';
import { captureException } from '../lib/sentry';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  moduleName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * 
 * Capturează erori React și le trimite către Sentry
 * Afișează un UI fallback când apar erori
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);

    // Capture in Sentry with context
    captureException(error, {
      module: this.props.moduleName || 'react-component',
      componentStack: errorInfo.componentStack,
    });

    this.setState({
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI dacă e specificat
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
            <div className="mb-4 flex items-center justify-center">
              <svg
                className="h-16 w-16 text-red-500"
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
            </div>

            <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">
              Oops! Ceva nu a funcționat
            </h2>

            <p className="mb-4 text-center text-gray-600">
              Ne pare rău, dar a apărut o eroare neașteptată. Echipa noastră a fost notificată automat.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <div className="mb-4 rounded bg-gray-100 p-4">
                <p className="mb-2 text-sm font-semibold text-gray-700">
                  Detalii eroare (Development):
                </p>
                <pre className="overflow-auto text-xs text-red-600">
                  {this.state.error.toString()}
                </pre>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-gray-600">
                      Component Stack
                    </summary>
                    <pre className="mt-2 overflow-auto text-xs text-gray-600">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={this.handleReset}
                className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Încearcă din nou
              </button>

              <button
                onClick={() => (window.location.href = '/')}
                className="rounded border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Înapoi la prima pagină
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Sentry-wrapped Error Boundary
 * Folosește Sentry.ErrorBoundary cu configurare custom
 */
export const SentryErrorBoundary = Sentry.withErrorBoundary(
  ({ children }: { children: ReactNode }) => <>{children}</>,
  {
    fallback: ({ error, resetError }) => (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
          <div className="mb-4 flex items-center justify-center">
            <svg
              className="h-16 w-16 text-red-500"
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
          </div>

          <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">
            Eroare Aplicație
          </h2>

          <p className="mb-4 text-center text-gray-600">
            A apărut o eroare. Echipa noastră a fost notificată.
          </p>

          {import.meta.env.DEV && (
            <div className="mb-4 rounded bg-gray-100 p-4">
              <pre className="overflow-auto text-xs text-red-600">
                {error?.toString()}
              </pre>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button
              onClick={resetError}
              className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Încearcă din nou
            </button>

            <button
              onClick={() => (window.location.href = '/')}
              className="rounded border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Înapoi la Dashboard
            </button>
          </div>
        </div>
      </div>
    ),
    showDialog: false,
  }
);

export default ErrorBoundary;

