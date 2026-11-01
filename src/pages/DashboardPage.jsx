import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, Calendar, Users, Wallet, CheckCircle2,
  Clock, ArrowRight, RefreshCw, Award, ChevronRight,
  MessageSquare, ShieldCheck, Trash2
} from 'lucide-react';
import {
  updateEvent, deleteEvent, toggleTask, formatCurrency,
  formatDate, daysUntil, loadEvents, setActiveEventId
} from '../services/eventStore';
import {
  generateBudgetBreakdown, generateTimeline,
  generateVendorChecklist, generatePersonalizedIdeas,
  analyzeChangeImpact
} from '../services/gemini';
import './DashboardPage.css';

export default function DashboardPage({ event, showToast }) {
  const navigate = useNavigate();
  const allEvents = loadEvents();
  const [isInitializingAI, setIsInitializingAI] = useState(false);
  const [showAdaptiveModal, setShowAdaptiveModal] = useState(false);
  const [changeType, setChangeType] = useState('budget');
  const [changeDescription, setChangeDescription] = useState('');
  const [isAnalyzingChange, setIsAnalyzingChange] = useState(false);
  const [changeAnalysis, setChangeAnalysis] = useState(null);

  // Initialize AI data on first visit if not present
  useEffect(() => {
    async function initData() {
      if (!event.budgetBreakdown || !event.timeline) {
        setIsInitializingAI(true);
        try {
          const [budgetData, timelineData, vendorData, ideasData] = await Promise.all([
            event.budgetBreakdown || generateBudgetBreakdown(event),
            event.timeline || generateTimeline(event),
            event.vendorChecklist || generateVendorChecklist(event),
            event.ideas || generatePersonalizedIdeas(event),
          ]);

          updateEvent(event.id, {
            budgetBreakdown: budgetData,
            timeline: timelineData,
            vendorChecklist: vendorData,
            ideas: ideasData,
          });

          showToast('AI Plan initialized successfully!', 'success');
        } catch (err) {
          console.error('Failed to initialize AI data:', err);
          showToast('Initialized plan with local intelligent defaults.', 'info');
        } finally {
          setIsInitializingAI(false);
        }
      }
    }

    initData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);

  const allTasks = (event.timeline?.phases || []).flatMap(phase => phase.tasks || []);
  const completedCount = (event.completedTasks || []).length;
  const totalTasks = allTasks.length || 1;
  const taskProgressPct = Math.round((completedCount / totalTasks) * 100);

  const daysLeft = daysUntil(event.eventDate);

  // Calculate preparedness score
  const hasBudget = Boolean(event.budgetBreakdown);
  const hasVendors = Boolean(event.vendorChecklist);
  const hasTimeline = Boolean(event.timeline);
  const healthScore = Math.min(
    100,
    Math.round(
      (hasBudget ? 25 : 0) +
      (hasTimeline ? 25 : 0) +
      (hasVendors ? 20 : 0) +
      (taskProgressPct * 0.3)
    )
  );

  const handleTaskToggle = (taskId) => {
    toggleTask(event.id, taskId);
    showToast('Task updated', 'info');
  };

  const handleRunAdaptiveReplanner = async () => {
    if (!changeDescription.trim()) return;
    setIsAnalyzingChange(true);
    setChangeAnalysis(null);

    try {
      const analysis = await analyzeChangeImpact({
        currentPlan: event,
        changeDescription: changeDescription.trim(),
        changeType,
      });
      setChangeAnalysis(analysis);
    } catch (err) {
      console.error('Adaptive replanning error:', err);
      showToast('Could not complete replanning simulation. Try again.', 'error');
    } finally {
      setIsAnalyzingChange(false);
    }
  };

  const handleApplyChange = () => {
    if (!changeAnalysis) return;

    const updates = {};
    if (changeAnalysis.revisedBudget?.revised) {
      updates.budget = changeAnalysis.revisedBudget.revised;
    }

    updateEvent(event.id, updates);
    setShowAdaptiveModal(false);
    setChangeAnalysis(null);
    setChangeDescription('');
    showToast('Plan successfully adapted with AI tradeoffs!', 'success');
  };

  const handleSwitchEvent = (e) => {
    const newId = e.target.value;
    if (newId === 'new') {
      navigate('/new');
    } else if (newId) {
      setActiveEventId(newId);
    }
  };

  const handleDeleteCurrentEvent = () => {
    if (window.confirm(`Are you sure you want to delete "${event.eventName}"?`)) {
      deleteEvent(event.id);
      showToast('Event deleted', 'info');
      navigate('/');
    }
  };

  return (
    <div className="dashboard-page animate-fade-in" id="dashboard-page">
      {/* Top Banner / Event Selector */}
      <div className="dashboard-header-bar">
        <div className="event-switch-container">
          <label htmlFor="event-selector" className="sr-only">Switch Event</label>
          <select
            id="event-selector"
            className="event-selector-dropdown"
            value={event.id}
            onChange={handleSwitchEvent}
          >
            {allEvents.map(evt => (
              <option key={evt.id} value={evt.id}>
                {evt.eventName} ({evt.eventType})
              </option>
            ))}
            <option value="new">+ Plan New Event</option>
          </select>
        </div>

        <div className="header-actions">
          <button
            className="btn-danger-ghost btn-sm"
            onClick={handleDeleteCurrentEvent}
            id="btn-delete-event"
            title="Delete this event"
          >
            <Trash2 size={15} />
            <span className="hide-mobile">Delete</span>
          </button>
        </div>
      </div>

      {/* Hero Event Banner */}
      <div className="event-hero-card glass-card">
        <div className="hero-left">
          <div className="hero-badges">
            <span className={`badge-pill badge-${event.eventType}`}>
              {event.eventType.toUpperCase()}
            </span>
            <span className="badge-pill badge-countdown">
              <Clock size={13} />
              {daysLeft === 0 ? 'Event Day Today!' : `${daysLeft} Days to go`}
            </span>
          </div>
          <h1 className="event-title" id="dashboard-event-title">{event.eventName}</h1>
          <p className="event-subtitle">
            {event.culturalContext ? `${event.culturalContext} • ` : ''}
            Target Date: <strong>{formatDate(event.eventDate)}</strong>
          </p>

          <div className="hero-meta-chips">
            <div className="meta-chip">
              <Wallet size={15} className="chip-icon text-accent" />
              <span>Budget: <strong>{formatCurrency(event.budget)}</strong></span>
            </div>
            <div className="meta-chip">
              <Users size={15} className="chip-icon text-cyan" />
              <span>Guests: <strong>{event.guestCount}</strong></span>
            </div>
            {event.priorities && (
              <div className="meta-chip hide-mobile">
                <Award size={15} className="chip-icon text-gold" />
                <span>Focus: <strong>{event.priorities}</strong></span>
              </div>
            )}
          </div>
        </div>

        <div className="hero-right">
          <div className="health-score-container">
            <div className="health-score-ring">
              <span className="health-score-number">{healthScore}%</span>
              <span className="health-score-label">Plan Readiness</span>
            </div>
          </div>
          <button
            className="btn-primary btn-adaptive-action"
            onClick={() => setShowAdaptiveModal(true)}
            id="btn-open-adaptive-modal"
          >
            <RefreshCw size={16} />
            <span>AI Adaptive Replanner</span>
          </button>
        </div>
      </div>

      {isInitializingAI && (
        <div className="ai-loader-card glass-card animate-pulse">
          <Sparkles className="spin-icon" size={24} />
          <div>
            <h4>CelebriPlan AI is generating your customized blueprint...</h4>
            <p>Creating tailored budget allocations, milestone timelines, vendor criteria, and themes.</p>
          </div>
        </div>
      )}

      {/* Grid of Key Features & Progress */}
      <div className="dashboard-grid">
        {/* Card 1: Budget Summary */}
        <div className="dash-card glass-card">
          <div className="card-header">
            <div className="card-header-title">
              <div className="icon-wrapper icon-wallet">
                <Wallet size={18} />
              </div>
              <h3>Budget Allocation</h3>
            </div>
            <Link to="/budget" className="card-link" id="link-view-budget">
              Details <ChevronRight size={16} />
            </Link>
          </div>
          <div className="card-body">
            <div className="budget-headline">
              <span className="budget-large">{formatCurrency(event.budget)}</span>
              <span className="budget-sub">Total Planned</span>
            </div>

            <div className="budget-bars-list">
              {(event.budgetBreakdown?.categories || []).slice(0, 4).map((cat, idx) => (
                <div key={idx} className="budget-bar-row">
                  <div className="budget-bar-info">
                    <span className="cat-name">{cat.name}</span>
                    <span className="cat-amount">{formatCurrency(cat.allocated)} ({cat.percentage}%)</span>
                  </div>
                  <div className="mini-progress-track">
                    <div
                      className="mini-progress-fill"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: idx === 0 ? 'var(--color-primary)' : idx === 1 ? 'var(--color-secondary)' : idx === 2 ? '#f59e0b' : '#10b981'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="card-footer-tip">
              <ShieldCheck size={14} className="text-success" />
              <span>Contingency fund: {formatCurrency(event.budgetBreakdown?.contingency || Math.round(event.budget * 0.05))}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Timeline & Task Progress */}
        <div className="dash-card glass-card">
          <div className="card-header">
            <div className="card-header-title">
              <div className="icon-wrapper icon-calendar">
                <Calendar size={18} />
              </div>
              <h3>Task Timeline</h3>
            </div>
            <Link to="/timeline" className="card-link" id="link-view-timeline">
              Full Schedule <ChevronRight size={16} />
            </Link>
          </div>
          <div className="card-body">
            <div className="task-progress-overview">
              <div className="progress-fraction">
                <span className="progress-count">{completedCount}</span>
                <span className="progress-denom">/ {totalTasks} done</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${taskProgressPct}%` }} />
              </div>
            </div>

            <div className="upcoming-tasks-list">
              <h4 className="section-mini-heading">High Priority Actions</h4>
              {allTasks.slice(0, 3).map((task) => {
                const isCompleted = (event.completedTasks || []).includes(task.id);
                return (
                  <div
                    key={task.id}
                    className={`mini-task-item ${isCompleted ? 'task-done' : ''}`}
                    onClick={() => handleTaskToggle(task.id)}
                  >
                    <div className="task-checkbox">
                      {isCompleted ? <CheckCircle2 size={16} className="text-success" /> : <div className="checkbox-empty" />}
                    </div>
                    <div className="task-meta">
                      <span className="task-title-text">{task.title}</span>
                      <span className="task-deadline">Due: {task.deadline}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card 3: Vendor Checklist */}
        <div className="dash-card glass-card">
          <div className="card-header">
            <div className="card-header-title">
              <div className="icon-wrapper icon-users">
                <Users size={18} />
              </div>
              <h3>Vendor Coordination</h3>
            </div>
            <Link to="/vendors" className="card-link" id="link-view-vendors">
              Checklist <ChevronRight size={16} />
            </Link>
          </div>
          <div className="card-body">
            <p className="card-intro-text">
              AI curated checklist with inquiry questions & comparison benchmarks for Indian events.
            </p>
            <div className="vendor-category-chips">
              {(event.vendorChecklist?.vendors || []).map((vendor, idx) => (
                <div key={idx} className="vendor-chip-item">
                  <span className="vendor-chip-title">{vendor.category}</span>
                  <span className="vendor-chip-range">
                    {formatCurrency(vendor.budgetRange?.min)} - {formatCurrency(vendor.budgetRange?.max)}
                  </span>
                </div>
              ))}
            </div>
            <div className="card-footer-tip">
              <Sparkles size={14} className="text-accent" />
              <span>Includes red flags & negotiation tips</span>
            </div>
          </div>
        </div>

        {/* Card 4: Themes & Ideas */}
        <div className="dash-card glass-card">
          <div className="card-header">
            <div className="card-header-title">
              <div className="icon-wrapper icon-ideas">
                <Sparkles size={18} />
              </div>
              <h3>Personalized Ideas</h3>
            </div>
            <Link to="/ideas" className="card-link" id="link-view-ideas">
              Explore Themes <ChevronRight size={16} />
            </Link>
          </div>
          <div className="card-body">
            {event.ideas?.themes?.[0] ? (
              <div className="featured-theme-preview">
                <div className="theme-pill">Featured AI Concept</div>
                <h4 className="featured-theme-title">{event.ideas.themes[0].name}</h4>
                <p className="featured-theme-desc">{event.ideas.themes[0].description}</p>
                <div className="theme-highlights">
                  <span>🎨 {event.ideas.themes[0].elements?.decoration?.[0]}</span>
                  <span>🍽️ {event.ideas.foodSuggestions?.[0]?.items?.[0] || 'Curated Catering'}</span>
                </div>
              </div>
            ) : (
              <p className="card-intro-text">Generate creative themes, catering menus, and entertainment.</p>
            )}
          </div>
        </div>
      </div>

      {/* AI Chat Teaser Banner */}
      <div className="chat-teaser-banner glass-card">
        <div className="teaser-content">
          <div className="teaser-icon">
            <MessageSquare size={28} />
          </div>
          <div>
            <h3>Need personalized planning advice or contract reviews?</h3>
            <p>Your CelebriPlan AI Assistant understands all your event constraints, budget, and guest details.</p>
          </div>
        </div>
        <Link to="/chat" className="btn-secondary btn-chat-launch" id="btn-open-chat">
          Chat with AI Assistant
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* Adaptive Replanning Modal */}
      {showAdaptiveModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="adaptive-title">
          <div className="modal-backdrop" onClick={() => setShowAdaptiveModal(false)} />
          <div className="modal-content glass-card adaptive-modal-box">
            <div className="modal-header">
              <div className="modal-icon">
                <RefreshCw size={22} />
              </div>
              <h2 id="adaptive-title" className="modal-title">AI Adaptive Replanner</h2>
              <button
                className="modal-close"
                onClick={() => setShowAdaptiveModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-description">
                Plans change — budgets tighten, guest counts shift, dates move. Tell the AI what changed,
                and it will evaluate tradeoffs without sacrificing guest delight.
              </p>

              <div className="form-group">
                <label className="form-label" htmlFor="change-type-select">Type of Change</label>
                <select
                  id="change-type-select"
                  className="form-input"
                  value={changeType}
                  onChange={(e) => setChangeType(e.target.value)}
                >
                  <option value="budget">Budget Adjustment (cut or increase)</option>
                  <option value="guests">Guest Count Shift</option>
                  <option value="date">Date / Timeline Acceleration</option>
                  <option value="venue">Venue or Vendor Constraint</option>
                  <option value="other">General Scope Change</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="change-description-input">Describe the Change</label>
                <textarea
                  id="change-description-input"
                  className="form-input"
                  rows={3}
                  value={changeDescription}
                  onChange={(e) => setChangeDescription(e.target.value)}
                  placeholder="e.g., We need to reduce total budget by ₹60,000, or Guest count went from 150 to 220..."
                />
              </div>

              {/* Preset Quick Chips */}
              <div className="preset-chips">
                <span className="preset-label">Quick Scenarios:</span>
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() => {
                    setChangeType('budget');
                    setChangeDescription(`Reduce total budget by 15% due to unforeseen expenses.`);
                  }}
                >
                  Cut Budget 15%
                </button>
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() => {
                    setChangeType('guests');
                    setChangeDescription(`Guest count increased by 50 additional attendees.`);
                  }}
                >
                  +50 Guests
                </button>
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() => {
                    setChangeType('budget');
                    setChangeDescription(`Reallocate ₹30,000 from floral decor towards live food counters.`);
                  }}
                >
                  Food Over Decor
                </button>
              </div>

              <div className="modal-action-row">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleRunAdaptiveReplanner}
                  disabled={!changeDescription.trim() || isAnalyzingChange}
                  id="btn-simulate-tradeoffs"
                >
                  {isAnalyzingChange ? (
                    <>
                      <Sparkles className="spin-icon" size={16} />
                      Analyzing Tradeoffs...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Simulate Impact & Tradeoffs
                    </>
                  )}
                </button>
              </div>

              {/* Analysis Results Display */}
              {changeAnalysis && (
                <div className="change-results-card animate-fade-in-up">
                  <h4 className="results-headline">AI Tradeoff Evaluation</h4>
                  <p className="impact-summary-text">{changeAnalysis.impactSummary}</p>

                  <div className="affected-areas-list">
                    <h5>Affected Areas</h5>
                    {changeAnalysis.affectedAreas?.map((item, idx) => (
                      <div key={idx} className="affected-area-item">
                        <span className={`impact-tag impact-${item.impact}`}>{item.impact}</span>
                        <div>
                          <strong>{item.area}:</strong> {item.description}
                          <p className="recommendation-text">💡 {item.recommendation}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {changeAnalysis.tradeoffs?.length > 0 && (
                    <div className="tradeoffs-box">
                      <h5>Strategic Tradeoffs</h5>
                      {changeAnalysis.tradeoffs.map((t, idx) => (
                        <div key={idx} className="tradeoff-item">
                          <p className="tradeoff-option"><strong>Option {idx + 1}:</strong> {t.option}</p>
                          <div className="pros-cons-grid">
                            <div className="pro-col">
                              {t.pros?.map((p, i) => <span key={i} className="pro-line">✓ {p}</span>)}
                            </div>
                            <div className="con-col">
                              {t.cons?.map((c, i) => <span key={i} className="con-line">⚠ {c}</span>)}
                            </div>
                          </div>
                          {t.savings && (
                            <span className="savings-badge">Estimated Savings: {formatCurrency(t.savings)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="apply-plan-row">
                    <button
                      type="button"
                      className="btn-primary btn-apply-adapt"
                      onClick={handleApplyChange}
                      id="btn-apply-adaptive-plan"
                    >
                      <CheckCircle2 size={16} />
                      Accept & Update Active Plan
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
