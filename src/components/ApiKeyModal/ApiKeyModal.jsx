import { useState } from 'react';
import PropTypes from 'prop-types';
import { Key, X, ExternalLink } from 'lucide-react';
import { useModalEscape } from '../../hooks/useModalEscape';
import { validateApiKeyFormat, maskApiKey } from '../../utils/sanitize';
import './ApiKeyModal.css';

/**
 * Modal for configuring and securely managing the Google Gemini API key.
 * Provides clear instructions, format validation, and keyboard accessibility.
 *
 * @param {Object} props
 * @param {() => void} props.onClose - Callback triggered when the modal is closed
 */
export default function ApiKeyModal({ onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [formatError, setFormatError] = useState(false);

  // Accessible keyboard Escape key dismissal
  useModalEscape(true, onClose);

  const getSavedKey = () => {
    return (
      localStorage.getItem('gemini_api_key') ||
      sessionStorage.getItem('gemini_api_key') ||
      window.__GEMINI_API_KEY__ ||
      import.meta.env.VITE_GEMINI_API_KEY
    );
  };

  const currentKey = getSavedKey();
  const isConfigured = Boolean(currentKey && currentKey !== 'your_gemini_api_key_here');

  const handleSave = () => {
    const trimmed = apiKey.trim();
    if (!trimmed) return;

    if (!validateApiKeyFormat(trimmed)) {
      setFormatError(true);
      return;
    }

    setFormatError(false);
    localStorage.setItem('gemini_api_key', trimmed);
    sessionStorage.setItem('gemini_api_key', trimmed);
    window.__GEMINI_API_KEY__ = trimmed;
    setSaved(true);

    setTimeout(() => {
      if (typeof window !== 'undefined' && window.location?.reload) {
        window.location.reload();
      }
    }, 1200);
  };

  const handleClear = () => {
    localStorage.removeItem('gemini_api_key');
    sessionStorage.removeItem('gemini_api_key');
    delete window.__GEMINI_API_KEY__;
    setSaved(false);
    setApiKey('');
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.location?.reload) {
        window.location.reload();
      }
    }, 800);
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-key-title"
      id="api-key-modal"
    >
      <div className="modal-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="modal-content glass-card">
        <div className="modal-header">
          <div className="modal-icon">
            <Key size={24} aria-hidden="true" />
          </div>
          <h2 id="api-key-title" className="modal-title">Gemini API Key</h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
            id="btn-close-api-modal"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="modal-body">
          {saved && (
            <div className="api-saved-msg">
              ✓ Key saved! Reloading...
            </div>
          )}
          {isConfigured ? (
            <div className="api-status-configured-box">
              <div className="api-status-indicator">
                <div className="status-dot status-dot-active" aria-hidden="true" />
                <p className="api-status-text">
                  API key is configured and active ({maskApiKey(currentKey)})
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary btn-reset-key"
                onClick={handleClear}
                id="btn-clear-api-key"
              >
                Reset / Change API Key
              </button>
            </div>
          ) : (
            <>
              <p className="modal-description">
                CelebriPlan uses Google Gemini AI to power its planning features.
                You can provide your free API key below or test immediately with the built-in intelligent engine.
              </p>

              <div className="api-steps">
                <div className="api-step">
                  <span className="step-number" aria-hidden="true">1</span>
                  <div>
                    <p>Visit Google AI Studio to get your free API key:</p>
                    <a
                      href="https://aistudio.google.com/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="api-link"
                    >
                      aistudio.google.com/apikey
                      <ExternalLink size={14} aria-hidden="true" />
                    </a>
                  </div>
                </div>
                <div className="api-step">
                  <span className="step-number" aria-hidden="true">2</span>
                  <p>
                    Create a <code>.env</code> file in the project root with:<br />
                    <code className="env-code">VITE_GEMINI_API_KEY=your_key_here</code>
                  </p>
                </div>
                <div className="api-step">
                  <span className="step-number" aria-hidden="true">3</span>
                  <p>Or paste your key below for this browsing session.</p>
                </div>
              </div>

              <div className="api-divider">
                <span>or paste your key here for this session</span>
              </div>

              <div className="form-group">
                <label htmlFor="api-key-input" className="form-label">API Key</label>
                <input
                  type="password"
                  id="api-key-input"
                  className="form-input"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    if (formatError) setFormatError(false);
                  }}
                  placeholder="AIza..."
                  autoComplete="off"
                />
                {formatError && (
                  <span className="form-hint" style={{ color: 'var(--color-error)' }}>
                    Invalid Gemini API key format. It should start with alphanumeric characters.
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          {!isConfigured && !saved && (
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={!apiKey.trim()}
              id="btn-save-api-key"
            >
              Save & Reload
            </button>
          )}
          <button className="btn-secondary" onClick={onClose} id="btn-dismiss-api-modal">
            {isConfigured ? 'Close' : 'Skip for now'}
          </button>
        </div>
      </div>
    </div>
  );
}

ApiKeyModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};
