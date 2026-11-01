import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast } from '../useToast';

describe('useToast Hook', () => {
  it('initializes with null toast', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toast).toBeNull();
  });

  it('sets toast message and variant with showToast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Event saved successfully!', 'success');
    });

    expect(result.current.toast).toBeDefined();
    expect(result.current.toast.message).toBe('Event saved successfully!');
    expect(result.current.toast.type).toBe('success');
  });

  it('resets toast to null with clearToast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Test notification', 'info');
    });
    expect(result.current.toast).not.toBeNull();

    act(() => {
      result.current.clearToast();
    });
    expect(result.current.toast).toBeNull();
  });
});
