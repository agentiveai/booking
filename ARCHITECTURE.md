# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                              │
│  ┌────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  Landing   │  │   Booking    │  │   Dashboard        │  │
│  │   Page     │  │     Flow     │  │   (Provider)       │  │
│  │            │  │              │  │                    │  │
│  │ Next.js 14 │  │  React +     │  │   React +          │  │
│  │ Tailwind   │  │  TypeScript  │  │   TypeScript       │  │
│  └────────────┘  └──────────────┘  └────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Next.js API Routes (Node.js)              │    │
│  │                                                      │    │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────────┐   │    │
│  │  │   Auth   │  │ Bookings │  │    Services    │   │    │
│  │  │  /login  │  │ /create  │  │    /list       │   │    │
│  │  │/register │  │/available│  │    /create     │   │    │
│  │  └──────────┘  └──────────┘  └────────────────┘   │    │
│  │                                                      │    │
│  │  Authentication Middleware (JWT)                    │    │
│  │  Input Validation (Zod)                            │    │
│  │  Error Handling                                     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌───────────────┐   ┌──────────────┐
│   DATABASE   │   │   PAYMENTS    │   │  MESSAGING   │
│              │   │               │   │              │
│  PostgreSQL  │   │  ┌─────────┐  │   │ ┌──────────┐ │
│   (Prisma)   │   │  │ Stripe  │  │   │ │SendGrid  │ │
│              │   │  │  API    │  │   │ │  Email   │ │
│  10 Models   │   │  └─────────┘  │   │ └──────────┘ │
│  Indexed     │   │               │   │              │
│  Relations   │   │  ┌─────────┐  │   │ ┌──────────┐ │
│              │   │  │  Vipps  │  │   │ │  Twilio  │ │
│              │   │  │  API    │  │   │ │   SMS    │ │
│              │   │  └─────────┘  │   │ └──────────┘ │
└──────────────┘   └───────────────┘   └──────────────┘
```

## Data Flow: Booking Creation

```
┌────────────┐
│  Customer  │
│   (Web)    │
└─────┬──────┘
      │ 1. Visits /booking/[providerId]
      ▼
┌─────────────────┐
│ Booking Page UI │  2. Loads services
│  (React)        │  3. Checks availability
└─────┬───────────┘  4. Fills form
      │ 5. Submits booking
      ▼
┌──────────────────────────────────────┐
│  POST /api/bookings/create           │
│                                      │
│  1. Validate input (Zod)            │
│  2. Check availability               │
│  3. Start database transaction       │
│  4. Check slot still available       │
│  5. Create booking record            │
│  6. Create payment intent            │
│     (Stripe or Vipps)                │
│  7. Commit transaction               │
│  8. Send confirmation email          │
│  9. Return booking + payment data    │
└─────┬────────────────────────────────┘
      │
      ├─────────────────┬─────────────────┬──────────────┐
      ▼                 ▼                 ▼              ▼
