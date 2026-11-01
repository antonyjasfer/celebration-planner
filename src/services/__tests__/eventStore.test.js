import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadEvents,
  getActiveEventId,
  setActiveEventId,
  getActiveEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  toggleTask,
  addChatMessage,
  subscribe,
  formatCurrency,
  formatDate,
  daysUntil,
} from '../eventStore';

describe('Event Store Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('loadEvents', () => {
    it('returns empty array when nothing is stored', () => {
      expect(loadEvents()).toEqual([]);
    });

    it('returns parsed events when valid JSON is in localStorage', () => {
      const mockEvents = [{ id: 'evt_1', eventName: 'Anil & Priya Wedding' }];
      localStorage.setItem('celebriplan_events', JSON.stringify(mockEvents));
      expect(loadEvents()).toEqual(mockEvents);
    });

    it('returns empty array gracefully on corrupted JSON in localStorage', () => {
      localStorage.setItem('celebriplan_events', 'invalid-json{{{');
      expect(loadEvents()).toEqual([]);
    });
  });

  describe('createEvent', () => {
    it('creates an event with default fallback values', () => {
      const evt = createEvent({});
      expect(evt.id).toMatch(/^evt_/);
      expect(evt.eventName).toBe('My Event');
      expect(evt.eventType).toBe('other');
      expect(evt.budget).toBe(0);
      expect(evt.guestCount).toBe(0);
      expect(evt.completedTasks).toEqual([]);
      expect(evt.chatHistory).toEqual([]);
      expect(evt.changeLog).toEqual([]);
      expect(getActiveEventId()).toBe(evt.id);
    });

    it('creates an event with user parameters and sanitizes them', () => {
      const params = {
        eventName: '<script>Royal Wedding</script>',
        eventType: 'wedding',
        budget: '500000',
        guestCount: 200,
        eventDate: '2026-12-15',
        priorities: 'Decor & Food',
        preferences: 'Elegant traditional',
        culturalContext: 'South Indian',
        additionalNotes: 'Need outdoor mandap',
      };
      const evt = createEvent(params);
      expect(evt.eventName).toBe('&lt;script&gt;Royal Wedding&lt;/script&gt;');
      expect(evt.eventType).toBe('wedding');
      expect(evt.budget).toBe(500000);
      expect(evt.guestCount).toBe(200);
      expect(evt.eventDate).toBe('2026-12-15');
      expect(evt.priorities).toBe('Decor &amp; Food');
      expect(evt.preferences).toBe('Elegant traditional');
      expect(evt.culturalContext).toBe('South Indian');
      expect(evt.additionalNotes).toBe('Need outdoor mandap');
    });

    it('persists newly created event in localStorage', () => {
      const evt = createEvent({ eventName: 'Rohan 30th Birthday' });
      const stored = loadEvents();
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe(evt.id);
    });
  });

  describe('getActiveEvent & getActiveEventId', () => {
    it('returns null when no active event is selected', () => {
      expect(getActiveEventId()).toBeNull();
      expect(getActiveEvent()).toBeNull();
    });

    it('returns null if active ID does not match any existing event', () => {
      setActiveEventId('non-existent-id');
      expect(getActiveEvent()).toBeNull();
    });

    it('returns the active event object matching active ID', () => {
      const evt1 = createEvent({ eventName: 'Event 1' });
      const evt2 = createEvent({ eventName: 'Event 2' });
      expect(getActiveEvent().id).toBe(evt2.id);

      setActiveEventId(evt1.id);
      expect(getActiveEvent().id).toBe(evt1.id);
      expect(getActiveEvent().eventName).toBe('Event 1');
    });
  });

  describe('updateEvent', () => {
    it('updates properties and timestamps', () => {
      const evt = createEvent({ eventName: 'Original Title' });
      const updated = updateEvent(evt.id, { eventName: 'Updated Title' });
      expect(updated.eventName).toBe('Updated Title');
      expect(updated.updatedAt).toBeDefined();

      const reloaded = getActiveEvent();
      expect(reloaded.eventName).toBe('Updated Title');
    });

    it('tracks significant field changes in changeLog', () => {
      const evt = createEvent({ budget: 300000, guestCount: 150 });
      const updated = updateEvent(evt.id, { budget: 400000, guestCount: 180 });

      expect(updated.changeLog).toHaveLength(2);
      expect(updated.changeLog[0].field).toBe('budget');
      expect(updated.changeLog[0].oldValue).toBe(300000);
      expect(updated.changeLog[0].newValue).toBe(400000);
      expect(updated.changeLog[1].field).toBe('guestCount');
      expect(updated.changeLog[1].oldValue).toBe(150);
      expect(updated.changeLog[1].newValue).toBe(180);
    });

    it('returns null when updating non-existent event', () => {
      const res = updateEvent('non-existent-id', { eventName: 'Failed' });
      expect(res).toBeNull();
    });
  });

  describe('deleteEvent', () => {
    it('removes the event from storage', () => {
      const evt1 = createEvent({ eventName: 'Event 1' });
      const evt2 = createEvent({ eventName: 'Event 2' });
      expect(loadEvents()).toHaveLength(2);

      deleteEvent(evt1.id);
      const remaining = loadEvents();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(evt2.id);
    });

    it('reassigns active event when deleting current active event', () => {
      const evt1 = createEvent({ eventName: 'Event 1' });
      const evt2 = createEvent({ eventName: 'Event 2' });
      setActiveEventId(evt2.id);

      deleteEvent(evt2.id);
      expect(getActiveEventId()).toBe(evt1.id);
    });

    it('clears active event ID when deleting the only existing event', () => {
      const evt = createEvent({ eventName: 'Solo Event' });
      deleteEvent(evt.id);
      expect(getActiveEventId()).toBeNull();
      expect(getActiveEvent()).toBeNull();
    });
  });

  describe('toggleTask', () => {
    it('adds task ID to completedTasks when not present', () => {
      const evt = createEvent({ eventName: 'Task Test' });
      toggleTask(evt.id, 'task-101');

      const reloaded = getActiveEvent();
      expect(reloaded.completedTasks).toContain('task-101');
    });

    it('removes task ID from completedTasks when already present', () => {
      const evt = createEvent({ eventName: 'Task Test' });
      toggleTask(evt.id, 'task-101');
      toggleTask(evt.id, 'task-101');

      const reloaded = getActiveEvent();
      expect(reloaded.completedTasks).not.toContain('task-101');
    });

    it('returns null for non-existent event', () => {
      expect(toggleTask('ghost_id', 'task-1')).toBeNull();
    });
  });

  describe('addChatMessage', () => {
    it('appends message with timestamp to event chat history', () => {
      const evt = createEvent({ eventName: 'Chat Test' });
      addChatMessage(evt.id, 'user', 'Can we add a chaat stall?');
      addChatMessage(evt.id, 'assistant', 'Yes, a live chaat stall fits well!');

      const reloaded = getActiveEvent();
      expect(reloaded.chatHistory).toHaveLength(2);
      expect(reloaded.chatHistory[0].role).toBe('user');
      expect(reloaded.chatHistory[0].content).toBe('Can we add a chaat stall?');
      expect(reloaded.chatHistory[1].role).toBe('assistant');
      expect(reloaded.chatHistory[1].timestamp).toBeDefined();
    });

    it('safely ignores adding chat message to non-existent event', () => {
      expect(() => addChatMessage('ghost_id', 'user', 'Hello')).not.toThrow();
    });
  });

  describe('subscribe', () => {
    it('calls listener when event store changes', () => {
      const listener = vi.fn();
      const unsubscribe = subscribe(listener);

      createEvent({ eventName: 'Trigger Sub' });
      expect(listener).toHaveBeenCalled();
      const callsBeforeUnsubscribe = listener.mock.calls.length;

      unsubscribe();
      createEvent({ eventName: 'Trigger Sub 2' });
      expect(listener).toHaveBeenCalledTimes(callsBeforeUnsubscribe);
    });
  });

  describe('formatCurrency', () => {
    it('formats amounts in Indian Rupees (INR)', () => {
      const formatted = formatCurrency(250000);
      expect(formatted).toMatch(/2,50,000/);
    });

    it('formats 0 and handles null/undefined gracefully', () => {
      expect(formatCurrency(0)).toMatch(/0/);
      expect(formatCurrency(null)).toBe('₹0');
      expect(formatCurrency(undefined)).toBe('₹0');
    });
  });

  describe('formatDate', () => {
    it('formats ISO date strings nicely in Indian English locale', () => {
      const formatted = formatDate('2026-11-15T00:00:00.000Z');
      expect(formatted).toMatch(/Nov/);
      expect(formatted).toMatch(/2026/);
    });

    it('returns fallback string for empty or falsy dates', () => {
      expect(formatDate('')).toBe('Not set');
      expect(formatDate(null)).toBe('Not set');
    });
  });

  describe('daysUntil', () => {
    it('returns 0 for empty or falsy date input', () => {
      expect(daysUntil('')).toBe(0);
      expect(daysUntil(null)).toBe(0);
    });

    it('calculates remaining days accurately for future dates', () => {
      const future = new Date(Date.now() + 10 * 86400000).toISOString();
      const days = daysUntil(future);
      expect(days).toBeGreaterThanOrEqual(9);
      expect(days).toBeLessThanOrEqual(11);
    });

    it('returns 0 for past dates', () => {
      const past = new Date(Date.now() - 5 * 86400000).toISOString();
      expect(daysUntil(past)).toBe(0);
    });
  });
});
