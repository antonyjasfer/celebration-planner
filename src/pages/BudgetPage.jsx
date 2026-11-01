import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Sparkles, AlertTriangle, ShieldCheck,
  Plus, Trash2, ChevronDown, ChevronUp, RefreshCw, CheckCircle2,
  Sliders, Lightbulb
} from 'lucide-react';
import { updateEvent, formatCurrency } from '../services/eventStore';
import { generateBudgetBreakdown, analyzeChangeImpact } from '../services/gemini';
import { sanitizeInput, sanitizeBudget } from '../utils/sanitize';
import { useModalEscape } from '../hooks/useModalEscape';
import './BudgetPage.css';

/**
 * Smart Budget Allocation Page.
 * Displays itemized category breakdowns, emergency contingency buffers,
 * cost-per-guest analysis, custom line item management, and an interactive
 * Tradeoff & Cut Simulator.
 *
 * @param {Object} props
 * @param {Object} props.event - Active event record
 * @param {function(string, string=): void} props.showToast - Toast notification dispatcher
 */
export default function BudgetPage({ event, showToast }) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [newItemModalCategory, setNewItemModalCategory] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [newItemNotes, setNewItemNotes] = useState('');

  // Tradeoff Simulator state
  const [simulatorTarget, setSimulatorTarget] = useState(event.budget);
  const [isSimulating, setIsSimulating] = useState(false);
  const [tradeoffResult, setTradeoffResult] = useState(null);

  // Keyboard accessibility for item modal
  useModalEscape(Boolean(newItemModalCategory), () => setNewItemModalCategory(null));

  const budgetData = event.budgetBreakdown || {
    totalBudget: event.budget,
    categories: [],
    contingency: Math.round(event.budget * 0.05),
    warnings: [],
    suggestions: []
  };

  const totalAllocated = (budgetData.categories || []).reduce((sum, c) => sum + (c.allocated || 0), 0);
  const contingency = budgetData.contingency || Math.round(event.budget * 0.05);
  const costPerGuest = Math.round(event.budget / Math.max(event.guestCount, 1));

  const toggleCategoryExpand = (catName) => {
    setExpandedCategories(prev => ({ ...prev, [catName]: !prev[catName] }));
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const freshData = await generateBudgetBreakdown(event);
      updateEvent(event.id, { budgetBreakdown: freshData });
      showToast('Budget regenerated with AI optimization!', 'success');
    } catch (err) {
      console.error('Regenerate error:', err);
      showToast('Failed to regenerate budget.', 'error');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    const cleanName = sanitizeInput(newItemName.trim());
    const cleanAmount = sanitizeBudget(newItemAmount);
    const cleanNotes = sanitizeInput(newItemNotes.trim());
    if (!cleanName || cleanAmount <= 0) return;

    const updatedCategories = budgetData.categories.map(cat => {
      if (cat.name === newItemModalCategory) {
        const newBreakdown = [
          ...(cat.breakdown || []),
          { item: cleanName, estimated: cleanAmount, notes: cleanNotes }
        ];
        return {
          ...cat,
          allocated: (cat.allocated || 0) + cleanAmount,
          breakdown: newBreakdown,
        };
      }
      return cat;
    });

    updateEvent(event.id, {
      budgetBreakdown: {
        ...budgetData,
        categories: updatedCategories,
      }
    });

    showToast(`Added "${cleanName}" to ${newItemModalCategory}`, 'success');
    setNewItemModalCategory(null);
    setNewItemName('');
    setNewItemAmount('');
    setNewItemNotes('');
  };

  const handleDeleteItem = (catName, itemIndex) => {
    const updatedCategories = budgetData.categories.map(cat => {
      if (cat.name === catName) {
        const itemCost = cat.breakdown[itemIndex]?.estimated || 0;
        const newBreakdown = cat.breakdown.filter((_, idx) => idx !== itemIndex);
        return {
          ...cat,
          allocated: Math.max(0, (cat.allocated || 0) - itemCost),
          breakdown: newBreakdown,
        };
      }
      return cat;
    });

    updateEvent(event.id, {
      budgetBreakdown: {
        ...budgetData,
        categories: updatedCategories,
      }
    });
    showToast('Item removed', 'info');
  };

  const handleRunSimulator = async () => {
    setIsSimulating(true);
    setTradeoffResult(null);
    const diff = simulatorTarget - event.budget;
    const desc = diff < 0
      ? `Budget must be reduced by ${formatCurrency(Math.abs(diff))} (from ${formatCurrency(event.budget)} to ${formatCurrency(simulatorTarget)}). Identify realistic tradeoffs.`
      : `Budget increased by ${formatCurrency(diff)} (from ${formatCurrency(event.budget)} to ${formatCurrency(simulatorTarget)}). Recommend high-impact enhancements.`;

    try {
      const result = await analyzeChangeImpact({
        currentPlan: event,
        changeDescription: sanitizeInput(desc),
        changeType: 'budget'
      });
      setTradeoffResult(result);
    } catch (err) {
      console.error('Simulator error:', err);
      showToast('Simulation failed, please try again.', 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleApplySimulatedBudget = () => {
    if (!tradeoffResult) return;
    const newTotal = tradeoffResult.revisedBudget?.revised || simulatorTarget;
    updateEvent(event.id, {
      budget: newTotal,
      budgetBreakdown: {
        ...budgetData,
        totalBudget: newTotal
      }
    });
    showToast(`Updated target budget to ${formatCurrency(newTotal)}`, 'success');
    setTradeoffResult(null);
  };

  return (
    <div className="budget-page animate-fade-in" id="budget-page">
      {/* Top Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Smart Budget Allocation</h1>
          <p className="page-subtitle">
            AI-modeled spending blueprint for <strong>{event.eventName}</strong> tailored to your priorities.
          </p>
        </div>
        <button
          className="btn-secondary"
          onClick={handleRegenerate}
          disabled={isRegenerating}
          id="btn-regenerate-budget"
        >
          <RefreshCw className={isRegenerating ? 'spin-icon' : ''} size={16} aria-hidden="true" />
          {isRegenerating ? 'Recalculating...' : 'Regenerate Budget'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="budget-stats-grid">
        <div className="stat-card glass-card">
          <span className="stat-label">Total Planned Budget</span>
          <span className="stat-value text-accent">{formatCurrency(event.budget)}</span>
          <span className="stat-hint">Locked for {event.guestCount} guests</span>
        </div>
        <div className="stat-card glass-card">
          <span className="stat-label">Allocated to Categories</span>
          <span className="stat-value">{formatCurrency(totalAllocated)}</span>
          <span className="stat-hint">{(event.budgetBreakdown?.categories || []).length} active categories</span>
        </div>
        <div className="stat-card glass-card">
          <span className="stat-label">Contingency Reserve</span>
          <span className="stat-value text-success">{formatCurrency(contingency)}</span>
          <span className="stat-hint">Emergency buffer (~5%)</span>
        </div>
        <div className="stat-card glass-card">
          <span className="stat-label">Cost Per Guest</span>
          <span className="stat-value text-cyan">{formatCurrency(costPerGuest)}</span>
          <span className="stat-hint">Avg spend per attendee</span>
        </div>
      </div>

      {/* Tradeoff Simulator Box */}
      <div className="simulator-card glass-card">
        <div className="simulator-header">
          <div className="sim-title-group">
            <Sliders size={20} className="text-secondary" aria-hidden="true" />
            <div>
              <h3>AI Tradeoff & Cut Simulator</h3>
              <p>Test "what-if" scenarios. Drag the slider to see how CelebriPlan AI protects quality while adjusting costs.</p>
            </div>
          </div>
        </div>

        <div className="simulator-body">
          <div className="slider-control">
            <div className="slider-labels">
              <span>₹{Math.round(event.budget * 0.5).toLocaleString('en-IN')}</span>
              <span className="slider-current">{formatCurrency(simulatorTarget)}</span>
              <span>₹{Math.round(event.budget * 1.5).toLocaleString('en-IN')}</span>
            </div>
            <label htmlFor="budget-simulator-slider" className="sr-only">Budget target slider</label>
            <input
              type="range"
              min={Math.round(event.budget * 0.5)}
              max={Math.round(event.budget * 1.5)}
              step={10000}
              value={simulatorTarget}
              onChange={(e) => setSimulatorTarget(Number(e.target.value))}
              className="budget-slider"
              id="budget-simulator-slider"
              aria-label="Target budget amount in rupees"
            />
          </div>

          <button
            className="btn-primary"
            onClick={handleRunSimulator}
            disabled={isSimulating}
            id="btn-run-budget-simulator"
          >
            {isSimulating ? (
              <>
                <Sparkles className="spin-icon" size={16} aria-hidden="true" />
                Analyzing Tradeoffs...
              </>
            ) : (
              <>
                <Sparkles size={16} aria-hidden="true" />
                Evaluate Tradeoffs at {formatCurrency(simulatorTarget)}
              </>
            )}
          </button>
        </div>

        {tradeoffResult && (
          <div className="simulator-results animate-fade-in-up">
            <h4 className="sim-results-title">AI Tradeoff Recommendations</h4>
            <p className="sim-summary">{tradeoffResult.impactSummary}</p>

            <div className="sim-tradeoffs-list">
              {tradeoffResult.tradeoffs?.map((t, idx) => (
                <div key={idx} className="sim-tradeoff-item">
                  <div className="sim-tradeoff-top">
                    <strong>Strategy {idx + 1}:</strong> {t.option}
                    {t.savings && <span className="savings-tag">Saves {formatCurrency(t.savings)}</span>}
                  </div>
                  <div className="tradeoff-sub-grid">
                    <div>
                      <span className="sub-tag text-success">Benefit:</span>
                      {t.pros?.map((p, i) => <p key={i} className="pro-p">✓ {p}</p>)}
                    </div>
                    <div>
                      <span className="sub-tag text-warning">Compromise:</span>
                      {t.cons?.map((c, i) => <p key={i} className="con-p">⚠ {c}</p>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="sim-apply-bar">
              <button
                className="btn-primary"
                onClick={handleApplySimulatedBudget}
                id="btn-apply-sim-budget"
              >
                <CheckCircle2 size={16} aria-hidden="true" />
                Apply {formatCurrency(tradeoffResult.revisedBudget?.revised || simulatorTarget)} as New Budget
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Budget Categories List */}
      <div className="categories-section">
        <h2 className="section-title">Itemized Categories & Line Items</h2>
        <div className="categories-list">
          {budgetData.categories?.map((cat, idx) => {
            const isExpanded = Boolean(expandedCategories[cat.name]);
            return (
              <div key={idx} className="category-accordion glass-card">
                <div className="cat-accordion-header" onClick={() => toggleCategoryExpand(cat.name)}>
                  <div className="cat-header-left">
                    <span className={`priority-badge priority-${cat.priority}`}>{cat.priority} priority</span>
                    <h3 className="cat-name-heading">{cat.name}</h3>
                  </div>

                  <div className="cat-header-right">
                    <div className="cat-amounts-preview">
                      <span className="cat-allocated-amt">{formatCurrency(cat.allocated)}</span>
                      <span className="cat-pct-amt">({cat.percentage}% of total)</span>
                    </div>
                    {isExpanded ? <ChevronUp size={20} aria-hidden="true" /> : <ChevronDown size={20} aria-hidden="true" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="cat-accordion-body animate-fade-in">
                    {/* Line Items Table */}
                    <div className="line-items-wrapper">
                      <div className="line-items-header">
                        <span>Line Item</span>
                        <span>Estimated Cost</span>
                        <span>Notes / Details</span>
                        <span>Action</span>
                      </div>
                      {(cat.breakdown || []).map((item, itemIdx) => (
                        <div key={itemIdx} className="line-item-row">
                          <span className="item-name-cell">{item.item}</span>
                          <span className="item-cost-cell">{formatCurrency(item.estimated)}</span>
                          <span className="item-notes-cell">{item.notes || '—'}</span>
                          <button
                            className="btn-icon-danger"
                            onClick={() => handleDeleteItem(cat.name, itemIdx)}
                            title="Delete item"
                            aria-label={`Delete item ${item.item}`}
                          >
                            <Trash2 size={14} aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="cat-actions-row">
                      <button
                        className="btn-secondary btn-sm"
                        onClick={() => setNewItemModalCategory(cat.name)}
                      >
                        <Plus size={14} aria-hidden="true" /> Add Line Item
                      </button>
                    </div>

                    {/* Saving Tips */}
                    {cat.savingTips?.length > 0 && (
                      <div className="saving-tips-box">
                        <div className="saving-tips-title">
                          <Lightbulb size={14} className="text-gold" aria-hidden="true" />
                          <span>AI Cost-Optimization Tips for {cat.name}:</span>
                        </div>
                        <ul>
                          {cat.savingTips.map((tip, tipIdx) => (
                            <li key={tipIdx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Warnings & Suggestions Banner */}
      <div className="budget-insights-grid">
        {budgetData.warnings?.length > 0 && (
          <div className="insight-card glass-card card-warning">
            <div className="insight-header">
              <AlertTriangle className="text-warning" size={18} aria-hidden="true" />
              <h4>Budget Risk Warnings</h4>
            </div>
            <ul>
              {budgetData.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {budgetData.suggestions?.length > 0 && (
          <div className="insight-card glass-card card-suggestion">
            <div className="insight-header">
              <ShieldCheck className="text-success" size={18} aria-hidden="true" />
              <h4>Strategic Allocation Advice</h4>
            </div>
            <ul>
              {budgetData.suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Add Custom Item Modal */}
      {newItemModalCategory && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-item-modal-title"
        >
          <div className="modal-backdrop" onClick={() => setNewItemModalCategory(null)} aria-hidden="true" />
          <div className="modal-content glass-card item-modal-box">
            <div className="modal-header">
              <h3 className="modal-title" id="add-item-modal-title">Add Item to {newItemModalCategory}</h3>
              <button className="modal-close" onClick={() => setNewItemModalCategory(null)} aria-label="Close modal">✕</button>
            </div>
            <form onSubmit={handleAddItem}>
              <div className="form-group">
                <label className="form-label" htmlFor="new-item-name">Item Name</label>
                <input
                  id="new-item-name"
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g., Live Chaat Counter"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="new-item-cost">Estimated Cost (INR)</label>
                <input
                  id="new-item-cost"
                  type="number"
                  className="form-input"
                  required
                  placeholder="e.g., 25000"
                  value={newItemAmount}
                  onChange={(e) => setNewItemAmount(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="new-item-notes">Notes / Vendor Detail</label>
                <input
                  id="new-item-notes"
                  type="text"
                  className="form-input"
                  placeholder="Optional detail..."
                  value={newItemNotes}
                  onChange={(e) => setNewItemNotes(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn-primary">Add Item</button>
                <button type="button" className="btn-secondary" onClick={() => setNewItemModalCategory(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

BudgetPage.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.string.isRequired,
    eventName: PropTypes.string.isRequired,
    budget: PropTypes.number.isRequired,
    guestCount: PropTypes.number.isRequired,
    budgetBreakdown: PropTypes.object,
  }).isRequired,
  showToast: PropTypes.func.isRequired,
};
