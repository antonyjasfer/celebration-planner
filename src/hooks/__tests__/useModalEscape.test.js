import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useModalEscape } from '../useModalEscape';

describe('useModalEscape Hook', () => {
  it('calls onClose callback when Escape key is pressed while modal is open', () => {
    const handleClose = vi.fn();
    renderHook(() => useModalEscape(true, handleClose));

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    window.dispatchEvent(escapeEvent);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when other keys are pressed', () => {
    const handleClose = vi.fn();
    renderHook(() => useModalEscape(true, handleClose));

    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    window.dispatchEvent(enterEvent);

    expect(handleClose).not.toHaveBeenCalled();
  });

  it('does not listen for keys when modal is not open', () => {
    const handleClose = vi.fn();
    renderHook(() => useModalEscape(false, handleClose));

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    window.dispatchEvent(escapeEvent);

    expect(handleClose).not.toHaveBeenCalled();
  });
});
