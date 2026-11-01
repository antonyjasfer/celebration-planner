import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from '../DashboardPage';

const mockEvent = {
  id: 'test-evt-dash-1',
  eventName: 'Aarav & Meera Royal Wedding',
  eventType: 'wedding',
  budget: 1500000,
  guestCount: 350,
  eventDate: '2027-01-15',
  priorities: 'Hospitality & Royal Decor',
  budgetBreakdown: {
    totalBudget: 1500000,
    contingency: 75000,
    categories: [
      { name: 'Venue & Logistics', allocatedAmount: 500000, actualSpent: 450000 },
      { name: 'Food & Catering', allocatedAmount: 600000, actualSpent: 200000 },
    ],
  },
  timeline: {
    phases: [
      {
        phaseName: 'Foundation & Booking',
        tasks: [
          { id: 't-1', title: 'Confirm Royal Palace Lawn', completed: true },
          { id: 't-2', title: 'Select Luxury Caterer', completed: false },
        ],
      },
    ],
  },
  ideas: { themes: [] },
  vendorChecklist: { categories: [] },
};

describe('DashboardPage Component', () => {
  it('renders event overview hero and metadata', () => {
    render(
      <MemoryRouter>
        <DashboardPage event={mockEvent} showToast={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText('Aarav & Meera Royal Wedding')).toBeInTheDocument();
    expect(screen.getAllByText(/Hospitality & Royal Decor/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Plan Readiness')).toBeInTheDocument();
    expect(screen.getByText('Contextual AI Decision Rationale')).toBeInTheDocument();
  });

  it('renders quick action navigation cards', () => {
    render(
      <MemoryRouter>
        <DashboardPage event={mockEvent} showToast={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText('Task Timeline')).toBeInTheDocument();
    expect(screen.getByText('Vendor Coordination')).toBeInTheDocument();
    expect(screen.getByText('Personalized Ideas')).toBeInTheDocument();
    expect(screen.getByText('Chat with AI Assistant')).toBeInTheDocument();
  });

  it('opens and closes AI Adaptive Replanner modal', () => {
    render(
      <MemoryRouter>
        <DashboardPage event={mockEvent} showToast={vi.fn()} />
      </MemoryRouter>
    );

    const openBtn = screen.getByRole('button', { name: /ai adaptive replanner/i });
    fireEvent.click(openBtn);

    expect(screen.getByRole('dialog', { name: /ai adaptive replanner/i })).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /close modal/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole('dialog', { name: /ai adaptive replanner/i })).not.toBeInTheDocument();
  });
});
