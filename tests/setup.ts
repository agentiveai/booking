import '@testing-library/jest-dom';
import { beforeAll, afterAll, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables for testing
beforeAll(() => {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  process.env.JWT_SECRET = 'test-secret-key-that-is-32-characters-long';
  process.env.SENDGRID_API_KEY = 'SG.test-key';
  process.env.SENDGRID_FROM_EMAIL = 'test@test.com';
  process.env.SENDGRID_FROM_NAME = 'Test';
  process.env.STRIPE_SECRET_KEY = 'sk_test_123';
  process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
  process.env.CRON_SECRET = 'test-cron-secret';
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  // Cleanup
});
