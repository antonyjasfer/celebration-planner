import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimiter, geminiRateLimiter } from '../rateLimiter';

describe('RateLimiter Utility', () => {
  let limiter;

  beforeEach(() => {
    limiter = new RateLimiter(3, 1000); // 3 requests per 1000ms
  });

  it('allows requests within the limit', () => {
    expect(limiter.canMakeRequest()).toBe(true);
    expect(limiter.tryRequest()).toBe(true);
    expect(limiter.remainingRequests()).toBe(2);

    expect(limiter.tryRequest()).toBe(true);
    expect(limiter.tryRequest()).toBe(true);
    expect(limiter.remainingRequests()).toBe(0);
  });

  it('blocks requests once the threshold is exceeded', () => {
    limiter.tryRequest();
    limiter.tryRequest();
    limiter.tryRequest();

    expect(limiter.canMakeRequest()).toBe(false);
    expect(limiter.tryRequest()).toBe(false);
  });

  it('resets allowed count after time window expires', () => {
    const now = 10000;
    vi.spyOn(Date, 'now').mockReturnValue(now);

    limiter.tryRequest();
    limiter.tryRequest();
    limiter.tryRequest();
    expect(limiter.canMakeRequest()).toBe(false);

    // Fast-forward past windowMs (1000ms)
    vi.spyOn(Date, 'now').mockReturnValue(now + 1500);

    expect(limiter.canMakeRequest()).toBe(true);
    expect(limiter.tryRequest()).toBe(true);
    vi.restoreAllMocks();
  });

  it('singleton geminiRateLimiter exists and has 10 req/min default configuration', () => {
    expect(geminiRateLimiter).toBeInstanceOf(RateLimiter);
    expect(geminiRateLimiter.maxRequests).toBe(10);
    expect(geminiRateLimiter.windowMs).toBe(60000);
  });
});
