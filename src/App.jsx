import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar, Toast, ApiKeyModal } from './components';
import { useToast } from './hooks/useToast';
import LandingPage from './pages/LandingPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import BudgetPage from './pages/BudgetPage';
import TimelinePage from './pages/TimelinePage';
import VendorsPage from './pages/VendorsPage';
import IdeasPage from './pages/IdeasPage';
import ChatPage from './pages/ChatPage';
import { isApiKeyConfigured } from './services/gemini';
import { getActiveEvent, subscribe } from './services/eventStore';

/**
 * Root application component.
 * Manages global routing, active event subscription, API key modal state,
 * and high-priority toast notifications.
 */
export default function App() {
  const [activeEvent, setActiveEvent] = useState(getActiveEvent);
  const [showApiKeyModal, setShowApiKeyModal] = useState(() => {
    const dismissed = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('api_key_modal_dismissed');
    return !isApiKeyConfigured() && !dismissed;
  });
  const { toast, showToast, clearToast } = useToast();

  // Subscribe to reactive event store changes
  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setActiveEvent(getActiveEvent());
    });
    return unsubscribe;
  }, []);

  return (
    <div className="app" id="app-root">
      <a href="#main-content" className="skip-link" aria-label="Skip to main content">
        Skip to main content
      </a>
      <Navbar
        activeEvent={activeEvent}
        onApiKeyClick={() => setShowApiKeyModal(true)}
      />

      <main className="main-content" role="main" id="main-content">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/new" element={<OnboardingPage showToast={showToast} />} />
          <Route
            path="/dashboard"
            element={
              activeEvent
                ? <DashboardPage event={activeEvent} showToast={showToast} />
                : <Navigate to="/" replace />
            }
          />
          <Route
            path="/budget"
            element={
              activeEvent
                ? <BudgetPage event={activeEvent} showToast={showToast} />
                : <Navigate to="/" replace />
            }
          />
          <Route
            path="/timeline"
            element={
              activeEvent
                ? <TimelinePage event={activeEvent} showToast={showToast} />
                : <Navigate to="/" replace />
            }
          />
          <Route
            path="/vendors"
            element={
              activeEvent
                ? <VendorsPage event={activeEvent} showToast={showToast} />
                : <Navigate to="/" replace />
            }
          />
          <Route
            path="/ideas"
            element={
              activeEvent
                ? <IdeasPage event={activeEvent} showToast={showToast} />
                : <Navigate to="/" replace />
            }
          />
          <Route
            path="/chat"
            element={
              activeEvent
                ? <ChatPage event={activeEvent} showToast={showToast} />
                : <Navigate to="/" replace />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {showApiKeyModal && (
        <ApiKeyModal
          onClose={() => {
            sessionStorage.setItem('api_key_modal_dismissed', 'true');
            setShowApiKeyModal(false);
          }}
        />
      )}

      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={clearToast}
        />
      )}
    </div>
  );
}
