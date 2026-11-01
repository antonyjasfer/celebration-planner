import { Link, useLocation } from 'react-router-dom';
import {
  Sparkles, Home, LayoutDashboard, Wallet, Calendar,
  Users, Lightbulb, MessageCircle, Settings, PartyPopper
} from 'lucide-react';
import './Navbar.css';

/**
 * Navigation bar component.
 * Shows branding and event-aware navigation links.
 */
export default function Navbar({ activeEvent, onApiKeyClick }) {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/budget', label: 'Budget', icon: Wallet },
    { path: '/timeline', label: 'Timeline', icon: Calendar },
    { path: '/vendors', label: 'Vendors', icon: Users },
    { path: '/ideas', label: 'Ideas', icon: Lightbulb },
    { path: '/chat', label: 'AI Chat', icon: MessageCircle },
  ];

  return (
    <header className="navbar" role="banner" id="navbar">
      <nav className="navbar-inner" aria-label="Main navigation">
        <Link to="/" className="navbar-brand" id="nav-brand">
          <PartyPopper className="brand-icon" size={24} aria-hidden="true" />
          <span className="brand-text">CelebriPlan</span>
          <span className="brand-badge">AI</span>
        </Link>

        {activeEvent && !isLanding && (
          <div className="navbar-links" role="navigation" aria-label="Event planning sections">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                id={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                aria-current={location.pathname === item.path ? 'page' : undefined}
              >
                <item.icon size={16} aria-hidden="true" />
                <span className="nav-link-text">{item.label}</span>
              </Link>
            ))}
          </div>
        )}

        <div className="navbar-actions">
          <button
            className="btn-ghost nav-settings-btn"
            onClick={onApiKeyClick}
            aria-label="API Key Settings"
            id="btn-api-settings"
          >
            <Settings size={18} aria-hidden="true" />
          </button>
        </div>
      </nav>
    </header>
  );
}
