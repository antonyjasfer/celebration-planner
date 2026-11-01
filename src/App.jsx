import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import LandingPage from './pages/LandingPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import BudgetPage from './pages/BudgetPage';
import TimelinePage from './pages/TimelinePage';
import VendorsPage from './pages/VendorsPage';
import IdeasPage from './pages/IdeasPage';
import ChatPage from './pages/ChatPage';
import ApiKeyModal from './components/ApiKeyModal/ApiKeyModal';
import Toast from './components/Toast/Toast';
import { isApiKeyConfigured } from './services/gemini';
import { getActiveEvent, subscribe } from './services/eventStore';

/**
 * Root application component.
 * Manages global state like the active event and API key configuration.
 */
export default function App() {
  const [activeEvent, setActiveEvent] = useState(getActiveEvent);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [toast, setToast] = useState(null);

  // Subscribe to event store changes
  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setActiveEvent(getActiveEvent());
    });
    return unsubscribe;
  }, []);

  // Check for API key on first load only if never dismissed
  useEffect(() => {
    const dismissed = sessionStorage.getItem('api_key_modal_dismissed');
    if (!isApiKeyConfigured() && !dismissed) {
      setShowApiKeyModal(true);
    }
  }, []);

  /** Shows a toast notification */
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  return (
    <div className="app" id="app-root">
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
        <ApiKeyModal onClose={() => {
          sessionStorage.setItem('api_key_modal_dismissed', 'true');
          setShowApiKeyModal(false);
        }} />
      )}

      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
