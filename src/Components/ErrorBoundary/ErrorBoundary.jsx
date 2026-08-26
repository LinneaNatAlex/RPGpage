import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    const msg = error?.message || String(error);
    if (msg.includes('INTERNAL ASSERTION FAILED') && msg.includes('FIRESTORE')) {
      return null;
    }
    if (msg.includes('Minified React error #426') || msg.includes('suspended while responding to synchronous input')) {
      return null;
    }
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          padding: '1rem',
          background: 'linear-gradient(180deg, #faf6ee 0%, #f4ead8 100%)',
          borderRadius: 12,
          border: '2px solid #8b7355',
          textAlign: 'center',
          width: '100%',
          maxWidth: '500px',
          margin: '1rem auto'
        }}>
          <h2 style={{ color: '#8b7355', marginBottom: '1rem', fontSize: '1.5rem' }}>
            Oops! Something went wrong
          </h2>
          <p style={{ color: '#2C2C2C', marginBottom: '1rem', fontSize: '0.9rem' }}>
            We encountered an error while loading this page.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={this.handleRetry}
              style={{
                background: 'linear-gradient(180deg, #d4b978 0%, #b8944e 100%)',
                color: '#F5EFE0',
                border: 'none',
                borderRadius: 12,
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'linear-gradient(135deg, #9a8060 0%, #9B8A7B 100%)',
                color: '#F5EFE0',
                border: 'none',
                borderRadius: 12,
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
