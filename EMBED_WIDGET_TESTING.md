# Embed Widget Testing Guide

## Overview

This guide explains how to test all three embed widget types that were implemented in Phase 2.

## Prerequisites

1. Your Next.js development server must be running: `npm run dev`
2. You need a provider user ID from your database
3. The provider should have at least one active service configured

## Test Files Created

- `/public/widget.js` - The embeddable JavaScript widget (330 lines)
- `/app/embed/[userId]/page.tsx` - The embed page with branding support
- `/public/embed-test.html` - Comprehensive test page for all three widget types

## Testing Steps

### Step 1: Get Your Provider ID

1. Log into your dashboard at `http://localhost:3000/login`
2. Navigate to Dashboard → Embedding (`/dashboard/embedding`)
3. Your provider ID will be displayed at the top of the page
4. Copy this ID (it looks like `cm2abc123xyz`)

### Step 2: Update Test Page

Open `/public/embed-test.html` and replace all instances of `USER_ID_PLACEHOLDER` with your actual provider ID:

```html
<!-- Before -->
<div id="booking-widget" data-provider-id="USER_ID_PLACEHOLDER"></div>

<!-- After -->
<div id="booking-widget" data-provider-id="cm2abc123xyz"></div>
```

Find and replace in 3 locations:
- Line ~105: Inline embed demo
- Line ~143: Popup button demo
- Line ~223: Floating button script

### Step 3: Access Test Page

Open your browser and navigate to:
```
http://localhost:3000/embed-test.html
```

## Widget Types to Test

### 1. Inline Embed Widget ✅

**What to test:**
- Widget appears directly embedded in the page
- Shows provider logo/initial with custom brand colors
- Lists all active services
- Service cards show correct pricing and duration
- Hover effects work (border color changes to brand color)
- Clicking "Book" opens booking page in new window or navigates in same window

**Expected behavior:**
- Clean, responsive layout
- Custom brand colors applied throughout
- Conditional "Powered by" footer (hidden if provider has Pro plan with `hideBranding: true`)

### 2. Popup Button Widget ✅

**What to test:**
- Click the "Book Your Appointment" button
- Modal overlay appears with blur effect
- Close button (×) appears in top-right
- Widget displays inside modal
- Clicking outside modal closes it
- Close button works
- Body scroll is disabled when modal is open

**Expected behavior:**
- Smooth fade-in animation
- Overlay has blur effect
- Modal is centered and responsive
- Can close by clicking overlay or close button

### 3. Floating Button Widget ✅

