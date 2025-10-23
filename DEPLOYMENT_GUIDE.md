# Production Deployment Guide

This comprehensive guide covers deploying the Norwegian Booking Platform to production with all critical fixes applied.

## ✅ Critical Fixes Completed

The following critical issues have been fixed and are ready for production:

1. **Refund Processing** - Full Stripe and Vipps refund integration in cancellation endpoint
2. **Rate Limiting** - Integrated on booking creation API to prevent spam
3. **Cron Jobs** - Configured for workflow scheduler (runs every 15 minutes)
4. **Environment Validation** - Zod schema validation for all required environment variables
5. **Test Suite** - 16 passing tests covering critical functionality
6. **Landing Page** - Fully interactive, conversion-optimized design

## 📋 Pre-Deployment Checklist

### Critical Requirements
- [ ] PostgreSQL database provisioned (Supabase or Railway recommended)
- [ ] All environment variables configured (see `.env.production.example`)
- [ ] SendGrid API key obtained and verified
- [ ] Stripe account configured with webhook endpoint
- [ ] Domain name purchased and DNS configured
- [ ] SSL certificate (automatic with Vercel)

### Optional but Recommended
- [ ] Vipps payment integration configured (Norwegian market)
- [ ] Error monitoring (Sentry) configured
- [ ] Backup strategy implemented
- [ ] Rate limiting thresholds reviewed
- [ ] Email templates customized for brand

## 🔐 Step 1: Generate Secure Secrets

Run these commands locally to generate secure secrets:

```bash
# JWT Secret (minimum 32 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Cron Secret (minimum 16 characters)
node -e "console.log(require('crypto').randomBytes(24).toString('base64'))"

# NextAuth Secret (if using NextAuth)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Save these securely - you'll need them in Step 4.

## 🗄️ Step 2: Database Setup

### Option A: Supabase (Recommended)

1. Go to [supabase.com](https://supabase.com) and create account
2. Create new project (choose closest region to Norway)
3. Go to **Settings** → **Database** → **Connection String**
4. Copy the connection string (URI format)
5. Save for Step 4

```
postgresql://postgres.[project-ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
```

### Option B: Railway

1. Go to [railway.app](https://railway.app) and create account
2. Click **New Project** → **Provision PostgreSQL**
3. Click on PostgreSQL service → **Connect** tab
4. Copy the **Postgres Connection URL**
5. Save for Step 4

### Run Database Migration

After database is provisioned, run migration locally:

```bash
# Set your DATABASE_URL temporarily
export DATABASE_URL="your-production-database-url"

# Run Prisma migration
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

## 📧 Step 3: SendGrid Email Configuration

