import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Z-Truss Uncaught Runtime Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#090e1a',
          color: '#e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Ubuntu, -apple-system, sans-serif',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '560px',
            backgroundColor: '#0f192e',
            border: '1px solid #1e355b',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{ color: '#f87171', margin: '0 0 12px 0', fontSize: '20px' }}>
              Z-Truss Interface Error
            </h2>
            <p style={{ color: '#8ba2c4', fontSize: '13px', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              An unexpected error occurred while rendering the workspace:
            </p>
            <pre style={{
              backgroundColor: '#070b14',
              border: '1px solid #14243e',
              borderRadius: '6px',
              padding: '12px',
              fontSize: '12px',
              color: '#fca5a5',
              overflowX: 'auto',
              textAlign: 'left',
              margin: '0 0 24px 0'
            }}>
              {this.state.error?.toString() || 'Unknown Error'}
            </pre>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={{
                backgroundColor: '#38bdf8',
                color: '#090e1a',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 20px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Reload Z-Truss Studio
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
