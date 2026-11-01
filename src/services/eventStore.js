/**
 * Event Store — Client-Side Reactive State Management
 *
 * Implements a lightweight pub/sub store with localStorage persistence.
 * Sanitizes all input fields on write and maintains an audit log (changeLog)
 * of major plan adjustments for adaptive replanning.
 */

import { sanitizeInput, sanitizeBudget, sanitizeGuestCount } from '../utils/sanitize.js';
import { STORAGE_KEYS } from '../constants/index.js';

/** Subscribers listening for state changes */
const listeners = new Set();

/**
 * Loads all events from localStorage.
 *
 * @returns {Object[]} Array of saved event plans
 */
export function loadEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    console.warn('Failed to load events from storage, returning empty array.');
    return [];
  }
}

/**
 * Saves all events to localStorage and notifies subscribers.
 *
 * @param {Object[]} events - Array of event plans to save
 */
function saveEvents(events) {
  try {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    notifyListeners();
  } catch (error) {
    console.error('Failed to save events:', error);
  }
}

/**
 * Gets the active event ID from localStorage.
 *
 * @returns {string|null}
 */
export function getActiveEventId() {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_EVENT);
}

/**
 * Sets the active event ID.
 *
 * @param {string} eventId
 */
export function setActiveEventId(eventId) {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_EVENT, eventId);
  notifyListeners();
}

/**
 * Gets the currently active event plan.
 *
 * @returns {Object|null}
 */
export function getActiveEvent() {
  const id = getActiveEventId();
  if (!id) return null;
  const events = loadEvents();
  return events.find(e => e.id === id) || null;
}

/**
 * Creates a new event plan and persists it.
 *
 * @param {Object} params
 * @param {string} params.eventType - wedding | birthday | community | other
 * @param {string} params.eventName - Name/title for the event
 * @param {number} params.budget - Total budget in INR
 * @param {number} params.guestCount - Expected guest count
 * @param {string} params.eventDate - Target event date (ISO string)
 * @param {string} params.priorities - User's priorities
 * @param {string} params.preferences - Atmosphere/style preferences
 * @param {string} params.culturalContext - Cultural context
 * @param {string} params.additionalNotes - Any extra notes
 * @returns {Object} The created event plan
 */
export function createEvent(params) {
  const event = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    eventType: sanitizeInput(params.eventType) || 'other',
    eventName: sanitizeInput(params.eventName) || 'My Event',
    budget: sanitizeBudget(params.budget),
    guestCount: sanitizeGuestCount(params.guestCount),
    eventDate: sanitizeInput(params.eventDate) || '',
    priorities: sanitizeInput(params.priorities) || '',
    preferences: sanitizeInput(params.preferences) || '',
    culturalContext: sanitizeInput(params.culturalContext) || '',
    additionalNotes: sanitizeInput(params.additionalNotes) || '',
    // Generated data (populated by AI)
    budgetBreakdown: null,
    timeline: null,
    vendorChecklist: null,
    ideas: null,
    // Shortlisted vendors comparison board
    shortlistedVendors: [],
    // Task tracking
    completedTasks: [],
    // Chat history
    chatHistory: [],
    // Change log for adaptive replanning audit
    changeLog: [],
  };

  const events = loadEvents();
  events.push(event);
  saveEvents(events);
  setActiveEventId(event.id);

  return event;
}

/**
 * Updates an existing event plan.
 *
 * @param {string} eventId - The event ID to update
 * @param {Object} updates - Partial updates to apply
 * @returns {Object|null} The updated event, or null if not found
 */
export function updateEvent(eventId, updates) {
  const events = loadEvents();
  const index = events.findIndex(e => e.id === eventId);
  if (index === -1) return null;

  // Log changes for significant updates
  const significantFields = ['budget', 'guestCount', 'eventDate', 'eventType'];
  const changes = [];
  for (const field of significantFields) {
    if (updates[field] !== undefined && updates[field] !== events[index][field]) {
      changes.push({
        field,
        oldValue: events[index][field],
        newValue: updates[field],
        timestamp: new Date().toISOString(),
      });
    }
  }

  events[index] = {
    ...events[index],
    ...updates,
    updatedAt: new Date().toISOString(),
    changeLog: [...(events[index].changeLog || []), ...changes],
  };

  saveEvents(events);
  return events[index];
}

/**
 * Deletes an event plan.
 *
 * @param {string} eventId
 */
export function deleteEvent(eventId) {
  const events = loadEvents().filter(e => e.id !== eventId);
  saveEvents(events);

  if (getActiveEventId() === eventId) {
    const newActive = events.length > 0 ? events[0].id : null;
    if (newActive) {
      setActiveEventId(newActive);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_EVENT);
    }
  }
}

/**
 * Toggles a task's completion status.
 *
 * @param {string} eventId
 * @param {string} taskId
 * @returns {Object|null} Updated event
 */
export function toggleTask(eventId, taskId) {
  const event = loadEvents().find(e => e.id === eventId);
  if (!event) return null;

  const completed = event.completedTasks || [];
  const isCompleted = completed.includes(taskId);

  return updateEvent(eventId, {
    completedTasks: isCompleted
      ? completed.filter(id => id !== taskId)
      : [...completed, taskId],
  });
}

/**
 * Adds a chat message to the event's conversation history.
 *
 * @param {string} eventId
 * @param {string} role - 'user' or 'assistant'
 * @param {string} content - Message content
 */
export function addChatMessage(eventId, role, content) {
  const event = loadEvents().find(e => e.id === eventId);
  if (!event) return;

  const history = event.chatHistory || [];
  history.push({
    role,
    content: sanitizeInput(content),
    timestamp: new Date().toISOString(),
  });

  updateEvent(eventId, { chatHistory: history });
}

/**
 * Subscribes a listener function to store updates.
 *
 * @param {() => void} callback - Callback function
 * @returns {() => void} Unsubscribe function
 */
export function subscribe(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/** Notifies all subscribers of a state change */
function notifyListeners() {
  listeners.forEach(fn => fn());
}

/** Generates a pseudo-random unique ID */
function generateId() {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Formats a budget amount in INR (Indian Rupees).
 *
 * @param {number} amount
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats a date string to a human-readable format in Indian English locale.
 *
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date (e.g., "15 Nov 2026")
 */
export function formatDate(dateString) {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Calculates days remaining until the event date.
 *
 * @param {string} eventDate - ISO date string
 * @returns {number} Non-negative integer of days
 */
export function daysUntil(eventDate) {
  if (!eventDate) return 0;
  const diff = new Date(eventDate) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