┌──────────┐    ┌──────────────┐  ┌──────────┐  ┌──────────┐
│ Database │    │   Stripe     │  │  Vipps   │  │SendGrid  │
│          │    │  (if card)   │  │(if Vipps)│  │  Email   │
│ Booking  │    │              │  │          │  │          │
│ Payment  │    │ Payment      │  │ Payment  │  │Confirma- │
│ Created  │    │ Intent       │  │ Created  │  │tion sent │
└──────────┘    └──────────────┘  └──────────┘  └──────────┘
```

## Database Schema (ERD)

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│    User     │         │   Service    │         │  Booking    │
├─────────────┤         ├──────────────┤         ├─────────────┤
│ id          │────┐    │ id           │         │ id          │
│ email       │    │    │ providerId   │◄────┐   │ customerId  │───┐
│ password    │    │    │ name         │     │   │ providerId  │   │
│ name        │    │    │ nameNo       │     │   │ serviceId   │───┼──┐
│ phone       │    │    │ duration     │     │   │ startTime   │   │  │
│ role        │    │    │ price        │     │   │ endTime     │   │  │
│ businessName│    │    │ bufferBefore │     │   │ status      │   │  │
│ timezone    │    │    │ bufferAfter  │     │   │ totalAmount │   │  │
│ language    │    │    │ isActive     │     │   │ paymentMeth │   │  │
└─────────────┘    │    └──────────────┘     │   └─────────────┘   │  │
                   │                         │                     │  │
                   │    ┌──────────────┐     │                     │  │
                   └───►│BusinessHours │     │                     │  │
                        ├──────────────┤     │                     │  │
                        │ id           │     │                     │  │
                        │ providerId   │─────┘                     │  │
                        │ dayOfWeek    │                           │  │
                        │ openTime     │                           │  │
                        │ closeTime    │                           │  │
                        │ isOpen       │                           │  │
                        └──────────────┘                           │  │
                                                                   │  │
┌─────────────┐         ┌──────────────┐                          │  │
│  Payment    │◄────────│Cancellation  │                          │  │
├─────────────┤         │   Policy     │                          │  │
│ id          │         ├──────────────┤                          │  │
│ bookingId   │◄────────┤ id           │                          │  │
│ amount      │    │    │ name         │                          │  │
│ method      │    │    │ nameNo       │                          │  │
│ status      │    │    │fullRefundHrs │                          │  │
│stripePayment│    │    │partialRefund%│                          │  │
│vippsOrderId │    │    │ noShowFee    │                          │  │
└─────────────┘    │    └──────────────┘                          │  │
                   │                                               │  │
                   │    ┌──────────────┐                          │  │
                   └────│Notification  │                          │  │
                        ├──────────────┤                          │  │
                        │ id           │                          │  │
                        │ bookingId    │──────────────────────────┘  │
                        │ recipientId  │─────────────────────────────┘
                        │ type         │
                        │ channel      │
                        │ content      │
                        │ status       │
                        │ sentAt       │
                        └──────────────┘
```

## API Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    API ROUTES                           │
│                                                         │
│  /api/auth/                                            │
│    ├── register     (POST)   - Create new user        │
│    ├── login        (POST)   - Authenticate user      │
│    └── me           (GET)    - Get current user       │
│                                                         │
│  /api/services/                                        │
│    ├── GET          - List services (query: providerId)│
│    └── POST         - Create service (protected)       │
│                                                         │
│  /api/bookings/                                        │
│    ├── availability (GET)    - Check available slots  │
│    ├── create       (POST)   - Create booking         │
│    ├── [id]         (GET)    - Get booking details    │
│    └── [id]         (DELETE) - Cancel booking         │
│                                                         │
│  /api/webhooks/                                        │
│    ├── stripe       (POST)   - Stripe webhook         │
│    └── vipps        (POST)   - Vipps webhook          │
│                                                         │
└─────────────────────────────────────────────────────────┘

Middleware Stack:
┌─────────────────────────────────────────────────────────┐
│ Request                                                 │
│   ↓                                                     │
│ CORS Headers                                           │
│   ↓                                                     │
│ Body Parser (JSON)                                     │
│   ↓                                                     │
│ Authentication (JWT) - if protected route              │
│   ↓                                                     │
│ Authorization (Role Check) - if required               │
│   ↓                                                     │
│ Input Validation (Zod)                                 │
│   ↓                                                     │
│ Route Handler                                          │
│   ↓                                                     │
│ Error Handler                                          │
│   ↓                                                     │
│ Response (JSON)                                        │
└─────────────────────────────────────────────────────────┘
```

## Payment Flow Architecture

### Stripe Flow

```
Customer     Frontend      API Server      Stripe API    Database
   │             │              │              │            │
   │ Select Card │              │              │            │
   ├────────────►│              │              │            │
   │             │ Create       │              │            │
   │             │ Payment      │              │            │
   │             ├─────────────►│              │            │
   │             │              │ Create       │            │
   │             │              │ Payment      │            │
   │             │              │ Intent       │            │
   │             │              ├─────────────►│            │
   │             │              │              │            │
   │             │              │ Client       │            │
   │             │              │ Secret       │            │
   │             │              │◄─────────────┤            │
   │             │              │              │            │
   │             │              │ Save         │            │
   │             │              │ Payment      │            │
   │             │              ├──────────────────────────►│
   │             │              │              │            │
   │             │ Return       │              │            │
   │             │ Secret       │              │            │
   │             │◄─────────────┤              │            │
   │             │              │              │            │
   │ Confirm     │              │              │            │
   │ Payment     │              │              │            │
   ├────────────►│──────────────┼─────────────►│            │
   │             │              │              │            │
   │             │              │ Webhook      │            │
   │             │              │ (success)    │            │
   │             │              │◄─────────────┤            │
   │             │              │              │            │
   │             │              │ Update       │            │
   │             │              │ Status       │            │
   │             │              ├──────────────────────────►│
   │             │              │              │            │
   │ Redirect    │              │              │            │
   │ Success     │              │              │            │
   │◄────────────┤              │              │            │
