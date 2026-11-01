import { useState } from 'react';
import {
  Users, HelpCircle, AlertTriangle, ShieldCheck,
  CheckCircle2, Plus, Trash2, RefreshCw, Phone, DollarSign
} from 'lucide-react';
import { updateEvent, formatCurrency } from '../services/eventStore';
import { generateVendorChecklist } from '../services/gemini';
import './VendorsPage.css';

export default function VendorsPage({ event, showToast }) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('categories'); // 'categories' | 'comparator' | 'contracts'

  // New shortlisted vendor modal
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorCat, setNewVendorCat] = useState('Catering & Beverages');
  const [newVendorQuote, setNewVendorQuote] = useState('');
  const [newVendorPhone, setNewVendorPhone] = useState('');
  const [newVendorStatus, setNewVendorStatus] = useState('Quoted');
  const [newVendorNotes, setNewVendorNotes] = useState('');

  const vendorData = event.vendorChecklist || {
    vendors: [],
    generalTips: [],
    negotiationTips: [],
    contractChecklist: []
  };

  const shortlistedVendors = event.shortlistedVendors || [];

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const freshData = await generateVendorChecklist(event);
      updateEvent(event.id, { vendorChecklist: freshData });
      showToast('Vendor coordination checklist updated!', 'success');
    } catch (err) {
      console.error('Vendor checklist error:', err);
      showToast('Failed to regenerate vendor checklist.', 'error');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleAddShortlistedVendor = (e) => {
    e.preventDefault();
    if (!newVendorName.trim() || !newVendorQuote) return;

    const newEntry = {
      id: `vquote-${Date.now()}`,
      name: newVendorName.trim(),
      category: newVendorCat,
      quote: Number(newVendorQuote),
      phone: newVendorPhone.trim(),
      status: newVendorStatus,
      notes: newVendorNotes.trim(),
      createdAt: new Date().toISOString()
    };

    const updated = [...shortlistedVendors, newEntry];
    updateEvent(event.id, { shortlistedVendors: updated });
    showToast(`Added ${newVendorName} to comparison board!`, 'success');

    setShowAddVendorModal(false);
    setNewVendorName('');
    setNewVendorQuote('');
    setNewVendorPhone('');
    setNewVendorNotes('');
  };

  const handleDeleteVendorQuote = (id) => {
    const updated = shortlistedVendors.filter(v => v.id !== id);
    updateEvent(event.id, { shortlistedVendors: updated });
    showToast('Vendor removed from comparison board.', 'info');
  };

  const handleUpdateStatus = (id, newStatus) => {
    const updated = shortlistedVendors.map(v => v.id === id ? { ...v, status: newStatus } : v);
    updateEvent(event.id, { shortlistedVendors: updated });
    showToast(`Status updated to ${newStatus}`, 'info');
  };

  // Helper to determine quote vs AI benchmark
  const getBenchmarkComparison = (vendorQuote, category) => {
    const matchingAI = (vendorData.vendors || []).find(v =>
      v.category.toLowerCase().includes(category.toLowerCase()) ||
      category.toLowerCase().includes(v.category.toLowerCase())
    );

    if (!matchingAI?.budgetRange) return null;
    const { min, max } = matchingAI.budgetRange;

    if (vendorQuote < min) {
      return { label: 'Great Value / Below Est.', class: 'tag-value' };
    } else if (vendorQuote <= max) {
      return { label: 'Within AI Budget Benchmark', class: 'tag-good' };
    } else {
      const diff = vendorQuote - max;
      return { label: `+${formatCurrency(diff)} Above Benchmark`, class: 'tag-over' };
    }
  };

  return (
    <div className="vendors-page animate-fade-in" id="vendors-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendor Coordination & Comparison</h1>
          <p className="page-subtitle">
            AI-generated question scripts, red flag warnings, and quotation comparator for <strong>{event.eventName}</strong>.
          </p>
        </div>
        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            id="btn-regenerate-vendors"
          >
            <RefreshCw className={isRegenerating ? 'spin-icon' : ''} size={16} />
            {isRegenerating ? 'Refreshing...' : 'Regenerate Guidance'}
          </button>
          <button
            className="btn-primary"
            onClick={() => setShowAddVendorModal(true)}
            id="btn-add-vendor-quote"
          >
            <Plus size={16} /> Add Vendor Quote
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="vendor-tabs-bar">
        <button
          className={`vendor-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <Users size={16} /> AI Category Guides & Questions
        </button>
        <button
          className={`vendor-tab-btn ${activeTab === 'comparator' ? 'active' : ''}`}
          onClick={() => setActiveTab('comparator')}
        >
          <DollarSign size={16} /> Quotation Comparator ({shortlistedVendors.length})
        </button>
        <button
          className={`vendor-tab-btn ${activeTab === 'contracts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contracts')}
        >
          <ShieldCheck size={16} /> Negotiation & Contract Shield
        </button>
      </div>

      {/* TAB 1: Categories Guide */}
      {activeTab === 'categories' && (
        <div className="categories-tab-content animate-fade-in">
          <div className="vendor-cards-grid">
            {(vendorData.vendors || []).map((v, idx) => {
              return (
                <div key={idx} className="vendor-guide-card glass-card">
                  <div className="vcard-top">
                    <span className={`priority-pill priority-${v.priority}`}>{v.priority}</span>
                    <h3 className="vcard-title">{v.category}</h3>
                    <div className="vcard-budget-range">
                      <span className="range-label">Target Benchmark:</span>
                      <strong className="range-nums">
                        {formatCurrency(v.budgetRange?.min)} – {formatCurrency(v.budgetRange?.max)}
                      </strong>
                    </div>
                    <span className="booking-time-chip">📅 Book: {v.bookingTimeline}</span>
                  </div>

                  <div className="vcard-body">
                    {/* Questions */}
                    <div className="vcard-section">
                      <h4 className="vsection-title text-accent">
                        <HelpCircle size={14} /> Questions to Ask:
                      </h4>
                      <ul className="questions-list">
                        {(v.questionsToAsk || []).map((q, qIdx) => (
                          <li key={qIdx}>{q}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Red flags */}
                    <div className="vcard-section">
                      <h4 className="vsection-title text-warning">
                        <AlertTriangle size={14} /> Red Flags to Watch Out For:
                      </h4>
                      <ul className="red-flags-list">
                        {(v.redFlags || []).map((rf, rfIdx) => (
                          <li key={rfIdx}>{rf}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Pro tip */}
                    {v.tips?.length > 0 && (
                      <div className="vcard-protip">
                        <strong>💡 Pro-tip:</strong> {v.tips[0]}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Quotation Comparator */}
      {activeTab === 'comparator' && (
        <div className="comparator-tab-content animate-fade-in">
          <div className="comparator-hero glass-card">
            <div>
              <h3>Compare Real Quotations Against AI Benchmarks</h3>
              <p>Record vendor quotes, evaluate whether they fit your event's allocation, and track booking statuses.</p>
            </div>
            <button
              className="btn-primary"
              onClick={() => setShowAddVendorModal(true)}
            >
              <Plus size={16} /> Add Vendor Quote
            </button>
          </div>

          {shortlistedVendors.length === 0 ? (
            <div className="empty-comparator glass-card">
              <Users size={36} className="text-tertiary" />
              <h4>No vendor quotes added yet</h4>
              <p>Add quotes from caterers, photographers, venues or DJs to compare their pricing with AI benchmarks.</p>
              <button
                className="btn-secondary"
                onClick={() => setShowAddVendorModal(true)}
              >
                Add Your First Vendor Quote
              </button>
            </div>
          ) : (
            <div className="quotes-table-wrapper glass-card">
              <div className="quotes-table-header">
                <span>Vendor Name</span>
                <span>Category</span>
                <span>Quoted Price</span>
                <span>AI Benchmark Analysis</span>
                <span>Status</span>
                <span>Contact / Action</span>
              </div>
              {shortlistedVendors.map((vendor) => {
                const comparison = getBenchmarkComparison(vendor.quote, vendor.category);
                return (
                  <div key={vendor.id} className="quote-table-row">
                    <div className="vendor-info-cell">
                      <strong>{vendor.name}</strong>
                      {vendor.notes && <span className="cell-sub">{vendor.notes}</span>}
                    </div>

                    <div className="category-cell">
                      <span className="cat-pill">{vendor.category}</span>
                    </div>

                    <div className="price-cell">
                      <span className="price-val">{formatCurrency(vendor.quote)}</span>
                    </div>

                    <div className="benchmark-cell">
                      {comparison ? (
                        <span className={`benchmark-tag ${comparison.class}`}>
                          {comparison.label}
                        </span>
                      ) : (
                        <span className="benchmark-tag tag-neutral">Standard</span>
                      )}
                    </div>

                    <div className="status-cell">
                      <select
                        className="status-dropdown"
                        value={vendor.status}
                        onChange={(e) => handleUpdateStatus(vendor.id, e.target.value)}
                      >
                        <option value="Contacted">Contacted</option>
                        <option value="Quoted">Quoted</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Booked">Booked</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>

                    <div className="action-cell">
                      {vendor.phone && (
                        <a href={`tel:${vendor.phone}`} className="phone-link" title={`Call ${vendor.phone}`}>
                          <Phone size={14} />
                        </a>
                      )}
                      <button
                        className="btn-icon-danger"
                        onClick={() => handleDeleteVendorQuote(vendor.id)}
                        title="Delete quote"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Negotiation & Contracts */}
      {activeTab === 'contracts' && (
        <div className="contracts-tab-content animate-fade-in">
          <div className="contracts-grid">
            <div className="contract-card glass-card">
              <div className="card-top-icon">
                <DollarSign size={22} className="text-secondary" />
                <h3>Indian Event Negotiation Tactics</h3>
              </div>
              <p className="card-intro">
                Vendors often resist direct price cuts. Use these value-engineering strategies to save money:
              </p>
              <ul className="checklist-bullet-list">
                {(vendorData.negotiationTips || []).map((tip, idx) => (
                  <li key={idx}>
                    <CheckCircle2 size={16} className="text-secondary" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="contract-card glass-card">
              <div className="card-top-icon">
                <ShieldCheck size={22} className="text-success" />
                <h3>Contract & Advance Payment Checklist</h3>
              </div>
              <p className="card-intro">
                Never sign or pay advance without verifying these essential clauses:
              </p>
              <ul className="checklist-bullet-list">
                {(vendorData.contractChecklist || []).map((item, idx) => (
                  <li key={idx}>
                    <CheckCircle2 size={16} className="text-success" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Add Vendor Quote Modal */}
      {showAddVendorModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-backdrop" onClick={() => setShowAddVendorModal(false)} />
          <div className="modal-content glass-card vendor-modal-box">
            <div className="modal-header">
              <h3 className="modal-title">Record Vendor Quotation</h3>
              <button className="modal-close" onClick={() => setShowAddVendorModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddShortlistedVendor}>
              <div className="form-group">
                <label className="form-label" htmlFor="vendor-name-input">Vendor / Company Name</label>
                <input
                  id="vendor-name-input"
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g., Royal Flavors Caterers"
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="vendor-cat-select">Category</label>
                <select
                  id="vendor-cat-select"
                  className="form-input"
                  value={newVendorCat}
                  onChange={(e) => setNewVendorCat(e.target.value)}
                >
                  <option value="Catering & Beverages">Catering & Beverages</option>
                  <option value="Venue & Banquet Hall">Venue & Banquet Hall</option>
                  <option value="Decor & Theme Styling">Decor & Theme Styling</option>
                  <option value="Photography & Cinematography">Photography & Cinematography</option>
                  <option value="Sound, DJ & Entertainment">Sound, DJ & Entertainment</option>
                  <option value="Other Vendor">Other Vendor</option>
                </select>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="vendor-quote-input">Quoted Price (INR)</label>
                  <input
                    id="vendor-quote-input"
                    type="number"
                    className="form-input"
                    required
                    placeholder="e.g., 140000"
                    value={newVendorQuote}
                    onChange={(e) => setNewVendorQuote(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="vendor-phone-input">Phone Number</label>
                  <input
                    id="vendor-phone-input"
                    type="tel"
                    className="form-input"
                    placeholder="e.g., +91 98765 43210"
                    value={newVendorPhone}
                    onChange={(e) => setNewVendorPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="vendor-status-select">Status</label>
                <select
                  id="vendor-status-select"
                  className="form-input"
                  value={newVendorStatus}
                  onChange={(e) => setNewVendorStatus(e.target.value)}
                >
                  <option value="Contacted">Contacted</option>
                  <option value="Quoted">Quoted</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Booked">Booked</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="vendor-notes-input">Notes & Inclusions</label>
                <textarea
                  id="vendor-notes-input"
                  className="form-input"
                  rows={2}
                  placeholder="Includes 3 live counters, waitstaff, and setup..."
                  value={newVendorNotes}
                  onChange={(e) => setNewVendorNotes(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn-primary">Save Vendor Quote</button>
                <button type="button" className="btn-secondary" onClick={() => setShowAddVendorModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
