import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getApiKey,
  isApiKeyConfigured,
  sendMessage,
  generateBudgetBreakdown,
  generateTimeline,
  generateVendorChecklist,
  generatePersonalizedIdeas,
  analyzeChangeImpact,
  chat,
  extractJSON,
} from '../gemini';

describe('Gemini AI Service & Resilient Engines', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    delete window.__GEMINI_API_KEY__;
    vi.restoreAllMocks();
  });

  describe('API Key Management', () => {
    it('returns null when no key is configured', () => {
      expect(getApiKey()).toBeNull();
      expect(isApiKeyConfigured()).toBe(false);
    });

    it('returns key from localStorage when stored', () => {
      localStorage.setItem('gemini_api_key', 'AIzaSyFakeKeyFromLocalStorage123');
      expect(getApiKey()).toBe('AIzaSyFakeKeyFromLocalStorage123');
      expect(isApiKeyConfigured()).toBe(true);
    });

    it('returns key from sessionStorage when stored', () => {
      sessionStorage.setItem('gemini_api_key', 'AIzaSyFakeKeyFromSessionStorage456');
      expect(getApiKey()).toBe('AIzaSyFakeKeyFromSessionStorage456');
      expect(isApiKeyConfigured()).toBe(true);
    });

    it('returns key from window.__GEMINI_API_KEY__ when attached', () => {
      window.__GEMINI_API_KEY__ = 'AIzaSyFakeKeyFromWindow789';
      expect(getApiKey()).toBe('AIzaSyFakeKeyFromWindow789');
      expect(isApiKeyConfigured()).toBe(true);
    });

    it('treats placeholder string "your_gemini_api_key_here" as not configured', () => {
      localStorage.setItem('gemini_api_key', 'your_gemini_api_key_here');
      expect(getApiKey()).toBeNull();
      expect(isApiKeyConfigured()).toBe(false);
    });
  });

  describe('generateBudgetBreakdown', () => {
    it('generates a detailed wedding budget structure matching total amount', async () => {
      const result = await generateBudgetBreakdown({
        eventType: 'wedding',
        budget: 1000000,
        guestCount: 250,
        priorities: 'Venue & Food',
      });

      expect(result).toBeDefined();
      expect(result.totalBudget).toBe(1000000);
      expect(result.contingency).toBe(50000); // 5% contingency
      expect(Array.isArray(result.categories)).toBe(true);
      expect(result.categories.length).toBeGreaterThanOrEqual(4);

      // Verify category items have required schema
      const venue = result.categories.find(c => c.name.includes('Venue'));
      expect(venue).toBeDefined();
      expect(venue.allocated).toBeGreaterThan(0);
      expect(Array.isArray(venue.breakdown)).toBe(true);
      expect(Array.isArray(venue.savingTips)).toBe(true);

      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('generates a birthday budget structure with cake, decor and entertainment', async () => {
      const result = await generateBudgetBreakdown({
        eventType: 'birthday',
        budget: 50000,
        guestCount: 30,
        priorities: 'Cake & Decor',
      });

      expect(result.totalBudget).toBe(50000);
      const foodCat = result.categories.find(c => c.name.includes('Food'));
      expect(foodCat).toBeDefined();
      expect(foodCat.percentage).toBe(35);
    });

    it('generates a community event budget breakdown', async () => {
      const result = await generateBudgetBreakdown({
        eventType: 'community',
        budget: 150000,
        guestCount: 500,
        priorities: 'Meals & Sound',
      });

      expect(result.totalBudget).toBe(150000);
      const commFood = result.categories.find(c => c.name.includes('Community Refreshments'));
      expect(commFood).toBeDefined();
    });
  });

  describe('generateTimeline', () => {
    it('creates chronological phases and actionable tasks for an event', async () => {
      const targetDate = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];
      const result = await generateTimeline({
        eventType: 'wedding',
        eventDate: targetDate,
        budget: 800000,
        guestCount: 150,
      });

      expect(result).toBeDefined();
      expect(result.eventDate).toBe(targetDate);
      expect(result.totalDaysRemaining).toBeGreaterThanOrEqual(89);
      expect(Array.isArray(result.phases)).toBe(true);
      expect(result.phases.length).toBe(4);

      // Verify tasks in Phase 1
      const phase1 = result.phases[0];
      expect(phase1.tasks.length).toBeGreaterThan(0);
      const task = phase1.tasks[0];
      expect(task.id).toBeDefined();
      expect(task.title).toBeDefined();
      expect(task.priority).toBeDefined();
      expect(task.category).toBeDefined();
      expect(Array.isArray(result.milestones)).toBe(true);
      expect(Array.isArray(result.urgentActions)).toBe(true);
    });
  });

  describe('generateVendorChecklist', () => {
    it('generates comparison criteria, red flags, and interview questions', async () => {
      const result = await generateVendorChecklist({
        eventType: 'wedding',
        budget: 600000,
        guestCount: 150,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result.vendors)).toBe(true);
      expect(result.vendors.length).toBeGreaterThanOrEqual(4);

      const caterer = result.vendors.find(v => v.category.includes('Catering'));
      expect(caterer).toBeDefined();
      expect(caterer.budgetRange.min).toBeGreaterThan(0);
      expect(caterer.budgetRange.max).toBeGreaterThan(caterer.budgetRange.min);
      expect(caterer.questionsToAsk.length).toBeGreaterThan(0);
      expect(caterer.redFlags.length).toBeGreaterThan(0);
      expect(caterer.comparisonCriteria.length).toBeGreaterThan(0);

      expect(Array.isArray(result.generalTips)).toBe(true);
      expect(Array.isArray(result.negotiationTips)).toBe(true);
      expect(Array.isArray(result.contractChecklist)).toBe(true);
    });
  });

  describe('generatePersonalizedIdeas', () => {
    it('generates multi-pillar theme concepts for weddings', async () => {
      const result = await generatePersonalizedIdeas({
        eventType: 'wedding',
        budget: 500000,
        guestCount: 120,
        preferences: 'Royal and traditional',
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result.themes)).toBe(true);
      expect(result.themes.length).toBeGreaterThanOrEqual(2);

      const royalTheme = result.themes[0];
      expect(royalTheme.name).toBeDefined();
      expect(royalTheme.elements.decoration).toBeDefined();
      expect(royalTheme.elements.food).toBeDefined();
      expect(royalTheme.elements.activities).toBeDefined();
      expect(royalTheme.elements.music).toBeDefined();
      expect(royalTheme.pros.length).toBeGreaterThan(0);

      expect(Array.isArray(result.foodSuggestions)).toBe(true);
      expect(Array.isArray(result.entertainmentIdeas)).toBe(true);
      expect(Array.isArray(result.personalTouches)).toBe(true);
      expect(Array.isArray(result.budgetFriendlyAlternatives)).toBe(true);
    });

    it('generates vibrant themes for birthday celebrations', async () => {
      const result = await generatePersonalizedIdeas({
        eventType: 'birthday',
        budget: 80000,
        guestCount: 40,
      });

      expect(result.themes.length).toBeGreaterThanOrEqual(1);
      const themeNames = result.themes.map(t => t.name).join(' ');
      expect(themeNames).toMatch(/Neon|Enchanted/);
    });
  });

  describe('analyzeChangeImpact (Adaptive Replanner)', () => {
    it('analyzes budget cuts and generates tradeoffs and reallocation', async () => {
      const currentPlan = {
        budget: 500000,
        guestCount: 150,
      };

      const result = await analyzeChangeImpact({
        currentPlan,
        changeType: 'budget',
        changeDescription: 'Need to cut budget by 20% due to unexpected expenses',
      });

      expect(result).toBeDefined();
      expect(result.impactSummary).toBeDefined();
      expect(Array.isArray(result.affectedAreas)).toBe(true);
      expect(result.revisedBudget.revised).toBeLessThan(500000);
      expect(Array.isArray(result.tradeoffs)).toBe(true);
      expect(result.tradeoffs[0].savings).toBeGreaterThan(0);
      expect(Array.isArray(result.nextSteps)).toBe(true);
    });
  });

  describe('sendMessage & chat', () => {
    it('provides specialized answers for budget-related user questions', async () => {
      const reply = await sendMessage('How can I save money on my wedding decor?', {
        eventName: 'Pooja & Arun Wedding',
        budget: 600000,
        eventType: 'wedding',
      });

      expect(reply).toContain('Smart Budget Strategy');
      expect(reply).toContain('Pooja & Arun Wedding');
      expect(reply).toMatch(/6,00,000|600,000/);
    });

    it('provides specialized answers for food and catering questions', async () => {
      const reply = await sendMessage('What food items should we include in the menu?', {
        eventName: 'Ananya 18th Birthday',
        guestCount: 80,
      });

      expect(reply).toContain('Menu Curation');
      expect(reply).toContain('Ananya 18th Birthday');
      expect(reply).toContain('80');
    });

    it('provides specialized answers for vendor contract questions', async () => {
      const reply = await sendMessage('What should I ask the photographer before signing the contract?');
      expect(reply).toContain('Top Vendor Questions');
      expect(reply).toContain('Payment Milestones');
    });

    it('provides structured multi-turn conversation replies via chat()', async () => {
      const messages = [
        { role: 'user', content: 'Hi, what can you help me with?' },
        { role: 'assistant', content: 'I can help with budgets, timelines, and vendors.' },
        { role: 'user', content: 'Tell me about catering options.' },
      ];

      const reply = await chat(messages, { eventName: 'Family Get Together' });
      expect(reply).toBeDefined();
      expect(typeof reply).toBe('string');
      expect(reply).toContain('Menu Curation');
    });
  });

  describe('extractJSON Helper', () => {
    it('extracts valid JSON from markdown code block', () => {
      const markdown = 'Here is the response:\n```json\n{"totalBudget": 500000, "status": "approved"}\n```';
      const parsed = extractJSON(markdown);
      expect(parsed).toEqual({ totalBudget: 500000, status: 'approved' });
    });

    it('extracts valid JSON from raw JSON string', () => {
      const raw = '{"key": "value", "count": 42}';
      expect(extractJSON(raw)).toEqual({ key: 'value', count: 42 });
    });

    it('extracts JSON using relaxed brace boundaries when surrounded by text', () => {
      const messy = 'Some preamble before JSON: {"message": "hello", "success": true} and trailing text after';
      expect(extractJSON(messy)).toEqual({ message: 'hello', success: true });
    });

    it('extracts JSON array when formatted as an array', () => {
      const arrayText = '```json\n["item1", "item2", "item3"]\n```';
      expect(extractJSON(arrayText)).toEqual(['item1', 'item2', 'item3']);
    });

    it('throws error when input is empty, null, or not valid JSON', () => {
      expect(() => extractJSON('')).toThrow('Input must be a non-empty string');
      expect(() => extractJSON(null)).toThrow('Input must be a non-empty string');
      expect(() => extractJSON('non json text with no braces')).toThrow();
    });
  });
});

