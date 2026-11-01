import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Sparkles, Palette, Utensils, Music, Smile,
  ThumbsUp, ThumbsDown, CheckCircle2,
  Star, DollarSign
} from 'lucide-react';
import { updateEvent, formatCurrency } from '../services/eventStore';
import { generatePersonalizedIdeas } from '../services/gemini';
import { sanitizeInput } from '../utils/sanitize';
import { useModalEscape } from '../hooks/useModalEscape';
import './IdeasPage.css';

/**
 * Personalized Ideas & Cultural Themes Page.
 * Visualizes 4-pillar event concept packages (Decor, Food, Activities, Music),
 * dietary catering options, personal touches, and custom vibe regeneration.
 *
 * @param {Object} props
 * @param {Object} props.event - Active event record
 * @param {function(string, string=): void} props.showToast - Toast notification dispatcher
 */
export default function IdeasPage({ event, showToast }) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [selectedThemeIndex, setSelectedThemeIndex] = useState(0);
  const [customVibeInput, setCustomVibeInput] = useState('');
  const [showVibeModal, setShowVibeModal] = useState(false);

  // Keyboard accessibility for vibe modal
  useModalEscape(showVibeModal, () => setShowVibeModal(false));

  const ideasData = event.ideas || {
    themes: [],
    foodSuggestions: [],
    entertainmentIdeas: [],
    personalTouches: [],
    budgetFriendlyAlternatives: []
  };

  const handleRegenerateIdeas = async (newPreferences = '') => {
    setIsRegenerating(true);
    const prefToUse = sanitizeInput(newPreferences || customVibeInput || event.preferences);
    try {
      const freshIdeas = await generatePersonalizedIdeas({
        ...event,
        preferences: prefToUse,
      });

      updateEvent(event.id, {
        ideas: freshIdeas,
        preferences: prefToUse,
      });

      showToast('Personalized themes & concepts regenerated with AI!', 'success');
      setShowVibeModal(false);
    } catch (err) {
      console.error('Ideas regeneration error:', err);
      showToast('Could not regenerate ideas.', 'error');
    } finally {
      setIsRegenerating(false);
    }
  };

  const currentTheme = ideasData.themes?.[selectedThemeIndex] || ideasData.themes?.[0];

  return (
    <div className="ideas-page animate-fade-in" id="ideas-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Personalized Ideas & Themes</h1>
          <p className="page-subtitle">
            Curated aesthetics, catering live counters, and entertainment for <strong>{event.eventName}</strong>.
          </p>
        </div>
        <div className="header-actions">
          <button
            className="btn-primary"
            onClick={() => setShowVibeModal(true)}
            id="btn-custom-vibe-modal"
          >
            <Sparkles size={16} aria-hidden="true" /> Tailor Atmosphere & Vibe
          </button>
        </div>
      </div>

      {/* Theme Selection Tabs */}
      {ideasData.themes?.length > 0 && (
        <div className="theme-selector-bar" role="tablist" aria-label="Curated theme options">
          {ideasData.themes.map((theme, idx) => (
            <button
              key={idx}
              className={`theme-tab-btn ${selectedThemeIndex === idx ? 'active' : ''}`}
              onClick={() => setSelectedThemeIndex(idx)}
              id={`theme-tab-${idx}`}
              role="tab"
              aria-selected={selectedThemeIndex === idx}
            >
              <Palette size={16} aria-hidden="true" />
              <span>{theme.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Featured Theme Showcase Card */}
      {currentTheme && (
        <div className="featured-theme-hero glass-card animate-fade-in" role="tabpanel">
          <div className="theme-hero-top">
            <div className="theme-meta">
              <span className="theme-badge">Active AI Recommendation</span>
              <h2 className="theme-hero-title">{currentTheme.name}</h2>
              <p className="theme-hero-desc">{currentTheme.description}</p>
              {currentTheme.suitability && (
                <p className="theme-suitability">
                  <strong>Why it fits:</strong> {currentTheme.suitability}
                </p>
              )}
            </div>
            <div className="theme-cost-card">
              <span className="cost-label">Estimated Decor Budget</span>
              <span className="cost-amount">{formatCurrency(currentTheme.estimatedCost)}</span>
              <span className="cost-sub">Includes stage, lighting & floral accents</span>
            </div>
          </div>

          {/* 4 Pillars of the Theme */}
          <div className="theme-elements-grid">
            <div className="element-card glass-card">
              <div className="element-card-header">
                <Palette className="text-accent" size={18} aria-hidden="true" />
                <h3>Decor & Floral Styling</h3>
              </div>
              <ul className="element-list">
                {(currentTheme.elements?.decoration || []).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="element-card glass-card">
              <div className="element-card-header">
                <Utensils className="text-secondary" size={18} aria-hidden="true" />
                <h3>Menu & Culinary Concepts</h3>
              </div>
              <ul className="element-list">
                {(currentTheme.elements?.food || []).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="element-card glass-card">
              <div className="element-card-header">
                <Smile className="text-gold" size={18} aria-hidden="true" />
                <h3>Guest Activities & Keepsakes</h3>
              </div>
              <ul className="element-list">
                {(currentTheme.elements?.activities || []).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="element-card glass-card">
              <div className="element-card-header">
                <Music className="text-success" size={18} aria-hidden="true" />
                <h3>Music & Entertainment</h3>
              </div>
              <ul className="element-list">
                {(currentTheme.elements?.music || []).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Pros and Cons */}
          <div className="theme-pros-cons-grid">
            <div className="pros-box">
              <div className="pros-header">
                <ThumbsUp size={16} className="text-success" aria-hidden="true" />
                <h4>Advantages</h4>
              </div>
              <ul>
                {(currentTheme.pros || []).map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>

            <div className="cons-box">
              <div className="cons-header">
                <ThumbsDown size={16} className="text-warning" aria-hidden="true" />
                <h4>Considerations & Limitations</h4>
              </div>
              <ul>
                {(currentTheme.cons || []).map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Food & Beverage Curation */}
      {ideasData.foodSuggestions?.length > 0 && (
        <div className="food-section">
          <h2 className="section-title">Catering & Menu Recommendations</h2>
          <div className="food-grid">
            {ideasData.foodSuggestions.map((food, idx) => (
              <div key={idx} className="food-card glass-card">
                <div className="food-card-top">
                  <h3 className="food-type-title">{food.type}</h3>
                  {food.estimatedCostPerPerson && (
                    <span className="plate-cost-badge">
                      ~{formatCurrency(food.estimatedCostPerPerson)} / plate
                    </span>
                  )}
                </div>
                <div className="food-items-tags">
                  {(food.items || []).map((item, i) => (
                    <span key={i} className="food-item-tag">🍽️ {item}</span>
                  ))}
                </div>
                {food.dietaryOptions?.length > 0 && (
                  <div className="dietary-row">
                    <span className="dietary-label">Accommodations:</span>
                    {food.dietaryOptions.map((opt, i) => (
                      <span key={i} className="dietary-tag">{opt}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personal Touches & Cost-Saving Ideas */}
      <div className="touches-grid">
        <div className="touch-card glass-card">
          <div className="touch-header">
            <Star size={18} className="text-gold" aria-hidden="true" />
            <h3>Memorable Personal Touches</h3>
          </div>
          <p className="touch-intro">Small, thoughtful details guests cherish long after the celebration:</p>
          <ul className="touch-list">
            {(ideasData.personalTouches || []).map((touch, i) => (
              <li key={i}>
                <CheckCircle2 size={16} className="text-gold" aria-hidden="true" />
                <span>{touch}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="touch-card glass-card">
          <div className="touch-header">
            <DollarSign size={18} className="text-success" aria-hidden="true" />
            <h3>Budget-Friendly Alternatives</h3>
          </div>
          <p className="touch-intro">Clever aesthetic swaps that preserve luxury while cutting costs:</p>
          <ul className="touch-list">
            {(ideasData.budgetFriendlyAlternatives || []).map((alt, i) => (
              <li key={i}>
                <CheckCircle2 size={16} className="text-success" aria-hidden="true" />
                <span>{alt}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Tailor Vibe Modal */}
      {showVibeModal && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tailor-vibe-title"
        >
          <div className="modal-backdrop" onClick={() => setShowVibeModal(false)} aria-hidden="true" />
          <div className="modal-content glass-card vibe-modal-box">
            <div className="modal-header">
              <h3 className="modal-title" id="tailor-vibe-title">Tailor Theme & Atmosphere</h3>
              <button className="modal-close" onClick={() => setShowVibeModal(false)} aria-label="Close modal">✕</button>
            </div>

            <div className="modal-body">
              <p className="modal-description">
                Describe the atmosphere, vibe, color scheme, or cultural aesthetic you want.
                CelebriPlan AI will re-imagine the entire concept.
              </p>

              <div className="form-group">
                <label className="form-label" htmlFor="custom-vibe-input">Desired Atmosphere / Theme Vibe</label>
                <textarea
                  id="custom-vibe-input"
                  className="form-input"
                  rows={3}
                  placeholder="e.g., Warm Rajasthani Royal Heritage with marigolds and folk music, or Chic Minimalist Bohemian Garden Soiree..."
                  value={customVibeInput}
                  onChange={(e) => setCustomVibeInput(e.target.value)}
                />
              </div>

              {/* Preset Vibe Chips */}
              <div className="vibe-preset-chips">
                <span className="preset-label">Quick Ideas:</span>
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() => setCustomVibeInput('Royal Rajasthani Heritage with brass urlis and marigold garlands')}
                >
                  Royal Rajasthani
                </button>
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() => setCustomVibeInput('Pastel Bohemian Sunset with fairy light canopies and acoustic indie music')}
                >
                  Pastel Boho
                </button>
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() => setCustomVibeInput('High-energy Neon Retro Disco with arcade games and glow cocktails')}
                >
                  Neon Disco
                </button>
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() => setCustomVibeInput('Eco-friendly Botanical Garden with potted succulents and farm-to-table feast')}
                >
                  Eco Botanical
                </button>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleRegenerateIdeas()}
                  disabled={isRegenerating || !customVibeInput.trim()}
                  id="btn-apply-vibe"
                >
                  {isRegenerating ? (
                    <>
                      <Sparkles className="spin-icon" size={16} aria-hidden="true" />
                      Curating New Concepts...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} aria-hidden="true" />
                      Generate New Concepts
                    </>
                  )}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowVibeModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

IdeasPage.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.string.isRequired,
    eventName: PropTypes.string.isRequired,
    preferences: PropTypes.string,
    ideas: PropTypes.object,
  }).isRequired,
  showToast: PropTypes.func.isRequired,
};
