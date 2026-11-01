import { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
  Heart, PartyPopper, Music, Star, ArrowRight, ArrowLeft,
  Calendar, Users, Wallet, Sparkles, CheckCircle
} from 'lucide-react';
import { createEvent, daysUntil } from '../services/eventStore';
import { PRIORITY_OPTIONS } from '../constants';
import './OnboardingPage.css';

/**
 * Onboarding wizard for collecting event parameters and preferences.
 * Multi-step contextual flow that shapes AI persona decision-making.
 *
 * @param {Object} props
 * @param {function(string, string=): void} props.showToast - Toast notification dispatcher
 */

const TODAY_ISO = new Date().toISOString().split('T')[0];

const EVENT_TYPES = [
  { id: 'wedding', label: 'Wedding', icon: Heart, desc: 'Plan your dream wedding ceremony and celebrations' },
  { id: 'birthday', label: 'Birthday', icon: PartyPopper, desc: 'Surprise parties, milestone birthdays, kids\' celebrations' },
  { id: 'community', label: 'Community Event', icon: Music, desc: 'Cultural gatherings, religious ceremonies, social events' },
  { id: 'other', label: 'Other Celebration', icon: Star, desc: 'Anniversaries, baby showers, farewells, and more' },
];

const TOTAL_STEPS = 4;

