import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary/ErrorBoundary';

function ProblemChild({ shouldThrow }) {
  if (shouldThrow) {
    throw new Error('Test crash in child component');
  }
  return <div>Safe child content</div>;
}

describe('ErrorBoundary Component', () => {
  const originalConsoleError = console.error;

  beforeAll(() => {
    // Suppress React boundary console.error logs during test
    console.error = vi.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Safe child content')).toBeInTheDocument();
  });

  it('catches render error and displays accessible fallback UI', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh page/i })).toBeInTheDocument();
  });

  it('provides a refresh button to reload the application', () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { reload: reloadMock },
    });

    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    );

    const refreshBtn = screen.getByRole('button', { name: /refresh page/i });
    fireEvent.click(refreshBtn);
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });
});

