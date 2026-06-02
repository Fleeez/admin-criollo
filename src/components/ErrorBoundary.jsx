import React from 'react';

export default class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40 }}>
          <div style={{
            background: 'rgba(216,67,21,0.08)',
            border: '1px solid rgba(216,67,21,0.25)',
            borderRadius: 14,
            padding: '28px 32px',
            maxWidth: 560,
          }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#C62828', marginBottom: 10 }}>
              Error al renderizar esta sección
            </div>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 8, fontFamily: 'monospace', background: 'rgba(0,0,0,0.05)', padding: '8px 12px', borderRadius: 8, wordBreak: 'break-all' }}>
              {this.state.error?.message || String(this.state.error)}
            </div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 20 }}>
              Cambiá de pestaña y volvé, o hacé click en Reintentar.
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                padding: '8px 20px',
                background: '#C05C3E',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'inherit',
              }}
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
