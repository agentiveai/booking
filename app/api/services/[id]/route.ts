import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma/client';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    // Get existing service to verify ownership
    const existingService = await prisma.service.findUnique({
      where: { id: id },
      select: { providerId: true },
    });

    if (!existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Verify ownership
    if (existingService.providerId !== decoded.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Update service
    const updatedService = await prisma.service.update({
      where: { id: id },
      data: {
        name: body.name,
        nameNo: body.nameNo,
        description: body.description,
        descriptionNo: body.descriptionNo,
        duration: body.duration,
        price: body.price,
        bufferTimeBefore: body.bufferTimeBefore,
        bufferTimeAfter: body.bufferTimeAfter,
        isActive: body.isActive !== undefined ? body.isActive : undefined,
        // Staff capacity fields
        requiresStaff: body.requiresStaff !== undefined ? body.requiresStaff : undefined,
        anyStaffMember: body.anyStaffMember !== undefined ? body.anyStaffMember : undefined,
        maxConcurrent: body.maxConcurrent !== undefined ? body.maxConcurrent : undefined,
      },
    });

    return NextResponse.json({
      message: 'Service updated successfully',
      service: updatedService,
    });
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    // Get existing service to verify ownership
    const existingService = await prisma.service.findUnique({
      where: { id: id },
      select: { providerId: true },
    });

    if (!existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Verify ownership
    if (existingService.providerId !== decoded.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete service
    await prisma.service.delete({
      where: { id: id },
    });

    return NextResponse.json({
      message: 'Service deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
