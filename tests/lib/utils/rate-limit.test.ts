import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit } from '@/lib/utils/rate-limit';

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Rate limit store is in-memory, so it persists between tests
    // We use different identifiers to avoid conflicts
  });

  describe('checkRateLimit', () => {
    it('should allow requests under the limit', () => {
      const config = { maxRequests: 5, windowMs: 60000 };

      const result1 = checkRateLimit('test-user-1', config);
      const result2 = checkRateLimit('test-user-1', config);
      const result3 = checkRateLimit('test-user-1', config);

      expect(result1.limited).toBe(false);
      expect(result2.limited).toBe(false);
      expect(result3.limited).toBe(false);
      expect(result3.remaining).toBe(2); // 5 - 3 = 2
    });

    it('should block requests over the limit', () => {
      const config = { maxRequests: 3, windowMs: 60000 };

      checkRateLimit('test-user-2', config); // 1
      checkRateLimit('test-user-2', config); // 2
      checkRateLimit('test-user-2', config); // 3
      const result4 = checkRateLimit('test-user-2', config); // 4 - should be blocked

      expect(result4.limited).toBe(true);
      expect(result4.remaining).toBe(0);
    });

    it('should track different users separately', () => {
      const config = { maxRequests: 2, windowMs: 60000 };

      const resultA1 = checkRateLimit('user-a', config);
      const resultA2 = checkRateLimit('user-a', config);
      const resultB1 = checkRateLimit('user-b', config);

      expect(resultA1.limited).toBe(false);
      expect(resultA2.limited).toBe(false);
      expect(resultB1.limited).toBe(false);
      expect(resultB1.remaining).toBe(1); // User B still has remaining requests
    });

    it('should include reset timestamp', () => {
      const config = { maxRequests: 5, windowMs: 60000 };
      const result = checkRateLimit('test-user-3', config);

      expect(result.resetAt).toBeDefined();
      expect(result.resetAt).toBeGreaterThan(Date.now());
      expect(result.resetAt).toBeLessThanOrEqual(Date.now() + 60000);
    });
  });
});
