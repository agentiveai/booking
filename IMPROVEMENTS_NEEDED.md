# Critical Improvements Needed

## Priority 1: Complete Staff Integration

### 1. Services Page - Add Staff Capacity Settings
**File**: `app/dashboard/services/page.tsx`
**Missing**:
- `requiresStaff` checkbox: "Does this service require a staff member?"
- `anyStaffMember` checkbox: "Can any staff member perform this?"
- `maxConcurrent` number input: "Max simultaneous bookings"
- Staff assignment dropdown (if anyStaffMember = false)

**Why Critical**: Without this, businesses can't configure capacity limits properly

### 2. Booking Confirmation - Show Staff Name
**Files**:
- `app/api/bookings/route.ts`
- Email templates
**Missing**: Include which staff member is assigned in confirmation emails

**Why Critical**: Customers need to know who they're meeting with

### 3. Service API - Handle New Fields
**File**: `app/api/providers/services/route.ts`
**Missing**: Create/update endpoints need to handle:
- `requiresStaff`
- `anyStaffMember`
- `maxConcurrent`
- Staff assignments via ServiceStaff table

### 4. Dashboard - Show Staff Assignments
**File**: `app/dashboard/page.tsx`
**Missing**: Show which staff members are working today/this week

## Priority 2: User Experience Improvements

### 5. Onboarding Flow
**New Files Needed**: `app/dashboard/onboarding/page.tsx`
**Content**:
- Welcome new providers
- Guide them through: Settings → Services → Staff → Test Booking
- Show example scenarios

### 6. Helpful Tooltips
**All Dashboard Pages**:
- Add (?) icons with explanations
- "What is buffer time?"
- "Why add staff members?"
- "How does capacity work?"

### 7. Empty States
**Current Issue**: Some pages just show blank when no data
**Fix**:
- Services page: "Create your first service" CTA
- Bookings page: "No bookings yet" with example
- Staff page: ✅ Already done well!

## Priority 3: Booking Flow Enhancements

### 8. Customer Booking - Show Staff Info
**File**: `app/booking/[providerId]/page.tsx`
**Missing**: When booking, show "You'll be with Dr. Hansen" (if assigned)

### 9. Booking History - Staff Column
**File**: `app/my-bookings/page.tsx`
**Missing**: Show which staff member handled the booking

### 10. Provider Dashboard - Staff Filter
**File**: `app/dashboard/page.tsx`
**Missing**: Filter bookings by staff member

## Priority 4: Error Handling & Validation

### 11. Better Error Messages
**All API Routes**:
- Currently: "Internal server error"
- Should be: "No staff available for this time" (specific)

### 12. Form Validation
**Service Creation**:
- Prevent maxConcurrent < 1
- Warn if no staff assigned but requiresStaff = true

### 13. Booking Conflicts
**Booking API**:
- Better error when double-booking
- Suggest alternative times

## Priority 5: Performance & Polish

### 14. Loading States
**Issue**: Some pages show spinner indefinitely if error
**Fix**: Add error boundaries and timeout handling

### 15. Optimize Availability Queries
**File**: `lib/utils/availability.ts`
**Issue**: Multiple database queries per time slot
**Fix**: Batch queries, use caching

### 16. Mobile Responsiveness
**All Pages**: Ensure calendar and forms work well on mobile

## Quick Wins (Can Do in <30 min)

1. Add default business hours on registration ✅
2. Show provider timezone in settings
3. Add "Copy booking link" to each service
4. Booking confirmation page (instead of just alert)
5. Add favicon and meta tags

## Norwegian Language Polish

1. Ensure ALL UI text is Norwegian
2. Fix any lingering English strings
3. Add proper date/time formatting with Norwegian locale

## Testing Checklist

- [ ] Create provider account
- [ ] Set business hours
- [ ] Create 2 staff members
- [ ] Create service with staff requirement
- [ ] Book as customer
- [ ] Verify staff assigned correctly
- [ ] Book 2nd concurrent slot
- [ ] Try 3rd booking (should fail)
- [ ] Check email notifications
- [ ] Cancel booking
- [ ] Test calendar sync

## Security Audit

- [ ] All API routes have auth middleware
- [ ] Provider can only access their own data
- [ ] Customer can only see their bookings
- [ ] No sensitive data in client-side code
- [ ] Environment variables secured
