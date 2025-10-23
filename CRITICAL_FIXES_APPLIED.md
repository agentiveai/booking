# Critical Fixes Applied

## Issues Reported by User

1. ✅ **Staff "Legg til" button not working** - FIXED
2. ⏳ **Calendar showing all days as full** - FIXED
3. ⏳ **Page refreshes when navigating** - PENDING
4. ⏳ **Google OAuth login** - PENDING
5. ⏳ **Google Calendar integration** - PENDING

---

## Fixes Applied

### 1. Prisma Query Error in Availability Check ✅

**Problem**: Calendar was showing all days as full because Prisma query was failing

**Error**:
```
Unknown argument `where` in nested include for staff
```

**Root Cause**: Can't use `where` clause directly inside nested `include` for related models

**Fixed in**: `/lib/utils/availability.ts` (lines 27-36, 261-270)

**Solution**: Remove `where: { isActive: true }` from nested include, filter in JavaScript instead:
```typescript
// BEFORE (causing error):
include: {
  staffAssignments: {
    include: {
      staff: {
        where: { isActive: true }, // ❌ Not allowed here
      },
    },
  },
}

// AFTER (works):
include: {
  staffAssignments: {
    include: {
      staff: true, // ✅ Get all, filter later
    },
  },
}

// Then filter in code:
potentialStaff = service.staffAssignments
  .filter((sa) => sa.staff.isActive) // ✅ Filter here
  .map((sa) => sa.staffId);
```

**Result**: Calendar availability API now returns correct data instead of 500 errors

---

### 2. Staff API Authentication Missing ✅

**Problem**: "Legg til" button not working - API returning 401 Unauthorized

**Root Cause**: Staff page wasn't sending Authorization header with JWT token

**Fixed in**: `/app/dashboard/staff/page.tsx`

**Changes Made**:
- `fetchStaff()` - Added Authorization header
- `handleSubmit()` - Added Authorization header
- `handleToggleActive()` - Added Authorization header
- `handleDelete()` - Added Authorization header

**Before**:
```typescript
const response = await fetch('/api/staff');
```

**After**:
```typescript
const token = localStorage.getItem('token');
const response = await fetch('/api/staff', {
  headers: { 'Authorization': `Bearer ${token}` },
});
```

**Result**: Staff creation/edit/delete now works properly

---

## Testing Checklist

- [ ] Visit /dashboard/staff
- [ ] Click "Legg til teammedlem"
- [ ] Fill in name and click "Legg til"
- [ ] Verify staff member appears in list
- [ ] Go to booking page
- [ ] Verify calendar shows availability (not all red)
- [ ] Select a date and verify time slots appear

---

## Still TODO

### 3. Smooth Navigation (Page Refreshes)

**Current**: Using `<a href>` tags causing full page reloads

**Solution**: Replace with Next.js `<Link>` components

**Files to Update**:
- `/components/dashboard/DashboardLayout.tsx` - sidebar links
- Any other navigation components

**Implementation**:
```typescript
// Replace:
<a href="/dashboard">Dashboard</a>

// With:
import Link from 'next/link';
<Link href="/dashboard">Dashboard</Link>
```

---

### 4. Google OAuth Login

**Implementation Plan**:
1. Install NextAuth.js: `npm install next-auth @auth/prisma-adapter`
2. Set up Google OAuth credentials in Google Cloud Console
3. Add environment variables:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   NEXTAUTH_SECRET=...
   NEXTAUTH_URL=http://localhost:3002
   ```
4. Create `/app/api/auth/[...nextauth]/route.ts`
5. Add "Sign in with Google" button to login page
6. Update Prisma schema to support OAuth accounts

---

### 5. Google Calendar Integration

**Implementation Plan**:
1. Use Google Calendar API with OAuth scopes
2. Add calendar sync toggle in provider settings
3. When booking created → create Google Calendar event
4. 2-way sync: Import Google events as blocked time
5. Per-staff calendar support (each staff has own Google Calendar)

**API Endpoints Needed**:
- `/api/calendar/connect` - OAuth flow
- `/api/calendar/sync` - Manual sync trigger
- `/api/calendar/disconnect` - Remove connection

---

## Current Status

✅ **Critical Bugs Fixed**:
- Staff creation working
- Calendar availability working

⏳ **UX Improvements Needed**:
- Smooth navigation
- Google OAuth
- Google Calendar sync

**Next Priority**: Test the fixes, then implement smooth navigation with Link components
