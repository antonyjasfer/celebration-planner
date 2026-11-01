import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import OnboardingPage from '../OnboardingPage';

describe('OnboardingPage Wizard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const renderComponent = (showToast = vi.fn()) => {
    return render(
      <BrowserRouter>
        <OnboardingPage showToast={showToast} />
      </BrowserRouter>
    );
  };

  it('renders initial step with 4 celebration event types', () => {
    renderComponent();
    expect(screen.getByText('What are you celebrating?')).toBeInTheDocument();
    expect(screen.getByText('Wedding')).toBeInTheDocument();
    expect(screen.getByText('Birthday')).toBeInTheDocument();
    expect(screen.getByText('Community Event')).toBeInTheDocument();
    expect(screen.getByText('Other Celebration')).toBeInTheDocument();
  });

  it('advances through step 1, step 2, step 3 and creates plan', () => {
    const showToast = vi.fn();
    renderComponent(showToast);

    // Step 1: Select Wedding
    fireEvent.click(screen.getByText('Wedding'));
    const nextBtn = screen.getByRole('button', { name: /next/i });
    expect(nextBtn).not.toBeDisabled();
    fireEvent.click(nextBtn);

    // Step 2: Fill basics
    expect(screen.getByText('Tell us the basics')).toBeInTheDocument();
    const nameInput = screen.getByLabelText(/event name/i);
    const budgetInput = screen.getByLabelText(/total budget/i);
    const guestInput = screen.getByLabelText(/expected guests/i);

    fireEvent.change(nameInput, { target: { value: 'Aarav and Meera Wedding' } });
    fireEvent.change(budgetInput, { target: { value: '1500000' } });
    fireEvent.change(guestInput, { target: { value: '300' } });

    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // Step 3: Date
    expect(screen.getByText("When's the big day?")).toBeInTheDocument();
    const dateInput = screen.getByLabelText(/event date/i);
    fireEvent.change(dateInput, { target: { value: '2026-12-25' } });

    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // Step 4: Priorities
    expect(screen.getByText('What matters most to you?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Food & Catering'));

    const createBtn = screen.getByRole('button', { name: /create my plan/i });
    expect(createBtn).toBeInTheDocument();
    fireEvent.click(createBtn);

    expect(showToast).toHaveBeenCalledWith(
      expect.stringContaining('Aarav and Meera Wedding'),
      'success'
    );
  });
});
