import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-bg)',
          color: 'var(--color-text-primary)'
        }}>
          <div className="glass-card" style={{ padding: 40, textAlign: 'center', maxWidth: 400 }}>
            <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
            <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Something went wrong.</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24, fontSize: 14 }}>
              An unexpected error occurred in the application. Please try refreshing the page.
            </p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                background: 'var(--color-accent-blue)',
                color: '#fff',
                border: 'none',
                padding: '10px 24px',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
