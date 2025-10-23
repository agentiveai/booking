import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma/client';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = params;
      const body = await request.json();

      // Verify staff member belongs to this provider
      const existing = await prisma.staffMember.findUnique({
        where: { id },
      });

      if (!existing || existing.providerId !== req.user.userId) {
        return NextResponse.json(
          { error: 'Staff member not found' },
          { status: 404 }
        );
      }

      const staffMember = await prisma.staffMember.update({
        where: { id },
        data: {
          name: body.name !== undefined ? body.name : existing.name,
          email: body.email !== undefined ? (body.email || null) : existing.email,
          phone: body.phone !== undefined ? (body.phone || null) : existing.phone,
          title: body.title !== undefined ? (body.title || null) : existing.title,
          isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
        },
      });

      return NextResponse.json({ staffMember });
    } catch (error) {
      console.error('Error updating staff member:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = params;

      // Verify staff member belongs to this provider
      const existing = await prisma.staffMember.findUnique({
        where: { id },
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
      });

      if (!existing || existing.providerId !== req.user.userId) {
        return NextResponse.json(
          { error: 'Staff member not found' },
          { status: 404 }
        );
      }

      // Prevent deletion if staff has active bookings
      if (existing._count.bookings > 0) {
        return NextResponse.json(
          { error: 'Cannot delete staff member with active bookings. Please set them as inactive instead.' },
          { status: 400 }
        );
      }

      await prisma.staffMember.delete({
        where: { id },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting staff member:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}
