import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import './Toast.css';

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

/**
 * Toast notification component.
 * Auto-dismisses after 4 seconds and supports accessible alert semantics.
 *
 * @param {Object} props
 * @param {string} props.message - Notification message text
 * @param {'info'|'success'|'error'|'warning'} [props.type='info'] - Severity variant
 * @param {() => void} props.onClose - Callback triggered on dismissal
 */
export default function Toast({ message, type = 'info', onClose }) {
  const [isLeaving, setIsLeaving] = useState(false);
  const Icon = ICONS[type] || ICONS.info;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(onClose, 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`toast toast-${type} ${isLeaving ? 'toast-leaving' : ''}`}
      role="alert"
      aria-live="polite"
      id="toast-notification"
    >
      <Icon size={18} className="toast-icon" aria-hidden="true" />
      <p className="toast-message">{message}</p>
      <button
        className="toast-close"
        onClick={() => {
          setIsLeaving(true);
          setTimeout(onClose, 300);
        }}
        aria-label="Dismiss notification"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['info', 'success', 'error', 'warning']),
  onClose: PropTypes.func.isRequired,
};
