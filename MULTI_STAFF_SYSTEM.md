# Multi-Staff Scheduling System

## Problem Solved
Previously, the system had a critical flaw where only ONE booking could exist at any given time for a provider, regardless of how many staff members were available. For example:
- A dentist office with 2 dentists could only handle 1 patient at a time
- A salon with 3 hairdressers was limited to 1 customer at a time

This made the system unsuitable for any multi-person business.

## Solution Implemented

### 1. Database Schema Changes

#### New Tables:
- **StaffMember**: Employees who can perform services
  - `name`, `email`, `phone`, `title`
  - `isActive`: Toggle staff on/off without deletion
  - `providerId`: Links to the business owner

- **ServiceStaff**: Junction table (many-to-many)
  - Links services to staff members who can perform them
  - Allows flexible assignment (e.g., "Only Dr. Smith does root canals")

- **StaffAvailability**: Per-staff time blocks
  - Track vacations, sick leave, breaks
  - Overrides business hours for specific staff

#### Updated Models:
- **Service**:
  - `requiresStaff`: Does this service need a staff member?
  - `anyStaffMember`: Can any staff perform this, or only assigned ones?
  - `maxConcurrent`: Max simultaneous bookings (capacity limit)

- **Booking**:
  - `staffId`: Which staff member is handling this booking?
  - **REMOVED**: `@@unique([providerId, startTime, endTime])` - This was blocking multiple bookings
  - **ADDED**: `@@unique([staffId, startTime, endTime])` - Prevents double-booking individual staff

### 2. Smart Availability Calculation

The new `/lib/utils/availability.ts` now:

1. **Counts Available Staff**:
   ```typescript
   // For each time slot, find which staff members are:
   // - Assigned to this service (or can perform any service)
   // - Not already booked
   // - Not on vacation/break
   ```

2. **Respects Capacity Limits**:
   ```typescript
   maxCapacity = Math.min(availableStaff.length, service.maxConcurrent)
   available = concurrentBookings < maxCapacity
   ```

3. **Auto-Assigns Staff**:
   ```typescript
   // When creating a booking, automatically assign the first available staff member
   const staffId = await assignStaffToBooking(serviceId, startTime, endTime);
   ```

### 3. UI for Staff Management

New page: `/dashboard/staff`
- Add/edit/delete team members
- Toggle active/inactive status
- View active booking count per staff member
- Prevents deletion of staff with active bookings

### 4. How It Works (Examples)

#### Example 1: Dentist Office
**Setup**:
- Business: "Oslo Tannklinikk"
- Staff: Dr. Hansen, Dr. Olsen
- Service: "Tannrens" (30 min)
  - `requiresStaff`: true
  - `anyStaffMember`: true
  - `maxConcurrent`: 2

**Result**:
- At 10:00 AM, system shows slot as available
- Customer 1 books → Auto-assigned to Dr. Hansen
- Customer 2 books same time → Auto-assigned to Dr. Olsen
- Customer 3 tries to book → Slot shows as FULL (maxConcurrent reached)

#### Example 2: Specialized Services
**Setup**:
- Business: "Premium Salon"
- Staff: Emma (hairdresser), Sofie (colorist)
- Service: "Hair Coloring" (90 min)
  - `requiresStaff`: true
  - `anyStaffMember`: false
  - Assigned staff: ONLY Sofie

**Result**:
- At 2:00 PM, system checks if Sofie is available
- Customer 1 books → Assigned to Sofie
- Customer 2 tries to book same time → UNAVAILABLE (Sofie is booked)
- Even though Emma is free, she can't do coloring

#### Example 3: Group Classes
**Setup**:
- Business: "Yoga Studio"
- Staff: Instructor Lars
- Service: "Yoga Class" (60 min)
  - `requiresStaff`: true
  - `anyStaffMember`: false
  - `maxConcurrent`: 10 (class capacity)
  - Assigned staff: Lars

**Result**:
- At 6:00 PM, up to 10 people can book the same slot
- All assigned to Lars
- 11th person gets "FULL" message

### 5. Prevents Overbooking

The system now prevents overbooking through:

1. **Database Constraint**: `@@unique([staffId, startTime, endTime])`
   - PostgreSQL prevents two bookings for same staff at same time

2. **Transaction Locks**: `prisma.$transaction()`
   - Re-checks availability inside transaction before committing
   - Prevents race conditions

3. **Capacity Checks**:
   - Counts concurrent bookings vs available staff
   - Returns `availableStaffCount` in calendar

### 6. Migration Path

For existing users:
1. System works immediately - services default to `anyStaffMember: true`
2. No staff? Booking still works (backwards compatible)
3. Add staff members → instant capacity increase
4. Optionally assign specific staff to services

### 7. Future Enhancements

Possible additions:
- **Staff preferences**: "Customer prefers Dr. Hansen"
- **Load balancing**: Distribute bookings evenly
- **Skills/certifications**: "Only certified staff can do X"
- **Staff dashboard**: Individual calendars per staff member
- **Performance tracking**: Bookings per staff, revenue attribution

## Files Changed

### Database:
- `prisma/schema.prisma` - Added StaffMember, ServiceStaff, StaffAvailability models

### Backend:
- `lib/utils/availability.ts` - Complete rewrite with multi-staff logic
- `app/api/staff/route.ts` - GET/POST staff members
- `app/api/staff/[id]/route.ts` - PUT/DELETE staff members

### Frontend:
- `app/dashboard/staff/page.tsx` - Staff management UI
- `components/dashboard/DashboardLayout.tsx` - Added "Teammedlemmer" nav link

## Testing Checklist

- [ ] Add 2 staff members
- [ ] Create a service with `anyStaffMember: true`
- [ ] Book same time slot twice → Both should succeed
- [ ] Book same time slot 3rd time → Should fail
- [ ] Set one staff to inactive
- [ ] Try booking again → Only 1 slot available now
- [ ] Assign service to specific staff only
- [ ] Verify only that staff gets bookings
- [ ] Add staff availability block (vacation)
- [ ] Verify bookings are blocked during vacation
- [ ] Check calendar shows correct availability indicators
- [ ] Verify booking email includes staff name

## Summary

This multi-staff system transforms the platform from "single-practitioner only" to "enterprise-ready". It's now suitable for:
- Multi-doctor clinics
- Salons with multiple stylists
- Fitness studios with multiple trainers
- Any service business with multiple employees

The system is **smart**, **scalable**, and **prevents overbooking** - making it better than Calendly for Norwegian businesses with multiple staff members!
