/**
 * CelebriPlan Application Constants
 *
 * Centralized configuration values, storage keys, event taxonomies,
 * and design system tokens. Eliminates magic strings and numbers.
 */

/** LocalStorage and SessionStorage keys */
export const STORAGE_KEYS = {
  EVENTS: 'celebriplan_events',
  ACTIVE_EVENT: 'celebriplan_active_event',
  API_KEY: 'gemini_api_key',
  MODAL_DISMISSED: 'api_key_modal_dismissed',
};

/** Supported celebration personas/verticals */
export const EVENT_TYPES = {
  WEDDING: 'wedding',
  BIRTHDAY: 'birthday',
  COMMUNITY: 'community',
  OTHER: 'other',
};

/** Priority categories for event planning */
export const PRIORITY_OPTIONS = [
  { id: 'food', label: 'Food & Catering', emoji: '🍽️' },
  { id: 'venue', label: 'Venue & Ambiance', emoji: '🏛️' },
  { id: 'decoration', label: 'Decoration & Theme', emoji: '🎨' },
  { id: 'photography', label: 'Photography & Video', emoji: '📸' },
  { id: 'entertainment', label: 'Entertainment & Music', emoji: '🎵' },
  { id: 'guest_experience', label: 'Guest Experience', emoji: '🎁' },
];

/** Vendor categories for coordination and tracking */
export const VENDOR_CATEGORIES = [
  'Catering & Beverages',
  'Venue & Banquet Hall',
  'Decor & Theme Styling',
  'Photography & Cinematography',
  'Sound, DJ & Entertainment',
  'Other Vendor',
];

/** Task priority rankings */
export const TASK_PRIORITIES = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

/** Task category domains */
export const TASK_CATEGORIES = {
  VENUE: 'venue',
  CATERING: 'catering',
  DECORATION: 'decoration',
  PHOTOGRAPHY: 'photography',
  GUEST: 'guest',
  GENERAL: 'general',
  OTHER: 'other',
};

/** Default percentage allocated to emergency contingency */
export const DEFAULT_CONTINGENCY_PERCENT = 0.05;

/** Maximum allowed limits for safety & sanitization */
export const BOUNDS = {
  MAX_BUDGET: 1_000_000_000, // 100 Crore INR
  MAX_GUESTS: 100_000,
  DEFAULT_BUDGET: 200_000,
  DEFAULT_GUESTS: 100,
  RATE_LIMIT_MAX_REQUESTS: 10,
  RATE_LIMIT_WINDOW_MS: 60_000, // 1 minute
};
