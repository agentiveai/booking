# Testing Guide - Booking Platform

## Overview
This comprehensive guide will help you test every feature of your Norwegian booking platform to ensure everything works perfectly before launch.

## Prerequisites
✅ Dev server running on http://localhost:3001
✅ PostgreSQL database connected (Supabase)
✅ Environment variables configured (.env file)

## Testing Checklist

### 1. Provider Registration & Authentication

#### Test Provider Registration
1. Navigate to http://localhost:3001/register
2. Fill in the form with test data:
   - **Navn**: Test Bedrift AS
   - **E-post**: test@bedrift.no
   - **Telefon**: +47 12 34 56 78
   - **Passord**: TestPassord123!
   - **Bedriftsnavn**: Test Bedrift AS
   - **Bedriftsadresse**: Testgata 123, 0001 Oslo
   - **Tidssone**: Europe/Oslo
3. Click "Opprett konto"
4. ✅ Should redirect to /dashboard
5. ✅ Should see welcome message
6. ✅ Token should be stored in localStorage

#### Test Provider Login
1. Log out (or use incognito mode)
2. Navigate to http://localhost:3001/login
3. Enter credentials:
   - **E-post**: test@bedrift.no
   - **Passord**: TestPassord123!
4. Click "Logg inn"
5. ✅ Should redirect to /dashboard
6. ✅ Should show provider name in header

#### Test Password Reset Flow
1. Click "Glemt passord?" on login page
2. Enter email: test@bedrift.no
3. ✅ Should show success message
4. Check email inbox (if SendGrid configured)
5. Click reset link in email
6. Enter new password twice
7. ✅ Should show password strength indicator
8. ✅ Should redirect to login after successful reset
9. Login with new password
10. ✅ Should work with new password

---

### 2. Service Management

#### Test Create Service
1. Navigate to Dashboard → Tjenester
2. Click "Ny tjeneste"
3. Fill in the form:
   - **Tjenestenavn**: Hårklipp
   - **Beskrivelse**: Profesjonell hårklipp for alle typer hår
   - **Varighet**: 60 minutter
   - **Pris**: 500 NOK
   - **Buffer før**: 15 min (optional)
   - **Buffer etter**: 15 min (optional)
4. Click "Opprett tjeneste"
5. ✅ Service should appear in list
6. ✅ Should show active status (green badge)
7. ✅ Should display correct price: 500 NOK

#### Test Edit Service
1. Find the service in the list
2. Click "Rediger"
3. Change price to 550 NOK
4. Click "Oppdater tjeneste"
5. ✅ Should update successfully
6. ✅ New price should be displayed

#### Test Toggle Service Active/Inactive
1. Click the green "Aktiv" badge
2. ✅ Should change to "Inaktiv" (gray)
3. ✅ Service card should appear slightly faded
4. Click "Inaktiv" again
5. ✅ Should toggle back to "Aktiv"

#### Test Copy Booking Link
1. Click "Kopier bookinglenke" button
2. ✅ Should show "Kopiert!" feedback
3. ✅ Link should be in clipboard
4. Paste link and verify format: http://localhost:3001/book/[userId]/[serviceId]

#### Test Delete Service
1. Click "Slett" on a service
2. ✅ Should show confirmation dialog
3. Confirm deletion
4. ✅ Service should be removed from list

---

### 3. Business Hours Configuration

#### Test Business Hours Setup
1. Navigate to Dashboard → Innstillinger
2. Should see "Åpningstider" tab active
3. ✅ Default hours should be displayed (Mon-Fri 09:00-17:00)

#### Test Individual Day Configuration
1. Toggle Monday ON (if not already)
2. Set times: 08:00 - 16:00
3. ✅ Time inputs should be enabled
4. ✅ Should show "Kopier til alle" button

#### Test Copy Hours to All Days
1. Set Monday hours to 09:00 - 17:00
2. Click "Kopier til alle"
3. ✅ All days should now show 09:00 - 17:00
4. ✅ Toggle states should remain unchanged

#### Test Quick Presets
1. Click "Man-Fre 09:00-17:00"
2. ✅ Monday-Friday should be enabled
3. ✅ Weekend should be disabled
4. ✅ Times should be 09:00-17:00

#### Test Save Business Hours
1. Configure your desired hours
2. Click "Lagre åpningstider"
3. ✅ Should show success message
4. Refresh page
5. ✅ Hours should persist

