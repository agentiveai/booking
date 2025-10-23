# Pre-Launch Checklist for Norwegian Booking Platform

## ✅ Completed Security Improvements (Today)

### 1. JWT Secret Validation ✅
- **File**: `lib/auth/jwt.ts`
- **What**: Added validation to prevent app from running in production without proper JWT_SECRET
- **Action Required**: Set `JWT_SECRET` environment variable before deployment
- **Priority**: CRITICAL

### 2. Stripe Webhook Handler ✅
- **File**: `app/api/webhooks/stripe/route.ts`
- **What**: Created webhook endpoint to handle payment confirmations
- **Features**:
  - Verifies webhook signatures for security
  - Handles `payment_intent.succeeded` - confirms booking and sends email
  - Handles `payment_intent.payment_failed` - cancels booking
  - Handles `payment_intent.canceled` - cancels booking
- **Action Required**:
  1. Set `STRIPE_WEBHOOK_SECRET` in environment variables
  2. Configure webhook URL in Stripe Dashboard: `https://yourdomain.com/api/webhooks/stripe`
  3. Subscribe to events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`

### 3. Security Headers & CORS ✅
- **File**: `middleware.ts`
- **What**: Added security headers to all responses
- **Features**:
  - X-Frame-Options: DENY (prevents clickjacking)
  - X-Content-Type-Options: nosniff
  - Content-Security-Policy
  - CORS for public booking endpoints
- **Action Required**: Update `allowedOrigins` in middleware.ts with your production domains

### 4. Rate Limiting ✅
- **File**: `lib/utils/rate-limit.ts`
- **What**: In-memory rate limiting for auth endpoints
- **Applied to**:
  - `/api/auth/login` - 5 requests per 15 minutes
  - `/api/auth/register` - 5 requests per 15 minutes
- **Future**: Consider using Redis for production (current implementation works but loses state on restart)

---

## 🚨 CRITICAL: Must Complete Before Launch

### 1. Environment Variables
**File**: `.env`

```bash
# CRITICAL - Generate strong secrets
JWT_SECRET="[GENERATE 64+ CHARACTER RANDOM STRING]"
NEXTAUTH_SECRET="[GENERATE 64+ CHARACTER RANDOM STRING]"

# Stripe Production Keys
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..." # Get from Stripe Dashboard

# SendGrid (for emails)
SENDGRID_API_KEY="SG...."
SENDGRID_FROM_EMAIL="noreply@yourdomain.com"
SENDGRID_FROM_NAME="Your Business Name"

# Database (Supabase Production)
DATABASE_URL="postgresql://..."

# Application URLs
APP_URL="https://yourdomain.com"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NODE_ENV="production"
```

**How to generate secrets**:
```bash
# On Mac/Linux:
openssl rand -base64 64

# Or use Node.js:
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### 2. Database Migration
```bash
# Run migrations on production database
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### 3. Stripe Configuration
1. Switch from test mode to live mode in Stripe Dashboard
2. Update API keys in `.env`
3. Configure webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
4. Subscribe to events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`
5. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 4. SendGrid Configuration
1. Verify sender email address in SendGrid
2. Add SPF, DKIM records to your domain DNS
3. Test email delivery: `npm run test:email` (create this script)

---

## ⚠️ Important: Should Complete Before Launch

### 1. Payment Testing
- [ ] Test Stripe payment flow end-to-end
- [ ] Test Vipps payment flow (if implementing)
- [ ] Verify webhook receives and processes events correctly
- [ ] Test failed payment scenarios
- [ ] Confirm booking confirmations sent via email

### 2. Error Monitoring
Consider adding error tracking:
```bash
npm install @sentry/nextjs
# Configure Sentry for production error tracking
```

### 3. Logging
- [ ] Set up structured logging (e.g., Winston, Pino)
- [ ] Configure log aggregation (e.g., Logtail, Papertrail)
- [ ] Add monitoring for webhook failures

### 4. Performance
- [ ] Enable Next.js production optimizations
- [ ] Configure CDN for static assets
- [ ] Test site performance with Lighthouse
- [ ] Optimize images (already using Next.js Image)

### 5. Backup Strategy
- [ ] Configure Supabase automatic backups
- [ ] Document database restore procedure
- [ ] Test backup restoration process

---

## 🔍 Testing Checklist

### User Flows
- [ ] **Registration**:
  - Provider registration creates account + default business hours
  - Customer registration works
  - Email validation works
  - Rate limiting prevents spam

- [ ] **Login**:
  - Email/password login works
  - JWT token generated correctly
  - Token expires after 7 days
  - Rate limiting prevents brute force

- [ ] **Service Management**:
  - Create service with capacity settings
  - Edit service
  - Toggle active/inactive
  - Delete service (only if no bookings)
  - Copy booking link works

- [ ] **Staff Management**:
  - Add staff member
  - Edit staff details
  - Toggle active/inactive
  - Delete staff (only if no active bookings)
  - Staff member counts show correctly

- [ ] **Booking Flow**:
  - Customer selects service
  - Calendar shows correct availability
  - Customer fills booking form
  - Payment processed (Stripe/Vipps/Cash)
  - Confirmation email sent with staff name
  - Booking appears in provider dashboard

