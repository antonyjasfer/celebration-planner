import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TimelinePage from '../TimelinePage';

const mockEvent = {
  id: 'test-evt-2',
  eventName: 'Ananya 18th Birthday',
  eventType: 'birthday',
  eventDate: '2026-11-20',
  completedTasks: ['task-1'],
  timeline: {
    eventDate: '2026-11-20',
    totalDaysRemaining: 45,
    phases: [
      {
        name: 'Phase 1: Foundation & Theme',
        startDate: '2026-10-01',
        endDate: '2026-10-15',
        status: 'completed',
        tasks: [
          {
            id: 'task-1',
            title: 'Finalize Guest List',
            description: 'Count close friends and family',
            deadline: '2026-10-10',
            priority: 'critical',
            category: 'guest',
            dependsOn: [],
            estimatedCost: 0,
            completed: true,
          },
          {
            id: 'task-2',
            title: 'Book Rooftop Cafe',
            description: 'Confirm venue deposit',
            deadline: '2026-10-15',
            priority: 'high',
            category: 'venue',
            dependsOn: ['task-1'],
            estimatedCost: 25000,
            completed: false,
          },
        ],
      },
    ],
    milestones: [
      { title: 'Venue Secured', date: '2026-10-15', description: 'Deposit paid' },
    ],
    urgentActions: ['Send invitations to close friends'],
  },
};

describe('TimelinePage Component', () => {
  it('renders overview card and milestone roadmap', () => {
    render(<TimelinePage event={mockEvent} showToast={vi.fn()} />);

    expect(screen.getByText('Event Roadmap & Timeline')).toBeInTheDocument();
    expect(screen.getByText('Tasks Finished')).toBeInTheDocument();
    expect(screen.getByText('Major Milestones')).toBeInTheDocument();
    expect(screen.getByText('Venue Secured')).toBeInTheDocument();
  });

  it('filters tasks by completion status', () => {
    render(<TimelinePage event={mockEvent} showToast={vi.fn()} />);

    expect(screen.getByText('Finalize Guest List')).toBeInTheDocument();
    expect(screen.getByText('Book Rooftop Cafe')).toBeInTheDocument();

    // Click Pending filter
    fireEvent.click(screen.getByRole('button', { name: 'Pending' }));
    expect(screen.queryByText('Finalize Guest List')).not.toBeInTheDocument();
    expect(screen.getByText('Book Rooftop Cafe')).toBeInTheDocument();

    // Click Completed filter
    fireEvent.click(screen.getByRole('button', { name: 'Completed' }));
    expect(screen.getByText('Finalize Guest List')).toBeInTheDocument();
    expect(screen.queryByText('Book Rooftop Cafe')).not.toBeInTheDocument();
  });

  it('opens and closes custom milestone task modal', () => {
    render(<TimelinePage event={mockEvent} showToast={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /add custom task/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Create Custom Milestone Task')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