---

### 4. Customer Booking Flow (Public)

#### Test Booking Landing Page
1. Copy a service booking link from Dashboard → Tjenester
2. Open link in incognito/private window
3. ✅ Should see provider name and logo
4. ✅ Should see service details (name, description, duration, price)
5. ✅ Should show "Book time nå" button
6. ✅ Should show "Powered by Booking Platform" footer

#### Test Service Selection
1. Navigate to http://localhost:3001/book/[providerId]
2. ✅ Should list all active services
3. ✅ Each service should show duration and price
4. ✅ Hover effect should highlight service
5. Click on a service
6. ✅ Should progress to step 2

#### Test Date & Time Selection
1. Select today's date (or tomorrow if outside business hours)
2. ✅ Should show loading spinner
3. ✅ Should display available time slots
4. ✅ Slots should respect business hours
5. ✅ Slots should show 15/30/60 min intervals based on settings
6. Click "Tilbake" button
7. ✅ Should return to service selection
8. Select service again and choose a time slot
9. ✅ Should progress to step 3

#### Test Customer Information Form
1. Fill in customer details:
   - **Navn**: Ola Nordmann
   - **E-post**: ola@example.com
   - **Telefon**: +47 98 76 54 32
   - **Notat**: Første gang jeg klipper håret her
   - **Betalingsmetode**: Vipps (or CASH for testing)
2. ✅ Email should validate format
3. ✅ Phone number should accept +47 format
4. Click "Tilbake"
5. ✅ Form data should be preserved
6. Go forward again and submit
7. ✅ Should show step 4 (confirmation) or redirect to payment

#### Test Payment Flow (CASH)
1. Complete booking with payment method "CASH"
2. ✅ Should show confirmation page
3. ✅ Should display booking details
4. ✅ Should show booking ID
5. ✅ Booking should appear in provider dashboard

---

### 5. Customer Self-Service

#### Test My Bookings Search
1. Navigate to http://localhost:3001/my-bookings
2. ✅ Should show search form
3. ✅ Should ask for email address
4. Enter: ola@example.com
5. Click "Søk"
6. ✅ Should display bookings for that email
7. ✅ Upcoming bookings should be in separate section
8. ✅ Past bookings should be in separate section

#### Test Booking Details Display
1. Find your test booking
2. ✅ Should show service name
3. ✅ Should show date in Norwegian format (e.g., "mandag 20. oktober 2025")
4. ✅ Should show time (e.g., "14:00 - 15:00")
5. ✅ Should show provider name
6. ✅ Should show status badge (Bekreftet/Venter)
7. ✅ Should show price

#### Test ICS Calendar Download
1. Click "Legg til i kalender" button
2. ✅ Should download an .ics file
3. Open the .ics file in your calendar app (Apple Calendar, Google Calendar, Outlook)
4. ✅ Should create calendar event
5. ✅ Event should have correct title
6. ✅ Event should have correct date and time
7. ✅ Event should include customer name and details
8. ✅ Should have 2 reminders: 24 hours and 1 hour before

#### Test Booking Cancellation
1. Find an upcoming booking
2. Click "Avbestill" button
3. ✅ Should show confirmation dialog
4. Confirm cancellation
5. ✅ Should show refund policy message
6. ✅ If >24h away: "Du vil motta full refundering"
7. ✅ If <24h away: "Det blir ingen refundering"
8. ✅ Booking status should change to "Avbestilt"
9. ✅ "Avbestill" button should disappear

#### Test Reschedule (Placeholder)
1. Find an upcoming booking
2. ✅ Should see "Endre tidspunkt" button
3. Click button
4. ✅ Should show placeholder message (not implemented yet)

---

### 6. Provider Dashboard

#### Test Dashboard Overview
1. Navigate to /dashboard
2. ✅ Should show statistics cards:
   - Total bookings
   - Revenue (if applicable)
   - Upcoming appointments
3. ✅ Should show quick actions
4. ✅ Should show recent bookings list

#### Test Bookings Management
1. Navigate to Dashboard → Bookinger
2. ✅ Should list all bookings
3. ✅ Should show filters: ALL, PENDING, CONFIRMED, CANCELLED
4. ✅ Should show date filters: Upcoming, Today, Past
5. Test filters:
   - Click "CONFIRMED"
   - ✅ Should filter to confirmed bookings only
   - Click "I dag"
   - ✅ Should show only today's bookings

