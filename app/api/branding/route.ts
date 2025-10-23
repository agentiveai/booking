import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma/client';
import { z } from 'zod';

const brandingSchema = z.object({
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format. Use hex format like #0066FF').optional(),
  brandColorDark: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format. Use hex format like #0066FF').optional(),
  hideBranding: z.boolean().optional(),
});

/**
 * Get branding settings for current user
 * GET /api/branding
 */
export async function GET(request: NextRequest) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: {
          logo: true,
          brandColor: true,
          brandColorDark: true,
          plan: true,
          hideBranding: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ branding: user });
    } catch (error: any) {
      console.error('Get branding error:', error);
      return NextResponse.json(
        { error: 'Failed to get branding settings' },
        { status: 500 }
      );
    }
  });
}

/**
 * Update branding settings
 * PATCH /api/branding
 */
export async function PATCH(request: NextRequest) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    try {
      // Only providers can update branding
      if (req.user!.role !== 'PROVIDER' && req.user!.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Only providers can update branding' },
          { status: 403 }
        );
      }

      const body = await request.json();
      const validatedData = brandingSchema.parse(body);

      // Get current user to check plan
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: { plan: true },
      });

      if (!currentUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Check if user is trying to hide branding without Pro plan
      if (validatedData.hideBranding === true && currentUser.plan === 'FREE') {
        return NextResponse.json(
          { error: 'Hiding platform branding requires Pro plan or higher' },
          { status: 403 }
        );
      }

      // Update branding settings
      const updatedUser = await prisma.user.update({
        where: { id: req.user!.userId },
        data: {
          brandColor: validatedData.brandColor,
          brandColorDark: validatedData.brandColorDark,
          hideBranding: validatedData.hideBranding,
        },
        select: {
          logo: true,
          brandColor: true,
          brandColorDark: true,
          plan: true,
          hideBranding: true,
        },
      });

      return NextResponse.json({
        branding: updatedUser,
        message: 'Branding updated successfully',
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        );
      }

      console.error('Update branding error:', error);
      return NextResponse.json(
        { error: 'Failed to update branding settings' },
        { status: 500 }
      );
    }
  });
}
