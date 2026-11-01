import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';

describe('Navbar Component', () => {
  it('renders branding with CelebriPlan logo and AI badge', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Navbar activeEvent={null} onApiKeyClick={() => {}} />
      </MemoryRouter>
    );

    expect(screen.getByText('CelebriPlan')).toBeInTheDocument();
    expect(screen.getByText('AI')).toBeInTheDocument();
  });

  it('hides planning navigation links on landing page even if active event exists', () => {
    const activeEvent = { id: 'evt_1', eventName: 'Wedding' };
    render(
      <MemoryRouter initialEntries={['/']}>
        <Navbar activeEvent={activeEvent} onApiKeyClick={() => {}} />
      </MemoryRouter>
    );

    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Budget')).not.toBeInTheDocument();
  });

  it('shows planning navigation links on non-landing pages when active event exists', () => {
    const activeEvent = { id: 'evt_1', eventName: 'Wedding' };
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Navbar activeEvent={activeEvent} onApiKeyClick={() => {}} />
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Budget')).toBeInTheDocument();
    expect(screen.getByText('Timeline')).toBeInTheDocument();
    expect(screen.getByText('Vendors')).toBeInTheDocument();
    expect(screen.getByText('Ideas')).toBeInTheDocument();
    expect(screen.getByText('AI Chat')).toBeInTheDocument();
  });

  it('calls onApiKeyClick when settings button is pressed', () => {
    const handleApiKeyClick = vi.fn();
    render(
      <MemoryRouter initialEntries={['/']}>
        <Navbar activeEvent={null} onApiKeyClick={handleApiKeyClick} />
      </MemoryRouter>
    );

    const settingsBtn = screen.getByRole('button', { name: /api key settings/i });
    fireEvent.click(settingsBtn);
    expect(handleApiKeyClick).toHaveBeenCalledTimes(1);
  });

  it('marks active navigation link with aria-current="page"', () => {
    const activeEvent = { id: 'evt_1', eventName: 'Wedding' };
    render(
      <MemoryRouter initialEntries={['/budget']}>
        <Navbar activeEvent={activeEvent} onApiKeyClick={() => {}} />
      </MemoryRouter>
    );

    const budgetLink = screen.getByRole('link', { name: /budget/i });
    expect(budgetLink).toHaveAttribute('aria-current', 'page');
  });
});