1. Go to [sendgrid.com](https://sendgrid.com) and create account
2. Navigate to **Settings** → **API Keys**
3. Click **Create API Key**
4. Name it "booking-platform-production"
5. Select **Full Access** permissions
6. Copy the API key (starts with `SG.`)
7. Verify your sender email:
   - Go to **Settings** → **Sender Authentication**
   - Verify a single sender email or domain
   - This is required to send emails
8. Save API key for Step 4

## 💳 Step 4: Stripe Payment Configuration

1. Go to [stripe.com](https://stripe.com) and create account (or use existing)
2. Switch to **Live mode** (toggle in top right)
3. Go to **Developers** → **API keys**
4. Copy your **Secret key** (starts with `sk_live_`)
5. Copy your **Publishable key** (starts with `pk_live_`)
6. Save for Step 4

### Stripe Webhook Setup

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set URL to: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Save for Step 4

## 🌍 Step 5: Environment Variables

Copy all variables from `.env.production.example` to your hosting platform.

### Vercel Environment Variables

1. Go to [vercel.com](https://vercel.com) and log in
2. Import your Git repository
3. Go to **Settings** → **Environment Variables**
4. Add each variable below:

#### Required Variables

```bash
# Database
DATABASE_URL="postgresql://..." # From Step 2

# Authentication
JWT_SECRET="..." # From Step 1
NEXTAUTH_SECRET="..." # From Step 1 (if using NextAuth)
NEXTAUTH_URL="https://yourdomain.com"

# Email (SendGrid)
SENDGRID_API_KEY="SG...." # From Step 3
SENDGRID_FROM_EMAIL="noreply@yourdomain.com" # Your verified sender
SENDGRID_FROM_NAME="Your Company Name"

# Payment (Stripe)
STRIPE_SECRET_KEY="sk_live_..." # From Step 4
STRIPE_WEBHOOK_SECRET="whsec_..." # From Step 4
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..." # From Step 4

# Application
NEXT_PUBLIC_BASE_URL="https://yourdomain.com"
NODE_ENV="production"

# Cron Jobs
CRON_SECRET="..." # From Step 1

# Security
ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
```

#### Optional Variables (Vipps Payment)

```bash
VIPPS_CLIENT_ID="your-client-id"
VIPPS_CLIENT_SECRET="your-client-secret"
VIPPS_SUBSCRIPTION_KEY="your-subscription-key"
VIPPS_MERCHANT_SERIAL_NUMBER="your-merchant-serial"
```

## 🚀 Step 6: Deploy to Vercel

### Via Vercel Dashboard (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: .next
4. Add all environment variables from Step 5
5. Click **Deploy**
6. Wait for deployment to complete
7. Your app will be live at `https://your-project.vercel.app`

### Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to production
vercel --prod

# Follow prompts to configure project
```

## ⏰ Step 7: Verify Cron Job

The workflow scheduler runs every 15 minutes via Vercel Cron.

### Verify Configuration

1. Check `vercel.json` exists:
```json
{
  "crons": [
    {
      "path": "/api/cron/workflows",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

2. Go to Vercel Dashboard → **Cron Jobs**
3. Verify the cron job appears and is enabled
4. Check recent executions (after 15 minutes)

### Manual Test

```bash
# Test cron endpoint manually
curl -X GET https://yourdomain.com/api/cron/workflows \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response: `{ "success": true, "processed": 0 }`

## 🧪 Step 8: Testing Checklist

### Critical Features to Test

- [ ] **User Registration** - Create account and verify email
- [ ] **Service Creation** - Create a test service with availability
- [ ] **Booking Flow** - Book a service, complete payment
- [ ] **Payment Processing** - Verify Stripe charge appears
- [ ] **Confirmation Email** - Verify customer receives confirmation
- [ ] **Cancellation** - Cancel booking and verify refund
- [ ] **Workflow Automation** - Verify reminder emails are sent
- [ ] **Rate Limiting** - Test API limits (make 100+ requests)
- [ ] **Staff Management** - Add staff, assign to services
- [ ] **Embed Widget** - Test booking widget on external site

### Performance Tests

```bash
# Run all tests locally
npm run test:run

# All 16 tests should pass
```

### Load Testing (Optional)

```bash
# Install k6
brew install k6  # macOS

# Run load test
k6 run tests/load/booking.js
```

## 📊 Step 9: Monitoring Setup

### Error Tracking (Sentry)

1. Go to [sentry.io](https://sentry.io) and create account
2. Create new project (Next.js)
3. Copy DSN
4. Add to Vercel environment variables:
```bash
NEXT_PUBLIC_SENTRY_DSN="https://...@sentry.io/..."
```

### Logging

All errors are logged to console in production. Vercel automatically captures:
- Function logs
- Error traces
- Performance metrics

Access logs at: **Vercel Dashboard** → **Deployments** → **Functions** → **Logs**

### Uptime Monitoring

Set up monitoring at [uptimerobot.com](https://uptimerobot.com):
- Monitor main domain: `https://yourdomain.com`
- Monitor API health: `https://yourdomain.com/api/health`
- Alert via email/SMS on downtime

## 🔒 Step 10: Security Hardening

### Rate Limiting Review

Check [lib/utils/rate-limit.ts](lib/utils/rate-limit.ts) for current limits:

```typescript
export const RateLimitPresets = {
  api: { maxRequests: 100, windowMs: 15 * 60 * 1000 }, // 100 per 15 min
  auth: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15 min
  strict: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 per minute
};
```

Adjust if needed based on expected traffic.

### CORS Configuration

Verify allowed origins in [middleware.ts](middleware.ts):
```typescript
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
```

### Webhook Security

All webhooks verify signatures:
- Stripe: Validates `stripe-signature` header
- Cron: Requires `CRON_SECRET` in Authorization header

## 🚦 Step 11: Go Live!

### Pre-Launch

1. **Domain Configuration**
   - Add custom domain in Vercel Dashboard
   - Update DNS A record to point to Vercel
   - Wait for SSL certificate (automatic)

2. **Update Environment Variables**
   - Update `NEXT_PUBLIC_BASE_URL` to your domain
   - Update `NEXTAUTH_URL` to your domain
   - Update Stripe webhook URL to your domain

3. **Final Verification**
   - Test complete booking flow on production domain
   - Verify email delivery
   - Verify payment processing
   - Check all pages load correctly

### Launch Announcement

1. Update landing page with correct company information
2. Add Google Analytics (optional)
3. Add GDPR compliance banner (required for EU/Norway)
4. Announce to first users/customers

## 🔧 Troubleshooting

### Database Connection Issues

**Error**: `P1001: Can't reach database server`
**Fix**:
- Verify DATABASE_URL is correct
- Check database is running
- Verify IP whitelist (some providers require)

### Email Not Sending

**Error**: `403 Forbidden` from SendGrid
**Fix**:
- Verify API key is correct
- Verify sender email is verified in SendGrid
- Check SendGrid activity log

### Payment Failures

**Error**: `No such payment_intent`
**Fix**:
- Verify Stripe key is for correct mode (test vs live)
- Check webhook signature secret matches
- Review Stripe dashboard for error details

### Cron Job Not Running

**Error**: Workflows not triggering
**Fix**:
- Verify vercel.json is deployed
- Check Vercel Dashboard → Cron Jobs
- Verify CRON_SECRET matches
- Check function logs for errors

### Rate Limiting Too Aggressive

**Error**: Users getting 429 errors
**Fix**:
- Adjust rate limits in [lib/utils/rate-limit.ts](lib/utils/rate-limit.ts)
- Consider using Redis for distributed rate limiting

## 📈 Post-Launch

### Week 1
- [ ] Monitor error rates daily
- [ ] Check payment success rates
- [ ] Review email delivery rates
- [ ] Gather user feedback

### Month 1
- [ ] Review performance metrics
- [ ] Optimize slow API endpoints
- [ ] Add additional features based on feedback
- [ ] Consider upgrading to Redis rate limiting

### Ongoing
- [ ] Regular database backups (automated via Supabase/Railway)
- [ ] Security updates (npm audit fix)
- [ ] Feature development
- [ ] Scale infrastructure as needed

## 🎉 Success Metrics

Track these KPIs to measure platform success:

- **Booking Conversion Rate**: Visitors → Completed bookings
- **Payment Success Rate**: Should be >95%
- **Email Delivery Rate**: Should be >98%
- **Page Load Time**: Should be <2s
- **API Response Time**: Should be <500ms
- **Error Rate**: Should be <1%
- **User Retention**: Monthly active users

## 📞 Support

If you encounter issues not covered here:

1. Check [TESTING_GUIDE.md](TESTING_GUIDE.md) for test procedures
2. Review [ARCHITECTURE.md](ARCHITECTURE.md) for system design
3. Check Vercel logs for detailed error traces
4. Review API documentation in `/app/api/`

## 🏆 Production Ready Checklist

Before announcing launch, verify:

- [x] All critical fixes applied (refunds, rate limiting, cron)
- [x] Test suite passes (16/16 tests)
- [ ] Database migrations completed
- [ ] All environment variables configured
- [ ] Payment gateways tested end-to-end
- [ ] Email delivery verified
- [ ] Custom domain configured with SSL
- [ ] Monitoring and alerts configured
- [ ] Backup strategy in place
- [ ] GDPR compliance reviewed
- [ ] Terms of Service and Privacy Policy published
- [ ] First booking completed successfully

---

**Last Updated**: October 23, 2025
**Platform Version**: 1.0.0
**Status**: Production Ready

Good luck with your launch! 🚀
