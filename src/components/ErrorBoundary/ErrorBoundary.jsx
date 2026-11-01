import { Component } from 'react';
import PropTypes from 'prop-types';

/**
 * Error Boundary component that catches uncaught JavaScript errors
 * in its child component tree and renders an accessible fallback UI.
 *
 * @extends {Component}
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="error-boundary"
          role="alert"
          aria-live="assertive"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-text-primary, #1a1a2e)' }}>
            Something went wrong
          </h2>
          <p style={{ color: 'var(--color-text-secondary, #6b7280)', marginBottom: '1.5rem', maxWidth: '400px' }}>
            An unexpected error occurred. Please refresh the page to continue planning your celebration.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
            style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem' }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};
