import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma/client';

export async function GET(request: NextRequest) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const staff = await prisma.staffMember.findMany({
        where: {
          providerId: req.user.userId,
        },
        include: {
          _count: {
            select: {
              bookings: {
                where: {
                  status: { notIn: ['CANCELLED', 'NO_SHOW', 'COMPLETED'] },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return NextResponse.json({ staff });
    } catch (error) {
      console.error('Error fetching staff:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const { name, email, phone, title } = body;

      if (!name) {
        return NextResponse.json(
          { error: 'Name is required' },
          { status: 400 }
        );
      }

      const staffMember = await prisma.staffMember.create({
        data: {
          providerId: req.user.userId,
          name,
          email: email || null,
          phone: phone || null,
          title: title || null,
          isActive: true,
        },
      });

      return NextResponse.json({ staffMember }, { status: 201 });
    } catch (error) {
      console.error('Error creating staff member:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}
