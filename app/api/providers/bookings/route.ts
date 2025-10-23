import { NextRequest, NextResponse } from 'next/server';
import { requireProvider, AuthenticatedRequest } from '@/lib/auth/middleware';
import prisma from '@/lib/prisma/client';
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';

export async function GET(request: NextRequest) {
  return requireProvider(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const limit = parseInt(searchParams.get('limit') || '50');

      const providerId = req.user!.userId;

      // Build where clause
      const where: any = {
        providerId,
      };

      // Filter by status
      if (status && status !== 'ALL') {
        where.status = status;
      }

      // Filter by date range
      if (startDate && endDate) {
        where.startTime = {
          gte: new Date(startDate),
          lte: new Date(endDate),
        };
      }

      // Get bookings with related data
      const bookings = await prisma.booking.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
              nameNo: true,
              duration: true,
              price: true,
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              method: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          startTime: 'desc',
        },
        take: limit,
      });

      return NextResponse.json({ bookings });
    } catch (error) {
      console.error('Get bookings error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}
