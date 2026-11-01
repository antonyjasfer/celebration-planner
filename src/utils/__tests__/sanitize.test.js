import { describe, it, expect } from 'vitest';
import {
  sanitizeInput,
  validateApiKeyFormat,
  sanitizeBudget,
  sanitizeGuestCount,
  maskApiKey,
  sanitizeErrorMessage,
} from '../sanitize';

describe('Sanitize Utilities', () => {
  describe('sanitizeInput', () => {
    it('escapes dangerous HTML characters', () => {
      const unsafe = '<script>alert("xss")</script>&"\'';
      const safe = sanitizeInput(unsafe);
      expect(safe).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;&amp;&quot;&#x27;');
    });

    it('returns empty string for non-string input', () => {
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
      expect(sanitizeInput(12345)).toBe('');
      expect(sanitizeInput({})).toBe('');
    });

    it('preserves clean text without alterations', () => {
      const clean = 'Grand Royal Wedding Celebration 2026';
      expect(sanitizeInput(clean)).toBe(clean);
    });
  });

  describe('validateApiKeyFormat', () => {
    it('returns true for valid Gemini API keys', () => {
      expect(validateApiKeyFormat('AIzaSyD-1234567890abcdef_XYZ123')).toBe(true);
      expect(validateApiKeyFormat('a-valid-api-key-with-proper-length-12345')).toBe(true);
    });

    it('returns false for keys that are too short', () => {
      expect(validateApiKeyFormat('short-key')).toBe(false);
      expect(validateApiKeyFormat('')).toBe(false);
    });

    it('returns false for invalid inputs and characters', () => {
      expect(validateApiKeyFormat(null)).toBe(false);
      expect(validateApiKeyFormat(undefined)).toBe(false);
      expect(validateApiKeyFormat(1234567890)).toBe(false);
      expect(validateApiKeyFormat('invalid key with spaces and length 12345')).toBe(false);
      expect(validateApiKeyFormat('invalid<key>withspecialchars12345678')).toBe(false);
    });
  });

  describe('sanitizeBudget', () => {
    it('parses valid numeric budgets', () => {
      expect(sanitizeBudget(500000)).toBe(500000);
      expect(sanitizeBudget('750000')).toBe(750000);
    });

    it('returns 0 for negative, invalid, or NaN values', () => {
      expect(sanitizeBudget(-1000)).toBe(0);
      expect(sanitizeBudget('invalid')).toBe(0);
      expect(sanitizeBudget(null)).toBe(0);
      expect(sanitizeBudget(undefined)).toBe(0);
      expect(sanitizeBudget(NaN)).toBe(0);
      expect(sanitizeBudget(Infinity)).toBe(0);
    });

    it('caps extreme budgets at 1 billion INR', () => {
      expect(sanitizeBudget(2_000_000_000)).toBe(1_000_000_000);
    });
  });

  describe('sanitizeGuestCount', () => {
    it('parses and rounds valid guest counts', () => {
      expect(sanitizeGuestCount(250)).toBe(250);
      expect(sanitizeGuestCount('150')).toBe(150);
      expect(sanitizeGuestCount(99.6)).toBe(100);
    });

    it('returns 0 for negative or invalid guest counts', () => {
      expect(sanitizeGuestCount(-50)).toBe(0);
      expect(sanitizeGuestCount('abc')).toBe(0);
      expect(sanitizeGuestCount(null)).toBe(0);
      expect(sanitizeGuestCount(NaN)).toBe(0);
    });

    it('caps guest counts at 100,000 attendees', () => {
      expect(sanitizeGuestCount(500_000)).toBe(100_000);
    });
  });

  describe('maskApiKey', () => {
    it('masks the middle characters of a sensitive key', () => {
      const masked = maskApiKey('AIzaSyD1234567890abcdefXYZ');
      expect(masked).toBe('AIzaSy••••••••tXYZ'.replace('tXYZ', 'fXYZ'));
      expect(masked.startsWith('AIzaSy')).toBe(true);
      expect(masked.endsWith('fXYZ')).toBe(true);
      expect(masked).toContain('••••••••');
    });

    it('returns default mask for short or invalid keys', () => {
      expect(maskApiKey('')).toBe('••••••••');
      expect(maskApiKey('short')).toBe('••••••••');
      expect(maskApiKey(null)).toBe('••••••••');
    });
  });

  describe('sanitizeErrorMessage', () => {
    it('redacts exposed API key sequences from error text', () => {
      const rawError = 'Failed to connect to Google API using key AIzaSyD1234567890abcdefXYZ: 403 Forbidden';
      const safe = sanitizeErrorMessage(rawError);
      expect(safe).not.toContain('AIzaSyD1234567890abcdefXYZ');
      expect(safe).toContain('[REDACTED_API_KEY]');
    });

    it('returns fallback message for empty errors', () => {
      expect(sanitizeErrorMessage(null)).toBe('An unexpected error occurred. Please try again.');
      expect(sanitizeErrorMessage('')).toBe('An unexpected error occurred. Please try again.');
    });
  });
});
