import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VendorsPage from '../VendorsPage';

const mockEvent = {
  id: 'test-evt-3',
  eventName: 'Diwali Community Celebration',
  eventType: 'community',
  shortlistedVendors: [
    {
      id: 'vq-1',
      name: 'Royal Sound & Lights',
      category: 'Sound, DJ & Entertainment',
      quote: 45000,
      phone: '+91 98765 43210',
      status: 'Shortlisted',
      notes: 'Includes wireless mics',
    },
  ],
  vendorChecklist: {
    vendors: [
      {
        category: 'Sound, DJ & Entertainment',
        budgetRange: { min: 30000, max: 50000 },
        priority: 'essential',
        bookingTimeline: '1 month prior',
        questionsToAsk: ['Do you have backup microphones?'],
        redFlags: ['No backup equipment on site'],
        tips: ['Bundle lights and audio for discount'],
      },
    ],
    negotiationTips: ['Ask for complimentary extras instead of cash discounts'],
    contractChecklist: ['Verify force majeure clause'],
  },
};

describe('VendorsPage Component', () => {
  it('renders vendor guides and tabs', () => {
    render(<VendorsPage event={mockEvent} showToast={vi.fn()} />);

    expect(screen.getByText('Vendor Coordination & Comparison')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /category guides/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /quotation comparator/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /negotiation & contract/i })).toBeInTheDocument();
  });

  it('displays category questions and red flags in category guides tab', () => {
    render(<VendorsPage event={mockEvent} showToast={vi.fn()} />);

    expect(screen.getByText('Sound, DJ & Entertainment')).toBeInTheDocument();
    expect(screen.getByText('Do you have backup microphones?')).toBeInTheDocument();
    expect(screen.getByText('No backup equipment on site')).toBeInTheDocument();
  });

  it('switches to comparator tab and displays shortlisted quotes', () => {
    render(<VendorsPage event={mockEvent} showToast={vi.fn()} />);

    fireEvent.click(screen.getByRole('tab', { name: /quotation comparator/i }));
    expect(screen.getByText('Royal Sound & Lights')).toBeInTheDocument();
    expect(screen.getByText(/within ai budget benchmark/i)).toBeInTheDocument();
  });

  it('switches to negotiation and contract tab', () => {
    render(<VendorsPage event={mockEvent} showToast={vi.fn()} />);

    fireEvent.click(screen.getByRole('tab', { name: /negotiation & contract shield/i }));
    expect(screen.getByText('Indian Event Negotiation Tactics')).toBeInTheDocument();
    expect(screen.getByText(/Ask for complimentary extras/i)).toBeInTheDocument();
    expect(screen.getByText('Contract & Advance Payment Checklist')).toBeInTheDocument();
  });
});
