import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LandingPage from '../LandingPage';

describe('LandingPage Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );
  };

  it('renders main hero heading and brand badge', () => {
    renderComponent();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/plan your perfect/i);
    expect(screen.getByText(/powered by google gemini ai/i)).toBeInTheDocument();
  });

  it('renders primary call to action button linking to /new', () => {
    renderComponent();
    const startBtn = screen.getByRole('link', { name: /start planning/i });
    expect(startBtn).toBeInTheDocument();
    expect(startBtn).toHaveAttribute('href', '/new');
  });

  it('renders all 6 feature cards with accessible headers', () => {
    renderComponent();
    expect(screen.getByText('Smart Budget Planner')).toBeInTheDocument();
    expect(screen.getByText('Timeline Generator')).toBeInTheDocument();
    expect(screen.getByText('Vendor Coordinator')).toBeInTheDocument();
    expect(screen.getByText('Personalized Ideas')).toBeInTheDocument();
    expect(screen.getByText('Adaptive Replanning')).toBeInTheDocument();
    expect(screen.getByText('AI Planning Chat')).toBeInTheDocument();
  });

  it('renders Continue Planning button when an existing event exists', () => {
    localStorage.setItem(
      'celebriplan_events',
      JSON.stringify([{ id: 'test-1', eventName: 'Family Gathering', eventType: 'community' }])
    );
    renderComponent();
    const continueBtn = screen.getByRole('link', { name: /continue planning/i });
    expect(continueBtn).toBeInTheDocument();
    expect(continueBtn).toHaveAttribute('href', '/dashboard');
  });

  it('renders 3-step How It Works breakdown', () => {
    renderComponent();
    expect(screen.getByText('Tell Us About Your Event')).toBeInTheDocument();
    expect(screen.getByText('AI Creates Your Plan')).toBeInTheDocument();
    expect(screen.getByText('Refine & Execute')).toBeInTheDocument();
  });
});
