/**
 * Token-Bucket Rate Limiter
 *
 * Implements client-side rate limiting to prevent Gemini API quota exhaustion
 * and guard against inadvertent spam or automated loops.
 */

import { BOUNDS } from '../constants/index.js';

export class RateLimiter {
  /**
   * Creates a new RateLimiter instance.
   *
   * @param {number} maxRequests - Maximum number of requests allowed in the window
   * @param {number} windowMs - Time window in milliseconds
   */
  constructor(maxRequests = BOUNDS.RATE_LIMIT_MAX_REQUESTS, windowMs = BOUNDS.RATE_LIMIT_WINDOW_MS) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    /** @type {number[]} */
    this.timestamps = [];
  }

  /**
   * Checks if a request can be made without exceeding the rate limit.
   *
   * @returns {boolean} True if the request is allowed
   */
  canMakeRequest() {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);
    return this.timestamps.length < this.maxRequests;
  }

  /**
   * Records a request timestamp.
   */
  recordRequest() {
    this.timestamps.push(Date.now());
  }

  /**
   * Attempts to make a request. Returns true if allowed, false if rate limited.
   *
   * @returns {boolean} Whether the request was allowed
   */
  tryRequest() {
    if (!this.canMakeRequest()) return false;
    this.recordRequest();
    return true;
  }

  /**
   * Returns the number of remaining requests in the current window.
   *
   * @returns {number} Remaining request count
   */
  remainingRequests() {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);
    return Math.max(0, this.maxRequests - this.timestamps.length);
  }
}

/** Singleton rate limiter for Gemini API calls (10 per minute) */
export const geminiRateLimiter = new RateLimiter(
  BOUNDS.RATE_LIMIT_MAX_REQUESTS,
  BOUNDS.RATE_LIMIT_WINDOW_MS
);