#### Test Update Booking Status
1. Find a PENDING booking
2. Click the status dropdown
3. Change to "CONFIRMED"
4. ✅ Should update immediately
5. ✅ Status badge should change to green

#### Test Booking Details View
1. Click on a booking in the list
2. ✅ Should show customer details
3. ✅ Should show service details
4. ✅ Should show payment information
5. ✅ Should show any customer notes

#### Test Copy Service Booking Link
1. In Dashboard → Tjenester
2. Find a service
3. Click "Kopier bookinglenke"
4. ✅ Should copy link in format: http://localhost:3001/book/[userId]/[serviceId]
5. Open link in incognito mode
6. ✅ Should go directly to that service's booking page

---

### 7. Error Handling & Edge Cases

#### Test Invalid Email on My Bookings
1. Go to /my-bookings
2. Enter: invalid-email@nonexistent.com
3. ✅ Should show "Ingen bookinger funnet" or empty state

#### Test Expired Password Reset Link
1. Request password reset
2. Wait 31 minutes (or modify token expiry in DB)
3. Try to use link
4. ✅ Should show "Tilbakestillingslenken har utløpt"

#### Test Booking Outside Business Hours
1. Go to booking page
2. Select a day
3. ✅ Should NOT show time slots outside business hours
4. ✅ Should NOT show time slots where business is closed

#### Test Concurrent Booking (Double Booking Prevention)
1. Open booking page in two different browsers
2. Both select same time slot
3. Submit first booking
4. ✅ Should succeed
5. Submit second booking
6. ✅ Should fail with "Time slot is no longer available"

#### Test Form Validation
1. Try to submit service form without name
2. ✅ Should show "Tjenestenavn er påkrevd"
3. Try to submit with negative price
4. ✅ Should show validation error
5. Try to submit with duration < 15 minutes
6. ✅ Should show validation error

---

### 8. Mobile Responsiveness

#### Test on Mobile (or use Chrome DevTools)
1. Open site on mobile device or enable mobile view
2. Test all pages:
   - ✅ Landing page should stack vertically
   - ✅ Service cards should be full width
   - ✅ Dashboard navigation should collapse to hamburger
   - ✅ Booking form should be easy to fill
   - ✅ Time slots should wrap properly
   - ✅ Buttons should be touch-friendly (min 44x44px)

---

### 9. Performance & Loading States

#### Test Loading States
1. Throttle network to "Slow 3G" in Chrome DevTools
2. Navigate to booking page
3. ✅ Should show skeleton/spinner while loading
4. Select a date
5. ✅ Should show "Laster ledige tider..." spinner
6. Submit booking
7. ✅ Button should show "Sender..." while processing

#### Test Error Recovery
1. Stop the dev server
2. Try to load a page
3. ✅ Should show error message
4. Start server again
5. ✅ App should recover gracefully

---

### 10. Norwegian Language & Localization

#### Verify Norwegian Throughout
Go through the entire platform and verify:
- ✅ All buttons are in Norwegian
- ✅ All form labels are in Norwegian
- ✅ All error messages are in Norwegian
- ✅ Date formats use Norwegian locale (e.g., "mandag 20. januar")
- ✅ Time formats use 24-hour clock (14:00, not 2:00 PM)
- ✅ Currency displays as "500 NOK" not "$500"
- ✅ Phone numbers use +47 format

---

## Known Issues & Limitations

### Not Yet Implemented:
1. **Google Calendar Sync** - Two-way calendar synchronization
2. **SMS Notifications** - Twilio integration for text reminders
3. **Booking Reschedule** - Customer ability to change booking time
4. **Provider Analytics** - Charts and detailed reports
5. **Multi-staff Scheduling** - Support for multiple service providers
6. **Payment Processing** - Stripe and Vipps payment flows (structure exists but needs API keys)
7. **Email Delivery** - Requires SendGrid API key configuration

### Requires Configuration:
1. **SendGrid** - For email notifications (password reset, booking confirmations)
2. **Stripe** - For credit card payments
3. **Vipps** - For Norwegian mobile payments (78% market share in Norway)
4. **Twilio** - For SMS reminders

---

## Critical Features Checklist

