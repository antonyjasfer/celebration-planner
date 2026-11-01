import { useState } from 'react';
import { Key, X, ExternalLink } from 'lucide-react';
import './ApiKeyModal.css';

/**
 * Modal for configuring the Gemini API key.
 * Provides instructions and validates the key format.
 */
export default function ApiKeyModal({ onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  const getSavedKey = () => {
    return (
      localStorage.getItem('gemini_api_key') ||
      sessionStorage.getItem('gemini_api_key') ||
      window.__GEMINI_API_KEY__ ||
      import.meta.env.VITE_GEMINI_API_KEY
    );
  };

  const currentKey = getSavedKey();
  const isConfigured = currentKey && currentKey !== 'your_gemini_api_key_here';

  const handleSave = () => {
    if (!apiKey.trim()) return;
    localStorage.setItem('gemini_api_key', apiKey.trim());
    sessionStorage.setItem('gemini_api_key', apiKey.trim());
    window.__GEMINI_API_KEY__ = apiKey.trim();
    setSaved(true);

    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  const handleClear = () => {
    localStorage.removeItem('gemini_api_key');
    sessionStorage.removeItem('gemini_api_key');
    delete window.__GEMINI_API_KEY__;
    setSaved(false);
    setApiKey('');
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="api-key-title" id="api-key-modal">
      <div className="modal-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="modal-content glass-card">
        <div className="modal-header">
          <div className="modal-icon">
            <Key size={24} aria-hidden="true" />
          </div>
          <h2 id="api-key-title" className="modal-title">Gemini API Key</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal" id="btn-close-api-modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {isConfigured ? (
            <div className="api-status-configured" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="status-dot status-dot-active" />
                <p style={{ margin: 0 }}>API key is configured and active.</p>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleClear}
                style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                id="btn-clear-api-key"
              >
                Reset / Change API Key
              </button>
            </div>
          ) : (
            <>
              <p className="modal-description">
                CelebriPlan uses Google Gemini AI to power its planning features.
                You need a free API key to get started.
              </p>

              <div className="api-steps">
                <div className="api-step">
                  <span className="step-number">1</span>
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
                  <span className="step-number">2</span>
                  <p>
                    Create a <code>.env</code> file in the project root with:<br />
                    <code className="env-code">VITE_GEMINI_API_KEY=your_key_here</code>
                  </p>
                </div>
                <div className="api-step">
                  <span className="step-number">3</span>
                  <p>Restart the development server to apply the key.</p>
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
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIza..."
                  autoComplete="off"
                />
              </div>

              {saved && (
                <p className="api-saved-msg">
                  ✓ Key saved! Reloading...
                </p>
              )}
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
