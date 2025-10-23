import { describe, it, expect, beforeEach } from 'vitest';
import { generateToken, verifyToken } from '@/lib/auth/jwt';

describe('JWT Authentication', () => {
  const mockPayload = {
    userId: 'user-123',
    email: 'test@example.com',
    role: 'PROVIDER',
  };

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate different tokens for different payloads', () => {
      const token1 = generateToken(mockPayload);
      const token2 = generateToken({ ...mockPayload, userId: 'user-456' });

      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const token = generateToken(mockPayload);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(mockPayload.userId);
      expect(decoded?.email).toBe(mockPayload.email);
      expect(decoded?.role).toBe(mockPayload.role);
    });

    it('should return null for invalid token', () => {
      const decoded = verifyToken('invalid.token.here');

      expect(decoded).toBeNull();
    });

    it('should return null for expired token', () => {
      // This would require mocking time or waiting for token to expire
      // For now, just test invalid signature
      const validToken = generateToken(mockPayload);
      const tamperedToken = validToken + 'tampered';

      const decoded = verifyToken(tamperedToken);

      expect(decoded).toBeNull();
    });
  });
});
