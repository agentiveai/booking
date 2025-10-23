import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma/client';
import { requireProvider, AuthenticatedRequest } from '@/lib/auth/middleware';

const createServiceSchema = z.object({
  name: z.string().min(2),
  nameNo: z.string().min(2),
  description: z.string().optional(),
  descriptionNo: z.string().optional(),
  duration: z.number().min(1),
  price: z.number().min(0),
  bufferTimeBefore: z.number().min(0).default(0),
  bufferTimeAfter: z.number().min(0).default(0),
  // Staff capacity fields
  requiresStaff: z.boolean().default(true),
  anyStaffMember: z.boolean().default(true),
  maxConcurrent: z.number().min(1).default(1),
});

// GET /api/services - Get all services for a provider
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json(
        { error: 'providerId is required' },
        { status: 400 }
      );
    }

    const services = await prisma.service.findMany({
      where: {
        providerId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error('Get services error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/services - Create a new service (provider only)
export async function POST(request: NextRequest) {
  return requireProvider(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const validatedData = createServiceSchema.parse(body);

      const service = await prisma.service.create({
        data: {
          ...validatedData,
          providerId: req.user!.userId,
        },
      });

      return NextResponse.json(
        { service, message: 'Service created successfully' },
        { status: 201 }
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        );
      }

      console.error('Create service error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}
