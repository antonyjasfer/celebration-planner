import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IdeasPage from '../IdeasPage';

const mockEvent = {
  id: 'test-evt-4',
  eventName: 'Modern Sangeet Night',
  eventType: 'wedding',
  preferences: 'Bohemian Garden Sunset',
  ideas: {
    themes: [
      {
        name: 'Pastel Bohemian Garden Soiree',
        description: 'Blush pink, ivory, and eucalyptus with fairy light canopies.',
        suitability: 'Perfect for contemporary couples wanting an intimate celebration.',
        estimatedCost: 120000,
        elements: {
          decoration: ['Eucalyptus and white carnation installations'],
          food: ['Live artisanal pasta counter'],
          activities: ['Polaroid guestbook wall'],
          music: ['Indie acoustic pop covers'],
        },
        pros: ['Deeply photogenic for social media'],
        cons: ['Requires weather-proof shaded area'],
      },
    ],
    foodSuggestions: [
      {
        type: 'Artisanal Grazing Station',
        items: ['Gourmet sliders', 'Mezze platters'],
        estimatedCostPerPerson: 850,
        dietaryOptions: ['Vegetarian', 'Vegan'],
      },
    ],
    personalTouches: ['Customized digital QR code for guest photo sharing'],
    budgetFriendlyAlternatives: ['Use seasonal marigolds with fairy lights instead of imported orchids'],
  },
};

describe('IdeasPage Component', () => {
  it('renders theme showcase hero with active AI recommendation', () => {
    render(<IdeasPage event={mockEvent} showToast={vi.fn()} />);

    expect(screen.getByText('Personalized Ideas & Themes')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pastel Bohemian Garden Soiree' })).toBeInTheDocument();
    expect(screen.getByText(/Blush pink, ivory, and eucalyptus/i)).toBeInTheDocument();
  });

  it('renders 4 pillars of the concept (decor, food, activities, music)', () => {
    render(<IdeasPage event={mockEvent} showToast={vi.fn()} />);

    expect(screen.getByText('Decor & Floral Styling')).toBeInTheDocument();
    expect(screen.getByText('Menu & Culinary Concepts')).toBeInTheDocument();
    expect(screen.getByText('Guest Activities & Keepsakes')).toBeInTheDocument();
    expect(screen.getByText('Music & Entertainment')).toBeInTheDocument();
  });

  it('renders food recommendations and personal touches', () => {
    render(<IdeasPage event={mockEvent} showToast={vi.fn()} />);

    expect(screen.getByText('Artisanal Grazing Station')).toBeInTheDocument();
    expect(screen.getByText('Memorable Personal Touches')).toBeInTheDocument();
    expect(screen.getByText('Budget-Friendly Alternatives')).toBeInTheDocument();
  });

  it('opens and closes tailor vibe modal', () => {
    render(<IdeasPage event={mockEvent} showToast={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /tailor atmosphere & vibe/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Tailor Theme & Atmosphere')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