**What to test:**
- Floating button appears at bottom-right (or configured position)
- Button shows calendar icon and custom text ("Book")
- Button color matches configuration (#667eea in test page)
- Hover effect: button lifts up and shadow increases
- Clicking opens popup modal (same as Type 2)

**Expected behavior:**
- Button stays fixed while scrolling
- Smooth hover animations
- Opens same modal as popup button
- Position can be configured (bottom-right, bottom-left, top-right, top-left)

## Customization Options to Test

### Floating Button Customizations

Edit the script tag at the bottom of `embed-test.html`:

```html
<script src="/widget.js"
        data-provider-id="YOUR_ID"
        data-float="true"
        data-button-text="Book Now"          <!-- Change button text -->
        data-button-color="#FF5733"          <!-- Change button color -->
        data-position="bottom-left">         <!-- Change position -->
</script>
```

Test each option:
- ✅ `data-button-text`: Change text (e.g., "Schedule", "Reserve", "Bestill Time")
- ✅ `data-button-color`: Try different colors (#0066FF, #10b981, #ef4444)
- ✅ `data-position`: Try all positions (bottom-right, bottom-left, top-right, top-left)

## Branding Features to Test

### Custom Logo
1. Upload a logo via Dashboard → Branding
2. Reload test page
3. Verify logo appears in:
   - Inline embed header
   - Popup modal header
   - Embed page header

### Custom Brand Colors
1. Set custom colors via Dashboard → Branding (e.g., #FF5733)
2. Reload test page
3. Verify colors applied to:
   - Service card borders on hover
   - Price text
   - Book buttons (background)
   - Book buttons on hover (dark variant)
   - Loading spinners
   - Icons

### Hide Branding (Pro Feature)
1. Upgrade to Pro plan (or set plan in database manually)
2. Enable "Hide Platform Branding" in Dashboard → Branding
3. Reload test page
4. Verify "Powered by Booking Platform" footer is removed

## Browser DevTools Testing

### PostMessage Communication

Open browser DevTools (F12) → Console tab and look for:

```javascript
// When iframe loads
{ type: 'BOOKING_WIDGET_RESIZE', height: 600 }

// When user clicks "Book" in widget
{ type: 'BOOKING_WIDGET_NAVIGATE', url: '/booking/cm2abc123xyz?serviceId=...' }
```

### Network Tab

Check that resources load correctly:
- ✅ `/widget.js` (200 OK)
- ✅ `/embed/YOUR_ID` (200 OK)
- ✅ `/api/public/provider/YOUR_ID` (200 OK, returns provider + services)
- ✅ Logo image if uploaded (200 OK)

### Responsive Testing

Test on different screen sizes:
1. Desktop (1920x1080) - All widgets work
2. Tablet (768x1024) - Layout adjusts
3. Mobile (375x667) - Floating button remains visible, modal is full-screen

Use DevTools Device Toolbar (Ctrl+Shift+M / Cmd+Shift+M)

## Common Issues & Fixes

### Issue: Widget doesn't appear

**Fix:**
- Check browser console for errors
- Verify provider ID is correct
- Ensure development server is running (`npm run dev`)
- Check `/api/public/provider/YOUR_ID` returns data

### Issue: Colors not applying

**Fix:**
- Check provider has `brandColor` and `brandColorDark` set in database
- Default values are `#0066FF` and `#0052CC`
- Clear browser cache and reload

### Issue: Logo not showing

**Fix:**
- Verify logo was uploaded successfully via Dashboard → Branding
- Check logo path in database (`/uploads/logos/...`)
- Ensure file exists in `/public/uploads/logos/` directory
- Check browser console for 404 errors

### Issue: Modal won't close

**Fix:**
- Check browser console for JavaScript errors
- Ensure close button event listeners are attached
- Try clicking outside modal area (not on modal itself)

### Issue: Floating button doesn't appear

**Fix:**
- Verify script has `data-float="true"` attribute
- Check `data-provider-id` is set correctly
- Look for button at configured position (default: bottom-right)
- Check z-index conflicts with other page elements (widget uses z-index: 999998)

## Testing on External Website

To test widgets on a real external website:

### 1. Deploy to Production

```bash
# Build and deploy your Next.js app
npm run build
npm start

# Or deploy to Vercel/Netlify/etc
```

### 2. Create Test HTML File

Create `test.html` on your external website:

```html
<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <title>Widget Test</title>
</head>
<body>
  <h1>My Website</h1>
  <p>Welcome! Book an appointment below:</p>

  <!-- Inline Widget -->
  <div id="booking-widget" data-provider-id="YOUR_ID"></div>
  <script src="https://yourdomain.com/widget.js"></script>
</body>
</html>
```

### 3. Test CORS

Ensure your Next.js API allows cross-origin requests if needed. The widget should work across domains because:
- `/widget.js` is a public static file
- `/embed/[userId]` page is public (no auth required)
- `/api/public/provider/[username]` is a public API

## Success Criteria

All three widget types are working correctly if:

✅ **Inline Embed:**
- Displays services in embedded container
- Custom branding (logo + colors) applied
- Clicking "Book" opens booking page
- Responsive on mobile/tablet

✅ **Popup Button:**
- Button triggers modal overlay
- Modal shows booking widget
- Close button and overlay click both close modal
- Smooth animations (fade-in, slide-up)

✅ **Floating Button:**
- Button appears at configured position
- Stays visible while scrolling
- Hover effects work smoothly
- Opens same modal as popup button
- Customization options work (text, color, position)

✅ **Branding:**
- Custom logo displays correctly
- Brand colors applied throughout
- "Powered by" footer respects `hideBranding` setting
- Dark color variant used on hover states

## Next Steps After Testing

Once all tests pass:

1. ✅ Mark Phase 2 as complete
2. 📝 Document any issues found
3. 🚀 Consider starting Phase 3: Workflows & Automations
4. 📊 Gather feedback from real providers using the embed widgets
5. 🎨 Consider additional customization options based on user requests

## Demo for Clients

When showing embed widgets to potential clients:

1. Show the Dashboard → Embedding page with copy-paste code
2. Demonstrate live preview of inline embed
3. Show customization options (colors, logo)
4. Walk through adding widget to a sample HTML page
5. Highlight ease of use compared to Calendly/Cal.com

## Support Resources

- **Documentation**: `/FEATURE_COMPARISON_CALENDLY_CALCOM.md` - Full feature comparison
- **Branding Guide**: `/BRANDING_FEATURES_SUMMARY.md` - Branding implementation details
- **Widget Script**: `/public/widget.js` - Well-commented source code
- **Embed Page**: `/app/embed/[userId]/page.tsx` - Iframe content implementation

## Questions?

If you encounter issues or have questions:

1. Check browser console for errors
2. Review the widget script source (`/public/widget.js`)
3. Test the embed page directly: `http://localhost:3000/embed/YOUR_ID`
4. Verify API returns correct data: `http://localhost:3000/api/public/provider/YOUR_ID`
