import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWithRetry, calculateBackoffDelay } from '../fetchWithRetry';

describe('fetchWithRetry utility', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('calculateBackoffDelay', () => {
    it('calculates exponential delay with increasing attempts', () => {
      const delay0 = calculateBackoffDelay(0, 100, 5000, 2);
      const delay1 = calculateBackoffDelay(1, 100, 5000, 2);
      const delay2 = calculateBackoffDelay(2, 100, 5000, 2);

      expect(delay0).toBeGreaterThanOrEqual(100);
      expect(delay1).toBeGreaterThanOrEqual(200);
      expect(delay2).toBeGreaterThanOrEqual(400);
    });

    it('respects Retry-After header if provided', () => {
      const delay = calculateBackoffDelay(0, 100, 5000, 2, '3');
      expect(delay).toBe(3000);
    });

    it('caps delay at maxDelayMs', () => {
      const delay = calculateBackoffDelay(10, 100, 1000, 2);
      expect(delay).toBeLessThanOrEqual(1000);
    });
  });

  describe('fetchWithRetry execution', () => {
    it('returns response immediately when successful', async () => {
      const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const res = await fetchWithRetry('/api/test');
      expect(res.status).toBe(200);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('retries on HTTP 429 Too Many Requests and succeeds', async () => {
      const rateLimitResponse = new Response(null, { status: 429 });
      const okResponse = new Response(JSON.stringify({ page: 1 }), { status: 200 });

      global.fetch = vi.fn()
        .mockResolvedValueOnce(rateLimitResponse)
        .mockResolvedValueOnce(okResponse);

      const res = await fetchWithRetry('/api/movies/popular', undefined, {
        maxRetries: 2,
        initialDelayMs: 10,
        maxDelayMs: 50,
      });

      expect(res.status).toBe(200);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('retries on network error and returns when recovered', async () => {
      const okResponse = new Response(JSON.stringify({ results: [] }), { status: 200 });

      global.fetch = vi.fn()
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce(okResponse);

      const res = await fetchWithRetry('/api/movies/search', undefined, {
        maxRetries: 2,
        initialDelayMs: 10,
        maxDelayMs: 50,
      });

      expect(res.status).toBe(200);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('throws after exceeding maxRetries on persistent 500 errors', async () => {
      const errorResponse = new Response(null, { status: 500 });
      global.fetch = vi.fn().mockResolvedValue(errorResponse);

      const res = await fetchWithRetry('/api/movies/popular', undefined, {
        maxRetries: 2,
        initialDelayMs: 10,
        maxDelayMs: 50,
      });

      // Returns the last 500 response after all retries exhausted
      expect(res.status).toBe(500);
      expect(global.fetch).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });
  });
});
