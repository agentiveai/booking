import { z } from 'zod';

/**
 * Environment variable validation schema
 * Ensures all required environment variables are set and valid
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // Authentication
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters for security'),

  // Stripe Payments
  STRIPE_SECRET_KEY: z
    .string()
    .startsWith('sk_', 'STRIPE_SECRET_KEY must start with sk_'),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .startsWith('whsec_', 'STRIPE_WEBHOOK_SECRET must start with whsec_')
    .optional(),

  // Vipps Payments (Optional)
  VIPPS_CLIENT_ID: z.string().optional(),
  VIPPS_CLIENT_SECRET: z.string().optional(),
  VIPPS_MSN: z.string().optional(),
  VIPPS_SUBSCRIPTION_KEY: z.string().optional(),

  // SendGrid Email
  SENDGRID_API_KEY: z
    .string()
    .startsWith('SG.', 'SENDGRID_API_KEY must start with SG.'),
  SENDGRID_FROM_EMAIL: z
    .string()
    .email('SENDGRID_FROM_EMAIL must be a valid email'),
  SENDGRID_FROM_NAME: z.string().min(1, 'SENDGRID_FROM_NAME is required'),

  // Application URLs
  NEXT_PUBLIC_BASE_URL: z
    .string()
    .url('NEXT_PUBLIC_BASE_URL must be a valid URL'),
  APP_URL: z.string().url('APP_URL must be a valid URL').optional(),

  // Cron Job Security
  CRON_SECRET: z
    .string()
    .min(16, 'CRON_SECRET must be at least 16 characters for security'),

  // Redis (Optional)
  REDIS_URL: z.string().url().optional(),

  // Node Environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

/**
 * Validated and type-safe environment variables
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables
 * This should be called once at application startup
 */
function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment variable validation failed:');
      console.error('');

      error.errors.forEach((err) => {
        const path = err.path.join('.');
        console.error(`  • ${path}: ${err.message}`);
      });

      console.error('');
      console.error('Please check your .env file and ensure all required variables are set.');
      console.error('See .env.production.example for a complete list of required variables.');
      console.error('');

      // In production, fail fast
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Environment variable validation failed in production');
      }

      // In development, warn but continue
      console.error('⚠️  Continuing in development mode, but some features may not work.');
      console.error('');
    }

    throw error;
  }
}

/**
 * Validated environment variables
 * Use this instead of process.env for type safety
 */
export const env = validateEnv();

/**
 * Helper to check if we're in production
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Helper to check if we're in development
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Helper to check if we're in test
 */
export const isTest = env.NODE_ENV === 'test';

/**
 * Helper to get the base URL (prioritizes NEXT_PUBLIC_BASE_URL)
 */
export const getBaseUrl = () => {
  return env.NEXT_PUBLIC_BASE_URL || env.APP_URL || 'http://localhost:3000';
};

/**
 * Helper to check if Vipps is configured
 */
export const isVippsEnabled = () => {
  return !!(
    env.VIPPS_CLIENT_ID &&
    env.VIPPS_CLIENT_SECRET &&
    env.VIPPS_MSN &&
    env.VIPPS_SUBSCRIPTION_KEY
  );
};

/**
 * Helper to check if Redis is configured
 */
export const isRedisEnabled = () => {
  return !!env.REDIS_URL;
};
