import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import * as eventStore from '../services/eventStore';

describe('App Routing & Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    // Dismiss key modal in tests by default unless specifically tested
    sessionStorage.setItem('api_key_modal_dismissed', 'true');
    vi.restoreAllMocks();
  });

  it('renders skip link for keyboard accessibility', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    const skipLink = screen.getByRole('link', { name: /skip to main content/i });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('renders landing page at root route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('CelebriPlan')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('redirects to landing page when accessing protected /dashboard without an active event', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    );

    // Should redirect to landing page
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders dashboard when an active event exists', () => {
    const mockEvent = {
      id: 'evt_test_1',
      eventName: 'Grand Diwali Celebration',
      eventType: 'community',
      budget: 300000,
      guestCount: 200,
      eventDate: '2026-11-15',
      budgetBreakdown: {
        totalBudget: 300000,
        categories: [{ name: 'Venue', allocated: 100000, percentage: 33 }],
        contingency: 15000,
      },
      timeline: { phases: [], milestones: [] },
      vendorChecklist: { vendors: [] },
      ideas: { themes: [] },
      completedTasks: [],
      chatHistory: [],
      changeLog: [],
    };

    vi.spyOn(eventStore, 'getActiveEvent').mockReturnValue(mockEvent);

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('Grand Diwali Celebration')).toBeInTheDocument();
  });

  it('prompts API key modal when key is not configured and not dismissed', () => {
    sessionStorage.removeItem('api_key_modal_dismissed');

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Gemini API Key')).toBeInTheDocument();
  });

  it('redirects unmatched wildcard route to landing page', () => {
    render(
      <MemoryRouter initialEntries={['/some-unknown-random-route']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
