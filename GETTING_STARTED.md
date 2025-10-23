# Getting Started - Quick Setup Guide

Follow these steps to get the Norwegian Booking Platform running on your local machine in under 10 minutes.

## Step 1: Prerequisites

Make sure you have installed:

- **Node.js 18+**: Download from [nodejs.org](https://nodejs.org)
- **PostgreSQL 14+**: Download from [postgresql.org](https://www.postgresql.org/download/)

Verify installations:

```bash
node --version  # Should be v18 or higher
npm --version   # Should be 8 or higher
psql --version  # Should be 14 or higher
```

## Step 2: Get the Code

If you haven't already:

```bash
cd booking-platform
npm install
```

This will install all dependencies (~1-2 minutes).

## Step 3: Set Up PostgreSQL Database

### Option A: Create Local Database

```bash
# Start PostgreSQL (if not running)
# macOS:
brew services start postgresql@14

# Linux:
sudo systemctl start postgresql

# Windows: Use pgAdmin or Services

# Create database
createdb booking_platform

# Verify
psql -l | grep booking_platform
```

### Option B: Use Cloud Database (Easier)

1. Go to [supabase.com](https://supabase.com)
2. Create free account
3. Create new project
4. Copy connection string from Settings → Database

## Step 4: Configure Environment Variables

```bash
# Copy example file
cp .env.example .env
```

Open `.env` and update:

### Minimum Required Configuration

```env
# Database (update with your credentials)
DATABASE_URL="postgresql://username:password@localhost:5432/booking_platform?schema=public"

# Generate secrets (run these commands):
# openssl rand -base64 32
NEXTAUTH_SECRET="paste-generated-secret-here"
JWT_SECRET="paste-another-generated-secret-here"

# App
NEXTAUTH_URL="http://localhost:3000"
APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### Optional But Recommended

For full functionality, also configure:

**Stripe** (for card payments):
```env
STRIPE_SECRET_KEY="sk_test_..." # Get from dashboard.stripe.com
STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

**SendGrid** (for emails):
```env
SENDGRID_API_KEY="SG..." # Get from app.sendgrid.com
SENDGRID_FROM_EMAIL="noreply@yourdomain.no"
```

**Vipps** (for Norwegian payments):
```env
VIPPS_CLIENT_ID="" # Apply at portal.vipps.no
VIPPS_CLIENT_SECRET=""
VIPPS_MERCHANT_SERIAL_NUMBER=""
VIPPS_SUBSCRIPTION_KEY=""
VIPPS_ENVIRONMENT="test"
```

## Step 5: Initialize Database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push
```

You should see:
```
✔ Generated Prisma Client
Your database is now in sync with your Prisma schema
```

## Step 6: Start Development Server

```bash
npm run dev
```

You should see:
```
  ▲ Next.js 15.5.6
  - Local:        http://localhost:3000
  - Turbopack (beta) enabled

 ✓ Ready in 2.1s
```

## Step 7: Open in Browser

Visit [http://localhost:3000](http://localhost:3000)

You should see the landing page! 🎉

## Step 8: Test the System

### Create a Provider Account

**Option 1: Using the UI** (when you build the registration page)

**Option 2: Using API directly**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.no",
    "password": "SecurePass123",
    "name": "Test Provider",
    "role": "PROVIDER",
    "businessName": "Test Salon"
  }'
```

Save the returned `token`.

### Create a Service

```bash
curl -X POST http://localhost:3000/api/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Haircut",
    "nameNo": "Hårklipp",
    "description": "Basic haircut",
    "descriptionNo": "Standard hårklipp",
    "duration": 60,
    "price": 500,
    "bufferTimeBefore": 5,
    "bufferTimeAfter": 5
  }'
```

### Create Business Hours

```bash
curl -X POST http://localhost:3000/api/business-hours \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "dayOfWeek": 1,
    "isOpen": true,
    "openTime": "09:00",
    "closeTime": "17:00"
  }'
```

Note: You'll need to create this endpoint first! It's on the Phase 2 list.

### Test Booking Flow

1. Get provider ID from the registration response
2. Visit `http://localhost:3000/booking/[PROVIDER_ID]`
3. You should see the booking interface!

## Common Issues & Solutions

### Issue: "Can't connect to database"

**Solution**:
```bash
# Check PostgreSQL is running
pg_isready

# If not running, start it:
brew services start postgresql@14  # macOS
sudo systemctl start postgresql   # Linux
```

### Issue: "Prisma Client not generated"

**Solution**:
```bash
npm run db:generate
```

### Issue: "Port 3000 already in use"

**Solution**:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- -p 3001
```

### Issue: "MODULE_NOT_FOUND"

**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Stripe/Vipps payments not working"

**Solution**: These are optional for initial testing. You can:
1. Use "CASH" as payment method
2. Set up test accounts later
3. Focus on the booking flow first

## Next Steps

Now that you're running locally:

1. ✅ **Explore the code** - Check out the project structure
2. ✅ **Review the database** - Run `npx prisma studio` to see data
3. ✅ **Test the API** - Use the curl commands above
4. ✅ **Build the dashboard** - Next major feature to implement
5. ✅ **Add Google Calendar sync** - High priority feature
6. ✅ **Test payment flows** - Set up Stripe/Vipps test accounts

## Development Tools

### Prisma Studio (Database GUI)

```bash
npx prisma studio
```

Opens at [http://localhost:5555](http://localhost:5555) - view and edit data visually!

### TypeScript Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:generate      # Generate Prisma Client
npm run db:push          # Push schema to database
npm run db:studio        # Open Prisma Studio

# Testing
npm run type-check       # Check TypeScript
npm run lint             # Lint code
```

## Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Stripe API Docs](https://stripe.com/docs/api)
- [Vipps Developer Docs](https://developer.vippsmobilepay.com/)

## Getting Help

If you're stuck:

1. Check [README.md](README.md) for detailed documentation
2. Check [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for architecture overview
3. Check [DEPLOYMENT.md](DEPLOYMENT.md) for production setup
4. Review error messages carefully
5. Check browser console for frontend errors
6. Check terminal for backend errors

## What to Build Next

Priority features to implement:

1. **Provider Dashboard** - Calendar view, booking management
2. **Google Calendar Sync** - Two-way synchronization
3. **Cancellation Flow** - Allow customers to cancel/reschedule
4. **SMS Notifications** - Twilio integration
5. **Analytics** - Revenue and booking metrics

See [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for full roadmap.

## Success!

If you've made it here, you have:

✅ Local development environment running
✅ Database connected and schema deployed
✅ API endpoints accessible
✅ Frontend loading correctly
✅ Ready to start building features!

**Congratulations! You're ready to build. 🚀**

---

Questions? Check the documentation or review the code comments.

Happy coding! 🎉