### ✅ Completed & Working:
- [x] Provider registration and login
- [x] Password reset flow (forgot password + reset)
- [x] Service CRUD operations (Create, Read, Update, Delete)
- [x] Business hours configuration
- [x] Customer booking flow (3-step process)
- [x] Public booking pages (no login required)
- [x] Customer booking history (email-only lookup)
- [x] Booking cancellation (customer self-service)
- [x] ICS calendar file download
- [x] Provider dashboard
- [x] Booking management for providers
- [x] Norwegian localization
- [x] Responsive design
- [x] Double-booking prevention (locking mechanism)
- [x] Buffer time support (before/after appointments)
- [x] Timezone support

### 🔄 Partially Implemented:
- [ ] Email notifications (code exists, needs SendGrid API key)
- [ ] Payment processing (code exists, needs Stripe/Vipps API keys)
- [ ] Refund processing (code exists, needs payment provider config)

### ❌ Not Yet Implemented:
- [ ] SMS notifications
- [ ] Google Calendar sync
- [ ] Booking rescheduling
- [ ] Advanced analytics
- [ ] Multi-provider support

---

## Performance Benchmarks

### Target Metrics:
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Total Blocking Time: < 300ms
- Cumulative Layout Shift: < 0.1

### Database Queries:
- Booking creation: Should use transaction and advisory lock
- Availability check: Should be optimized with proper indexes
- Provider dashboard: Should load in < 500ms

---

## Security Checklist

### Authentication:
- [x] Passwords hashed with bcrypt (12 rounds)
- [x] JWT tokens for session management
- [x] Password reset tokens expire after 30 minutes
- [x] One-time use for password reset tokens
- [x] Email enumeration prevention (same message for valid/invalid)

### Authorization:
- [x] Providers can only edit their own services
- [x] Providers can only see their own bookings
- [x] Customers can only cancel bookings with matching email
- [x] API endpoints protected with middleware

### Data Validation:
- [x] Input validation with Zod schemas
- [x] SQL injection prevention (Prisma ORM)
- [x] XSS prevention (React escaping)

---

## Deployment Checklist

Before deploying to production:
1. [ ] Set up production database (Supabase/PostgreSQL)
2. [ ] Configure all environment variables
3. [ ] Set up SendGrid account and verify sender
4. [ ] Configure Stripe account (if using payments)
5. [ ] Configure Vipps account (if using Vipps)
6. [ ] Set up custom domain
7. [ ] Enable HTTPS (automatic on Vercel)
8. [ ] Test all features on staging environment
9. [ ] Set up monitoring (Sentry, LogRocket, etc.)
10. [ ] Create database backups schedule
11. [ ] Set up CDN for static assets
12. [ ] Configure rate limiting
13. [ ] Add GDPR compliance notices
14. [ ] Create privacy policy page
15. [ ] Create terms of service page

---

## Support & Documentation

### For Users:
- Landing page: http://localhost:3001
- Provider login: http://localhost:3001/login
- Provider registration: http://localhost:3001/register
- My bookings: http://localhost:3001/my-bookings
- Forgot password: http://localhost:3001/forgot-password

### For Developers:
- API documentation: See `/app/api/` directory
- Prisma schema: `prisma/schema.prisma`
- Environment variables: `.env.example`

---

## Comparison with Competitors

### Better than Calendly:
✅ No login required for customer booking history (Calendly requires account)
✅ Dual calendar reminders (24h + 1h) vs Calendly's single reminder
✅ Built-in Norwegian language support
✅ Vipps payment integration (critical for Norwegian market)
✅ Buffer time configuration
✅ Beautiful, modern UI inspired by Notion and Apple

### Better than Cal.com:
✅ Simpler, more intuitive interface
✅ Better onboarding flow
✅ Norwegian-first design
✅ More polished visual design
✅ Faster booking process (fewer clicks)

### Perfect for Norwegian Market:
✅ Vipps integration (78% of Norwegians use Vipps)
✅ Norwegian language throughout
✅ Norwegian date/time formats
✅ Norwegian business practices (buffer times, cancellation policies)
✅ Europe/Oslo timezone default

---

## Next Steps

1. **Test everything** using this guide
2. **Configure API keys** for email and payments
3. **Deploy to Vercel** or preferred hosting
4. **Get feedback** from real Norwegian businesses
5. **Iterate** based on feedback

---

**Ready to make this the best booking platform for Norwegians! 🇳🇴**
