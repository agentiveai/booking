import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma/client';
import { requireProvider, AuthenticatedRequest } from '@/lib/auth/middleware';

const businessHoursSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  isOpen: z.boolean(),
  openTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
  closeTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
});

const bulkBusinessHoursSchema = z.array(businessHoursSchema);

// GET /api/business-hours - Get business hours for provider
export async function GET(request: NextRequest) {
  return requireProvider(request, async (req: AuthenticatedRequest) => {
    try {
      const providerId = req.user!.userId;

      const businessHours = await prisma.businessHours.findMany({
        where: { providerId },
        orderBy: { dayOfWeek: 'asc' },
      });

      // If no hours set, return default (9-17, Monday-Friday)
      if (businessHours.length === 0) {
        const defaultHours = [];
        for (let day = 0; day <= 6; day++) {
          defaultHours.push({
            dayOfWeek: day,
            isOpen: day >= 1 && day <= 5, // Monday-Friday
            openTime: '09:00',
            closeTime: '17:00',
          });
        }
        return NextResponse.json({ businessHours: defaultHours, isDefault: true });
      }

      return NextResponse.json({ businessHours, isDefault: false });
    } catch (error) {
      console.error('Get business hours error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}

// POST /api/business-hours - Create/update business hours (bulk)
export async function POST(request: NextRequest) {
  return requireProvider(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const validatedData = bulkBusinessHoursSchema.parse(body);

      const providerId = req.user!.userId;

      // Delete existing hours
      await prisma.businessHours.deleteMany({
        where: { providerId },
      });

      // Create new hours
      const createdHours = await prisma.businessHours.createMany({
        data: validatedData.map((hours) => ({
          ...hours,
          providerId,
        })),
      });

      // Fetch and return created hours
      const businessHours = await prisma.businessHours.findMany({
        where: { providerId },
        orderBy: { dayOfWeek: 'asc' },
      });

      return NextResponse.json({
        businessHours,
        message: 'Business hours updated successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.issues },
          { status: 400 }
        );
      }

      console.error('Create business hours error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}
