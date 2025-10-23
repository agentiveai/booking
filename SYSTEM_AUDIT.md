# Comprehensive System Audit

## User Journey Analysis

### Journey 1: Provider Registration → First Booking

1. **Register** (`/register`)
2. **Login** (`/login`)
3. **Dashboard** (`/dashboard`) - Empty state
4. **Settings** (`/dashboard/settings`) - Set business hours
5. **Staff** (`/dashboard/staff`) - Add team members
6. **Services** (`/dashboard/services`) - Create services
7. **Customer visits** booking page
8. **Booking created**

### Journey 2: Customer Books Appointment

1. **Discovers** provider (via link/embed)
2. **Selects service**
3. **Picks date/time** from calendar
4. **Fills details**
5. **Confirms booking**
6. **Receives email**

---

## Critical Issues Found

### 1. BROKEN: No Business Hours by Default
- New providers have NO business hours set
- Calendar shows ALL days as unavailable
- **Fix Needed**: Create default business hours on registration

### 2. BROKEN: Services Can't Set Staff Capacity
- UI doesn't expose `requiresStaff`, `anyStaffMember`, `maxConcurrent`
- Providers can't configure the multi-staff system we built!
- **Fix Needed**: Add capacity fields to service form

### 3. UX: Full Page Refreshes
- Every navigation reloads the entire page
- Slow and jarring
- **Fix Needed**: Replace `<a>` with Next.js `<Link>`

### 4. MISSING: Service Needs Business Hours Check
- Can create service before setting business hours
- Results in zero availability
- **Fix Needed**: Warn if no business hours set

### 5. MISSING: Staff Assignment to Services
- No way to assign specific staff to services
- `anyStaffMember=false` is useless
- **Fix Needed**: Staff assignment UI

### 6. UX: No Onboarding Flow
- New users are confused
- Don't know what to do first
- **Fix Needed**: Setup wizard

### 7. MISSING: Booking Confirmation Shows No Staff
- Emails don't show which staff member
- **Fix Needed**: Include staff name in confirmations

### 8. PERFORMANCE: Availability Prefetch is Slow
- 30 parallel API calls on calendar load
- **Fix Needed**: Batch into single endpoint

---

## Priority Fixes

### HIGH PRIORITY (Breaks functionality)
1. Default business hours on registration
2. Service capacity UI
3. Fix availability calculation

### MEDIUM PRIORITY (Poor UX)
4. Smooth navigation with Link
5. Staff assignment UI
6. Booking confirmations show staff

### LOW PRIORITY (Nice to have)
7. Onboarding wizard
8. Performance optimization
