import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatPage from '../ChatPage';

const mockEvent = {
  id: 'test-evt-5',
  eventName: 'Grand Silver Anniversary',
  eventType: 'other',
  budget: 500000,
  guestCount: 150,
  eventDate: '2026-12-30',
  priorities: 'Food and Music',
  chatHistory: [
    {
      role: 'user',
      content: 'Can you recommend live food counters?',
      timestamp: '2026-10-01T10:00:00.000Z',
    },
    {
      role: 'assistant',
      content: 'Live Chaat and piping hot Jalebi Rabri are popular crowd-pleasers!',
      timestamp: '2026-10-01T10:00:05.000Z',
    },
  ],
};

describe('ChatPage Component', () => {
  it('renders chat header and conversation messages', () => {
    render(<ChatPage event={mockEvent} showToast={vi.fn()} />);

    expect(screen.getByText('CelebriPlan AI Assistant')).toBeInTheDocument();
    expect(screen.getByText('Can you recommend live food counters?')).toBeInTheDocument();
    expect(screen.getByText(/Live Chaat and piping hot Jalebi Rabri/i)).toBeInTheDocument();
  });

  it('renders quick prompt idea chips', () => {
    render(<ChatPage event={mockEvent} showToast={vi.fn()} />);

    expect(screen.getByText(/How can I reduce catering costs/i)).toBeInTheDocument();
    expect(screen.getByText(/What non-negotiable questions should I ask/i)).toBeInTheDocument();
  });

  it('allows user to type into textarea and enables send button', () => {
    render(<ChatPage event={mockEvent} showToast={vi.fn()} />);

    const textarea = screen.getByPlaceholderText(/Ask CelebriPlan AI anything/i);
    const sendBtn = screen.getByRole('button', { name: /send message/i });

    expect(sendBtn).toBeDisabled();
    fireEvent.change(textarea, { target: { value: 'How many servers do I need?' } });
    expect(sendBtn).not.toBeDisabled();
  });
});