export default function OnboardingPage({ showToast }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    eventType: '',
    eventName: '',
    budget: '',
    guestCount: '',
    eventDate: '',
    priorities: [],
    preferences: '',
    culturalContext: '',
    additionalNotes: '',
  });

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const togglePriority = (id) => {
    setForm(prev => ({
      ...prev,
      priorities: prev.priorities.includes(id)
        ? prev.priorities.filter(p => p !== id)
        : [...prev.priorities, id],
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 1: return form.eventType !== '';
      case 2: return form.eventName.trim() !== '' && Number(form.budget) > 0 && Number(form.guestCount) > 0;
      case 3: return form.eventDate !== '';
      case 4: return true; // Preferences are optional
      default: return false;
    }
  };

  const handleCreate = () => {
    const event = createEvent({
      ...form,
      budget: Number(form.budget),
      guestCount: Number(form.guestCount),
      priorities: form.priorities.join(', '),
    });

    showToast(`"${event.eventName}" created! Let's start planning.`, 'success');
    navigate('/dashboard');
  };

  return (
    <div className="onboarding" id="onboarding-page">
      <div className="onboarding-container">
        {/* Progress Bar */}
        <div className="onboarding-progress" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={TOTAL_STEPS}>
          <div className="progress-steps">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className={`progress-step ${i + 1 <= step ? 'active' : ''} ${i + 1 < step ? 'completed' : ''}`}
              >
                {i + 1 < step ? <CheckCircle size={16} aria-hidden="true" /> : <span>{i + 1}</span>}
              </div>
            ))}
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
          </div>
          <p className="progress-label">Step {step} of {TOTAL_STEPS}</p>
        </div>

        {/* Step 1: Event Type */}
        {step === 1 && (
          <div className="step-content animate-fade-in-up" id="step-event-type">
            <h2 className="step-title">What are you celebrating?</h2>
            <p className="step-subtitle">Choose the type of event you're planning.</p>

            <div className="event-type-grid">
              {EVENT_TYPES.map(type => (
                <button
                  key={type.id}
                  className={`event-type-option glass-card ${form.eventType === type.id ? 'selected' : ''}`}
                  onClick={() => updateField('eventType', type.id)}
                  id={`option-${type.id}`}
                  aria-pressed={form.eventType === type.id}
                >
                  <type.icon size={28} className="event-type-icon" aria-hidden="true" />
                  <span className="event-type-label">{type.label}</span>
                  <span className="event-type-desc">{type.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Basic Details */}
        {step === 2 && (
          <div className="step-content animate-fade-in-up" id="step-basic-details">
            <h2 className="step-title">Tell us the basics</h2>
            <p className="step-subtitle">Help us understand the scale of your event.</p>

            <div className="form-grid">
              <div className="form-group form-full">
                <label htmlFor="event-name" className="form-label">Event Name</label>
                <input
                  type="text"
                  id="event-name"
                  className="form-input"
                  value={form.eventName}
                  onChange={e => updateField('eventName', e.target.value)}
                  placeholder={form.eventType === 'wedding' ? "Priya & Rahul's Wedding" : "My Special Event"}
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label htmlFor="event-budget" className="form-label">
                  <Wallet size={14} aria-hidden="true" />
                  Total Budget (₹)
                </label>
                <input
                  type="number"
                  id="event-budget"
                  className="form-input"
                  value={form.budget}
                  onChange={e => updateField('budget', e.target.value)}
                  placeholder="e.g., 800000"
                  min="0"
                />
                <span className="form-hint">
                  {form.budget ? `₹${Number(form.budget).toLocaleString('en-IN')}` : 'Enter your total budget in INR'}
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="guest-count" className="form-label">
                  <Users size={14} aria-hidden="true" />
                  Expected Guests
                </label>
                <input
                  type="number"
                  id="guest-count"
                  className="form-input"
                  value={form.guestCount}
                  onChange={e => updateField('guestCount', e.target.value)}
                  placeholder="e.g., 200"
                  min="1"
                />
                <span className="form-hint">
                  {form.budget && form.guestCount
                    ? `~₹${Math.round(Number(form.budget) / Number(form.guestCount)).toLocaleString('en-IN')} per guest`
                    : 'Approximate number of attendees'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Date & Timeline */}
        {step === 3 && (
          <div className="step-content animate-fade-in-up" id="step-date">
            <h2 className="step-title">When's the big day?</h2>
            <p className="step-subtitle">We'll create a planning timeline working backwards from your event date.</p>

            <div className="form-grid">
              <div className="form-group form-full">
                <label htmlFor="event-date" className="form-label">
                  <Calendar size={14} aria-hidden="true" />
                  Event Date
                </label>
                <input
                  type="date"
                  id="event-date"
                  className="form-input"
                  value={form.eventDate}
                  onChange={e => updateField('eventDate', e.target.value)}
                  min={TODAY_ISO}
                />
                {form.eventDate && (
                  <span className="form-hint days-hint">
                    {daysUntil(form.eventDate)} days from today
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Priorities & Preferences */}
        {step === 4 && (
          <div className="step-content animate-fade-in-up" id="step-preferences">
            <h2 className="step-title">What matters most to you?</h2>
            <p className="step-subtitle">Select your priorities so we can optimize your plan. Pick as many as you like.</p>

            <div className="priority-grid">
              {PRIORITY_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  className={`priority-option ${form.priorities.includes(opt.id) ? 'selected' : ''}`}
                  onClick={() => togglePriority(opt.id)}
                  aria-pressed={form.priorities.includes(opt.id)}
                  id={`priority-${opt.id}`}
                >
                  <span className="priority-emoji" aria-hidden="true">{opt.emoji}</span>
                  <span className="priority-label">{opt.label}</span>
                </button>
              ))}
            </div>

            <div className="form-grid" style={{ marginTop: 'var(--space-8)' }}>
              <div className="form-group form-full">
                <label htmlFor="preferences" className="form-label">Describe the vibe you want (optional)</label>
                <textarea
                  id="preferences"
                  className="form-input form-textarea"
                  value={form.preferences}
                  onChange={e => updateField('preferences', e.target.value)}
                  placeholder="e.g., Intimate and warm, modern minimalist, traditional with a twist, grand and lavish..."
                  rows={3}
                />
              </div>

              <div className="form-group form-full">
                <label htmlFor="cultural-context" className="form-label">Cultural or regional preferences (optional)</label>
                <input
                  type="text"
                  id="cultural-context"
                  className="form-input"
                  value={form.culturalContext}
                  onChange={e => updateField('culturalContext', e.target.value)}
                  placeholder="e.g., South Indian, Punjabi, Bengali, Multi-cultural..."
                />
              </div>

              <div className="form-group form-full">
                <label htmlFor="additional-notes" className="form-label">Anything else we should know? (optional)</label>
                <textarea
                  id="additional-notes"
                  className="form-input form-textarea"
                  value={form.additionalNotes}
                  onChange={e => updateField('additionalNotes', e.target.value)}
                  placeholder="e.g., Outdoor venue preferred, need wheelchair accessibility, vegetarian only..."
                  rows={2}
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="step-nav">
          {step > 1 && (
            <button className="btn-secondary" onClick={() => setStep(s => s - 1)} id="btn-step-back">
              <ArrowLeft size={16} aria-hidden="true" />
              Back
            </button>
          )}
          <div style={{ flex: 1 }} />
          {step < TOTAL_STEPS ? (
            <button
              className="btn-primary"
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              id="btn-step-next"
            >
              Next
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={handleCreate}
              id="btn-create-event"
            >
              <Sparkles size={16} aria-hidden="true" />
              Create My Plan
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

OnboardingPage.propTypes = {
  showToast: PropTypes.func.isRequired,
};