```

### Vipps Flow

```
Customer     Frontend      API Server      Vipps API     Database
   │             │              │              │            │
   │ Select      │              │              │            │
   │ Vipps       │              │              │            │
   ├────────────►│              │              │            │
   │             │ Create       │              │            │
   │             │ Payment      │              │            │
   │             ├─────────────►│              │            │
   │             │              │ Get          │            │
   │             │              │ Token        │            │
   │             │              ├─────────────►│            │
   │             │              │◄─────────────┤            │
   │             │              │              │            │
   │             │              │ Create       │            │
   │             │              │ Payment      │            │
   │             │              ├─────────────►│            │
   │             │              │              │            │
   │             │              │ Redirect     │            │
   │             │              │ URL          │            │
   │             │              │◄─────────────┤            │
   │             │              │              │            │
   │             │              │ Save         │            │
   │             │              │ Payment      │            │
   │             │              ├──────────────────────────►│
   │             │              │              │            │
   │             │ Return       │              │            │
   │             │ Redirect     │              │            │
   │             │◄─────────────┤              │            │
   │             │              │              │            │
   │ Open Vipps  │              │              │            │
   │ App         │──────────────┼─────────────►│            │
   │             │              │              │            │
   │ Confirm in  │              │              │            │
   │ App         │──────────────┼─────────────►│            │
   │             │              │              │            │
   │             │              │ Webhook      │            │
   │             │              │ Callback     │            │
   │             │              │◄─────────────┤            │
   │             │              │              │            │
   │             │              │ Update       │            │
   │             │              │ Status       │            │
   │             │              ├──────────────────────────►│
   │             │              │              │            │
   │ Return      │              │              │            │
   │ to Site     │              │              │            │
   │◄────────────┼─────────────►│              │            │
```

## Availability Calculation Algorithm

```
Input: providerId, serviceId, date, timezone

Step 1: Get Business Hours
   └─> Query BusinessHours table for day of week
   └─> If not open, return empty array

Step 2: Get Service Details
   └─> Query Service table
   └─> Get duration, buffer before, buffer after

Step 3: Get Existing Bookings
   └─> Query Booking table for date range
   └─> Status NOT IN (CANCELLED, NO_SHOW)
   └─> Convert times to provider timezone

Step 4: Get Blocked Times
   └─> Query Availability table
   └─> isAvailable = false

Step 5: Generate Time Slots
   └─> Start at business open time
   └─> Create slots every [service duration] minutes
   └─> For each slot:
       ├─> Check if within business hours
       ├─> Check for booking conflicts (with buffers)
       ├─> Check for blocked times
       └─> Mark as available/unavailable

