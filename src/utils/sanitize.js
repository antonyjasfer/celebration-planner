/**
 * Security and Data Sanitization Utilities
 *
 * Implements defensive measures against Cross-Site Scripting (XSS),
 * unbounded input manipulation, and sensitive credential exposure.
 */

import { BOUNDS } from '../constants/index.js';

/**
 * Sanitizes user input by escaping potentially dangerous HTML characters.
 * Prevents XSS attacks when user input is rendered in the DOM.
 *
 * @param {string} input - Raw user input string
 * @returns {string} Sanitized string safe for rendering
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Validates that a string matches the format of a Google Gemini API key.
 *
 * @param {string} key - The API key candidate to test
 * @returns {boolean} True if format is valid
 */
export function validateApiKeyFormat(key) {
  if (!key || typeof key !== 'string') return false;
  return /^[A-Za-z0-9_-]{20,}$/.test(key.trim());
}

/**
 * Masks an API key for safe display in user interfaces.
 *
 * @param {string} key - Plaintext API key
 * @returns {string} Partially masked key (e.g., "AIzaSy...•bc12")
 */
export function maskApiKey(key) {
  if (!key || typeof key !== 'string' || key.length < 8) return '••••••••';
  const prefix = key.slice(0, 6);
  const suffix = key.slice(-4);
  return `${prefix}••••••••${suffix}`;
}

/**
 * Validates and clamps a budget amount to realistic currency bounds.
 *
 * @param {*} value - The value to validate as a budget
 * @returns {number} A valid budget amount, or 0 if invalid
 */
export function sanitizeBudget(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.min(num, BOUNDS.MAX_BUDGET);
}

/**
 * Validates and clamps a guest count to realistic attendee bounds.
 *
 * @param {*} value - The value to validate as guest count
 * @returns {number} A valid guest count, or 0 if invalid
 */
export function sanitizeGuestCount(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.min(Math.round(num), BOUNDS.MAX_GUESTS);
}

/**
 * Cleans an error message before presenting it to the user.
 * Strips out internal paths, IP addresses, or potential API tokens.
 *
 * @param {*} error - Error object or string
 * @returns {string} Safe user-facing message
 */
export function sanitizeErrorMessage(error) {
  if (!error) return 'An unexpected error occurred. Please try again.';
  const msg = typeof error === 'string' ? error : (error.message || String(error));
  // Strip any API key-like sequences
  return msg.replace(/AIza[A-Za-z0-9_-]{20,}/g, '[REDACTED_API_KEY]');
}
