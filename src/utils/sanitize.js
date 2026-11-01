/**
 * Sanitizes user input by removing potentially dangerous HTML characters.
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
 * Validates that a string contains only expected characters for an API key.
 * Prevents injection attacks through the API key input field.
 *
 * @param {string} key - The API key to validate
 * @returns {boolean} True if the key format is valid
 */
export function validateApiKeyFormat(key) {
  if (!key || typeof key !== 'string') return false;
  // Gemini API keys are alphanumeric with hyphens and underscores
  return /^[A-Za-z0-9_-]{20,}$/.test(key.trim());
}

/**
 * Validates and sanitizes a budget amount.
 * Ensures the value is a positive finite number within reasonable bounds.
 *
 * @param {*} value - The value to validate as a budget
 * @returns {number} A valid budget amount, or 0 if invalid
 */
export function sanitizeBudget(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 0;
  // Cap at 100 crore (1 billion INR) as a reasonable upper bound
  return Math.min(num, 1_000_000_000);
}

/**
 * Validates and sanitizes a guest count.
 *
 * @param {*} value - The value to validate as guest count
 * @returns {number} A valid guest count, or 0 if invalid
 */
export function sanitizeGuestCount(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.min(Math.round(num), 100_000);
}
