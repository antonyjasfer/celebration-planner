import { useEffect } from 'react';

/**
 * Custom hook to close modal dialogs on Escape key press.
 * Enhances keyboard navigation accessibility (WCAG 2.1 AA).
 *
 * @param {boolean} isOpen - Whether the modal is currently open
 * @param {() => void} onClose - Callback invoked when Escape is pressed
 */
export function useModalEscape(isOpen, onClose) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
}
