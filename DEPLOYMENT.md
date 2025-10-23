# Deployment Guide

This guide covers deploying the Norwegian Booking Platform to production.

## Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations tested
- [ ] Payment integrations tested (Stripe + Vipps)
- [ ] Email templates reviewed and tested
- [ ] SSL certificate configured
- [ ] Domain name purchased and configured
- [ ] Backup strategy in place
- [ ] Monitoring and error tracking set up

## Production Environment Setup

### 1. Database (PostgreSQL)

#### Option A: Supabase (Recommended for MVP)

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Get connection string from Settings → Database
4. Update `DATABASE_URL` in production environment

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
```

#### Option B: Railway

1. Create account at [railway.app](https://railway.app)
2. Create new PostgreSQL database
3. Copy connection string
4. Update `DATABASE_URL`

### 2. Hosting (Vercel)

#### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

#### Configure Environment Variables

In Vercel dashboard (Settings → Environment Variables):

```env
# Database
DATABASE_URL=

# Auth
NEXTAUTH_URL=https://yourdomain.no
NEXTAUTH_SECRET=
JWT_SECRET=

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Vipps (Production)
VIPPS_CLIENT_ID=
VIPPS_CLIENT_SECRET=
VIPPS_MERCHANT_SERIAL_NUMBER=
VIPPS_SUBSCRIPTION_KEY=
VIPPS_ENVIRONMENT=production

# SendGrid
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@yourdomain.no
SENDGRID_FROM_NAME=Your Business Name

# Google Calendar
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://yourdomain.no/api/calendar/google/callback

# App
APP_URL=https://yourdomain.no
NODE_ENV=production
```

### 3. Domain Configuration

1. Add custom domain in Vercel dashboard
2. Update DNS records:
   - Type: CNAME
   - Name: @ or www
   - Value: cname.vercel-dns.com

3. Wait for SSL certificate provisioning (automatic)

### 4. Database Migration

```bash
# Run from local machine (connected to production DB)
DATABASE_URL="your-production-url" npx prisma db push

# Or use Prisma Migrate for production
DATABASE_URL="your-production-url" npx prisma migrate deploy
```

### 5. Payment Provider Configuration

#### Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.no/api/webhooks/stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

#### Vipps Production

1. Apply for production access at [portal.vipps.no](https://portal.vipps.no)
2. Complete merchant onboarding
3. Get production credentials
4. Update environment variables with production keys
5. Configure callback URLs

### 6. Email Configuration

#### SendGrid

1. Verify sender email/domain
2. Create API key with full access
3. Add to environment variables
4. Test email delivery

#### Custom Domain Email (Optional)

1. Configure DNS records for SendGrid
2. Verify domain
3. Update `SENDGRID_FROM_EMAIL`

### 7. Monitoring & Error Tracking

#### Sentry (Recommended)

```bash
npm install @sentry/nextjs
```

Configure in `sentry.config.js`:

```javascript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

#### Vercel Analytics

Enable in Vercel dashboard → Analytics

### 8. Performance Optimization

#### CDN Configuration

Vercel automatically provides:
- Global CDN
- Image optimization
- Edge caching

#### Database Optimization

1. Enable connection pooling (Prisma Accelerate or PgBouncer)
2. Add database indexes (already in schema)
3. Monitor slow queries

### 9. Security Hardening

#### Environment Variables

- Never commit `.env` files
- Rotate secrets regularly
- Use different keys for dev/staging/production

#### Rate Limiting

Add rate limiting middleware (recommended for production):

```bash
npm install express-rate-limit
```

#### CORS Configuration

Update Next.js config:

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://yourdomain.no' },
        ],
      },
    ];
  },
};
```

## Backup Strategy

### Database Backups

#### Automated (Supabase)

- Automatic daily backups
- Point-in-time recovery
- 7-day retention on free tier

#### Manual Backup

```bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### File Backups

- Next.js static files: Version controlled in Git
- User uploads: Store in S3 or Cloudflare R2
- Database backups: Store securely off-site

## Scaling Considerations

### Traffic Levels

- **0-1K users**: Vercel free tier + Supabase free tier
- **1K-10K users**: Vercel Pro + Supabase Pro + Redis
- **10K+ users**: Consider microservices architecture

### Database Scaling

1. Read replicas for heavy read operations
2. Connection pooling (PgBouncer)
3. Caching layer (Redis)
4. Database sharding (for very large scale)

### Horizontal Scaling

Vercel automatically scales:
- Edge functions
- API routes
- Static assets

## Post-Deployment

### Verification Checklist

- [ ] Website loads on custom domain
- [ ] SSL certificate active (https://)
- [ ] Test booking flow end-to-end
- [ ] Test payment with real card (small amount)
- [ ] Test Vipps payment flow
- [ ] Verify email delivery
- [ ] Check database connection
- [ ] Monitor error logs
- [ ] Verify API endpoints
- [ ] Test mobile responsiveness

### Testing Production

```bash
# Create test booking
curl -X POST https://yourdomain.no/api/bookings/create \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": "...",
    "serviceId": "...",
    "startTime": "2025-01-20T10:00:00Z",
    "customerName": "Test User",
    "customerEmail": "test@example.no",
    "customerPhone": "+4712345678",
    "paymentMethod": "STRIPE"
  }'
```

### Monitoring

Set up alerts for:
- API response time > 2 seconds
- Error rate > 1%
- Database connection failures
- Payment failures
- Email delivery failures

## Rollback Plan

If issues occur:

```bash
# Revert to previous deployment
vercel rollback
```

Or redeploy specific commit:

```bash
vercel --prod --commit=<commit-hash>
```

## Maintenance

### Regular Tasks

- Weekly: Review error logs
- Monthly: Update dependencies
- Quarterly: Security audit
- Annually: Review and rotate API keys

### Updates

```bash
# Update dependencies
npm update

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
DATABASE_URL="your-url" npx prisma db pull
```

### Build Failures

Check Vercel build logs for errors. Common issues:
- Missing environment variables
- TypeScript errors
- Missing dependencies

### Payment Issues

- Verify webhook endpoints are accessible
- Check webhook signing secrets match
- Review payment provider logs

## Support

For deployment issues:

- Vercel: [vercel.com/support](https://vercel.com/support)
- Supabase: [supabase.com/support](https://supabase.com/support)
- Stripe: [stripe.com/support](https://stripe.com/support)
- Vipps: [developer.vippsmobilepay.com](https://developer.vippsmobilepay.com)

---

Last updated: 2025-01-19
