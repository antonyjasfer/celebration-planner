import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Toast from '../Toast/Toast';

describe('Toast Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders with message text and accessible alert role', () => {
    render(<Toast message="Budget saved successfully" type="success" onClose={() => {}} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Budget saved successfully')).toBeInTheDocument();
  });

  it('applies the correct styling class according to type', () => {
    const { container: successContainer } = render(
      <Toast message="Success message" type="success" onClose={() => {}} />
    );
    expect(successContainer.querySelector('.toast-success')).toBeInTheDocument();

    const { container: errorContainer } = render(
      <Toast message="Error message" type="error" onClose={() => {}} />
    );
    expect(errorContainer.querySelector('.toast-error')).toBeInTheDocument();

    const { container: warningContainer } = render(
      <Toast message="Warning message" type="warning" onClose={() => {}} />
    );
    expect(warningContainer.querySelector('.toast-warning')).toBeInTheDocument();

    const { container: infoContainer } = render(
      <Toast message="Info message" type="info" onClose={() => {}} />
    );
    expect(infoContainer.querySelector('.toast-info')).toBeInTheDocument();
  });

  it('invokes onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<Toast message="Dismiss me" type="info" onClose={handleClose} />);

    const closeBtn = screen.getByRole('button', { name: /dismiss notification/i });
    fireEvent.click(closeBtn);

    // Fast-forward animation timeout (300ms)
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses after 4000ms delay', () => {
    const handleClose = vi.fn();
    render(<Toast message="Auto dismiss" type="info" onClose={handleClose} />);

    expect(handleClose).not.toHaveBeenCalled();

    // Fast-forward 4000ms + 300ms transition
    act(() => {
      vi.advanceTimersByTime(4300);
    });

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('has aria-live attribute for screen reader announcement', () => {
    render(<Toast message="Live announcement" type="info" onClose={() => {}} />);
    const toast = screen.getByRole('alert');
    expect(toast).toHaveAttribute('aria-live', 'polite');
  });
});

