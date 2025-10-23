import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    // Find provider by email (username) or business name
    // In a real app, you might want to create a unique slug field
    const provider = await prisma.user.findFirst({
      where: {
        role: 'PROVIDER',
        OR: [
          { email: { contains: username, mode: 'insensitive' } },
          { businessName: { contains: username, mode: 'insensitive' } },
          { id: username }, // Also support direct ID lookup
        ],
      },
      select: {
        id: true,
        name: true,
        businessName: true,
        email: true,
        logo: true,
        brandColor: true,
        brandColorDark: true,
        hideBranding: true,
      },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Get active services for this provider
    const services = await prisma.service.findMany({
      where: {
        providerId: provider.id,
        isActive: true,
      },
      select: {
        id: true,
        nameNo: true,
        descriptionNo: true,
        duration: true,
        price: true,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      provider,
      services,
    });
  } catch (error) {
    console.error('Error fetching provider data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
