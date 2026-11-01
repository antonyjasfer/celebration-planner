import { useState, useCallback } from 'react';

/**
 * Custom hook for managing toast notification state.
 *
 * @returns {{
 *   toast: { message: string, type: string, id: number } | null,
 *   showToast: (message: string, type?: 'info'|'success'|'error'|'warning') => void,
 *   clearToast: () => void
 * }}
 */
export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  return { toast, showToast, clearToast };
}
