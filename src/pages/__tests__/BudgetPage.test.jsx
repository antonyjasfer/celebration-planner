import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BudgetPage from '../BudgetPage';

const mockEvent = {
  id: 'test-evt-1',
  eventName: 'Rohit & Neha Wedding',
  eventType: 'wedding',
  budget: 1000000,
  guestCount: 200,
  budgetBreakdown: {
    totalBudget: 1000000,
    contingency: 50000,
    categories: [
      {
        name: 'Catering & Beverages',
        allocated: 300000,
        percentage: 30,
        priority: 'high',
        breakdown: [
          { item: 'Wedding Reception Dinner', estimated: 250000, notes: 'Full buffet' },
        ],
        savingTips: ['Choose seasonal fruits for desserts'],
      },
      {
        name: 'Venue & Banquet Hall',
        allocated: 350000,
        percentage: 35,
        priority: 'high',
        breakdown: [
          { item: 'Lawn Booking', estimated: 350000, notes: '2 days' },
        ],
        savingTips: [],
      },
    ],
    warnings: ['Peak season surcharges may apply'],
    suggestions: ['Prioritize catering for wedding impression'],
  },
};

describe('BudgetPage Component', () => {
  it('renders budget stats cards with formatted currency', () => {
    render(<BudgetPage event={mockEvent} showToast={vi.fn()} />);

    expect(screen.getByText('Smart Budget Allocation')).toBeInTheDocument();
    expect(screen.getByText('Total Planned Budget')).toBeInTheDocument();
    expect(screen.getByText('Contingency Reserve')).toBeInTheDocument();
    expect(screen.getByText('Cost Per Guest')).toBeInTheDocument();
  });

  it('renders category accordions and allows expanding them', () => {
    render(<BudgetPage event={mockEvent} showToast={vi.fn()} />);

    expect(screen.getByText('Catering & Beverages')).toBeInTheDocument();
    expect(screen.getByText('Venue & Banquet Hall')).toBeInTheDocument();

    // Click to expand Catering category
    fireEvent.click(screen.getByText('Catering & Beverages'));

    expect(screen.getByText('Wedding Reception Dinner')).toBeInTheDocument();
    expect(screen.getByText('Add Line Item')).toBeInTheDocument();
  });

  it('renders the AI Tradeoff Simulator and slider', () => {
    render(<BudgetPage event={mockEvent} showToast={vi.fn()} />);

    expect(screen.getByText('AI Tradeoff & Cut Simulator')).toBeInTheDocument();
    const slider = screen.getByLabelText(/target budget amount in rupees/i);
    expect(slider).toBeInTheDocument();
  });

  it('opens and closes add line item modal', () => {
    render(<BudgetPage event={mockEvent} showToast={vi.fn()} />);

    // Expand category
    fireEvent.click(screen.getByText('Catering & Beverages'));
    fireEvent.click(screen.getByRole('button', { name: /add line item/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/add item to catering & beverages/i)).toBeInTheDocument();

    // Close modal via Cancel button
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
