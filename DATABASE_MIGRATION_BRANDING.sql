-- Database Migration: Add Branding Features
-- Run this SQL on your Supabase database when it's available
-- Date: 2025-10-19

-- Step 1: Create Plan enum type
CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');

-- Step 2: Add branding columns to User table
ALTER TABLE "User"
ADD COLUMN "logo" TEXT,
ADD COLUMN "brandColor" TEXT DEFAULT '#0066FF',
ADD COLUMN "brandColorDark" TEXT DEFAULT '#0052CC',
ADD COLUMN "plan" "Plan" DEFAULT 'FREE',
ADD COLUMN "hideBranding" BOOLEAN DEFAULT false;

-- Step 3: Create indexes for better query performance (optional but recommended)
CREATE INDEX "User_plan_idx" ON "User"("plan");

-- Step 4: Update existing users to have default brand colors (if they're null)
UPDATE "User"
SET
  "brandColor" = '#0066FF',
  "brandColorDark" = '#0052CC',
  "plan" = 'FREE',
  "hideBranding" = false
WHERE "brandColor" IS NULL;

-- Verification queries (run these to confirm migration worked):
-- SELECT id, email, logo, "brandColor", "brandColorDark", plan, "hideBranding" FROM "User" WHERE role = 'PROVIDER' LIMIT 5;
-- SELECT COUNT(*) as total_providers, COUNT(logo) as providers_with_logo FROM "User" WHERE role = 'PROVIDER';