Step 6: Return Available Slots
   └─> Filter to available only
   └─> Convert times to UTC
   └─> Return array of {start, end} objects
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  SECURITY LAYERS                        │
│                                                         │
│  Layer 1: Transport Security                           │
│    └─> HTTPS/TLS encryption                            │
│    └─> Secure headers (CSP, HSTS)                      │
│                                                         │
│  Layer 2: Authentication                               │
│    └─> JWT tokens (7-day expiry)                       │
│    └─> Password hashing (bcrypt, 12 rounds)            │
│    └─> Token verification on protected routes          │
│                                                         │
│  Layer 3: Authorization                                │
│    └─> Role-based access control (RBAC)                │
│    └─> Resource ownership validation                   │
│    └─> Provider-only routes                            │
│                                                         │
│  Layer 4: Input Validation                             │
│    └─> Zod schema validation                           │
│    └─> Type checking (TypeScript)                      │
│    └─> SQL injection prevention (Prisma)               │
│                                                         │
│  Layer 5: Data Protection                              │
│    └─> Environment variables for secrets               │
│    └─> Payment credentials encrypted                   │
│    └─> Database connection pooling                     │
│                                                         │
│  Layer 6: Rate Limiting (TODO)                         │
│    └─> Per-IP rate limits                              │
│    └─> Per-user rate limits                            │
│    └─> Brute-force protection                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌────────────────────────────────────────────────────────┐
│                    PRODUCTION                          │
│                                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │         Vercel Edge Network (CDN)            │    │
│  │  ┌────────────────────────────────────────┐  │    │
│  │  │    Next.js App (Multiple Regions)      │  │    │
│  │  │  - Serverless Functions               │  │    │
│  │  │  - Static Assets                      │  │    │
│  │  │  - API Routes                         │  │    │
│  │  └────────────────────────────────────────┘  │    │
│  └──────────────────────────────────────────────┘    │
│                       │                               │
│                       │                               │
│           ┌───────────┼────────────┐                  │
│           │           │            │                  │
│           ▼           ▼            ▼                  │
│   ┌──────────┐ ┌───────────┐ ┌──────────┐           │
│   │ Database │ │  Stripe   │ │SendGrid  │           │
│   │          │ │           │ │          │           │
│   │Supabase  │ │  API      │ │  API     │           │
│   │PostgreSQL│ │           │ │          │           │
│   │          │ │           │ │          │           │
│   │Multi-AZ  │ │Webhooks   │ │Templates │           │
│   │Backups   │ │          │ │          │           │
│   └──────────┘ └───────────┘ └──────────┘           │
│                                                        │
│   ┌──────────┐ ┌───────────┐ ┌──────────┐           │
│   │  Vipps   │ │  Redis    │ │  Sentry  │           │
│   │  API     │ │  Cache    │ │  Monitor │           │
│   │          │ │ (optional)│ │          │           │
│   │Production│ │           │ │Error     │           │
│   │Merchant  │ │In-memory  │ │Tracking  │           │
│   └──────────┘ └───────────┘ └──────────┘           │
└────────────────────────────────────────────────────────┘
```

## Technology Stack Summary

```
Frontend:
├── Next.js 14 (App Router)
├── React 19
├── TypeScript 5
├── Tailwind CSS 4
└── React Hook Form

Backend:
├── Next.js API Routes
├── Node.js
├── Prisma ORM
├── PostgreSQL
└── JWT Authentication

External Services:
├── Stripe (Payments)
├── Vipps (Norwegian Payments)
├── SendGrid (Email)
├── Twilio (SMS - optional)
└── Google Calendar API (pending)

DevOps:
├── Vercel (Hosting)
├── GitHub (Version Control)
├── Supabase (Database Hosting)
└── Sentry (Monitoring - pending)
```

## Performance Characteristics

```
Target Performance Metrics:
├── Page Load Time: < 2.5s
├── API Response Time: < 500ms
├── Database Query Time: < 100ms
├── Availability Check: < 1s
├── Payment Processing: < 3s
└── Email Delivery: < 5s (async)

Optimization Strategies:
├── Code Splitting (Next.js automatic)
├── Image Optimization (next/image)
├── Database Indexing (on all queries)
├── Connection Pooling (Prisma)
├── API Route Caching (planned)
├── CDN for Static Assets (Vercel)
└── Redis Caching (Phase 2)
```

---

Last Updated: January 19, 2025