- [ ] **Business Hours**:
  - Default hours created on registration
  - Edit business hours
  - Close specific days
  - Availability respects business hours

- [ ] **Calendar**:
  - Shows all bookings
  - Color-coded by status
  - Staff name displayed
  - Can filter by status

### Security Testing
- [ ] Cannot access other provider's data
- [ ] Cannot modify bookings without auth
- [ ] Rate limiting triggers correctly
- [ ] Webhook signature verification works
- [ ] CORS only allows configured origins
- [ ] SQL injection prevention (Prisma handles this)
- [ ] XSS prevention (React handles this)

---

## 📊 Known Limitations & Future Improvements

### Current State
✅ **Fully Functional**:
- Multi-staff scheduling with auto-assignment
- Capacity management (max concurrent bookings)
- Payment processing (Stripe confirmed, Vipps needs webhook)
- Email notifications with staff names
- Rate limiting on auth endpoints
- Security headers and CORS
- Webhook payment confirmations

### Missing Features (Not Critical for Launch)
1. **Google Calendar Integration** - User requested but not implemented
2. **Google OAuth Login** - User requested but not implemented
3. **Vipps Webhook Handler** - Similar to Stripe, needs webhook endpoint
4. **Redis-based Rate Limiting** - Current uses in-memory (works for single instance)
5. **SMS Notifications** - Twilio configured but not implemented
6. **Staff Assignment UI** - Can assign "any staff" but not specific staff members
7. **24-Hour Reminder Emails** - Function exists but not scheduled (needs cron job)

### Recommended Additions Before Scale
1. **Redis** for rate limiting and session management
2. **Monitoring** (Sentry, DataDog, or similar)
3. **Analytics** (PostHog, Mixpanel)
4. **Load balancer** if expecting high traffic
5. **CDN** (Vercel Edge, Cloudflare)

---

## 🚀 Deployment Steps

### 1. Pre-Deployment
```bash
# Update dependencies
npm update

# Run type check
npm run build

# Run database migrations on production
npx prisma migrate deploy
```

### 2. Vercel Deployment (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel Dashboard
# - JWT_SECRET
# - NEXTAUTH_SECRET
# - DATABASE_URL
# - STRIPE_SECRET_KEY
# - STRIPE_WEBHOOK_SECRET
# - SENDGRID_API_KEY
# - APP_URL
# - NODE_ENV=production
```

### 3. Post-Deployment
1. Verify site loads correctly
2. Test registration flow
3. Test booking creation
4. Send test payment to verify webhook
5. Check that emails are sent
6. Monitor error logs for first 24 hours

---

## 📞 Production Support Checklist

### Monitoring
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure alerts for errors (Sentry)
- [ ] Monitor webhook delivery (Stripe Dashboard)
- [ ] Track email delivery rates (SendGrid Dashboard)

### Documentation
- [ ] Document common user issues
- [ ] Create admin troubleshooting guide
- [ ] Document database backup/restore process
- [ ] Create runbook for common errors

### Maintenance
- [ ] Schedule regular dependency updates
- [ ] Plan for database backup testing
- [ ] Monitor disk space usage
- [ ] Review and rotate API keys quarterly

---

## ✅ Final Sign-Off

Before launching, confirm:
- [ ] All CRITICAL items completed
- [ ] Environment variables set correctly
- [ ] Stripe webhooks configured
- [ ] Email sending works
- [ ] Test booking completed successfully
- [ ] Error monitoring configured
- [ ] Backup strategy in place
- [ ] Team trained on support procedures

---

## 🐛 Troubleshooting Common Issues

### Issue: Webhook not receiving events
**Solution**:
1. Check Stripe Dashboard → Webhooks → [Your Endpoint]
2. Verify endpoint URL is correct: `https://yourdomain.com/api/webhooks/stripe`
3. Check webhook signing secret matches `.env`
4. Review webhook logs in Stripe Dashboard

### Issue: Emails not sending
**Solution**:
1. Verify `SENDGRID_API_KEY` is correct
2. Check sender email is verified in SendGrid
3. Review SendGrid Activity Feed
4. Check spam folder

### Issue: JWT errors
**Solution**:
1. Verify `JWT_SECRET` is set and matches across all instances
2. Check token hasn't expired (7 days default)
3. Clear localStorage and re-login

### Issue: Calendar showing all days unavailable
**Solution**:
1. Check provider has business hours set
2. Verify at least one staff member is active
3. Check service has correct capacity settings
4. Review availability.ts logs for errors

---

## 📧 Contact & Support

**Developer**: Claude (AI Assistant)
**Documentation Date**: 2025-10-19
**Platform Version**: 1.0.0
**Next.js Version**: 15.5.6

**Critical Files**:
- Authentication: `lib/auth/jwt.ts`, `lib/auth/middleware.ts`
- Payment Webhooks: `app/api/webhooks/stripe/route.ts`
- Security: `middleware.ts`, `lib/utils/rate-limit.ts`
- Availability: `lib/utils/availability.ts`
- Emails: `lib/email/sendgrid.ts`
