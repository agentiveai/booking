import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'E-post er p�krevd' },
        { status: 400 }
      );
    }

    // Find all bookings for this email
    const bookings = await prisma.booking.findMany({
      where: {
        customerEmail: {
          equals: email.toLowerCase(),
          mode: 'insensitive',
        },
      },
      include: {
        service: {
          select: {
            nameNo: true,
            duration: true,
          },
        },
        provider: {
          select: {
            name: true,
            businessName: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Error fetching customer bookings:', error);
    return NextResponse.json(
      { error: 'Noe gikk galt' },
      { status: 500 }
    );
  }
}
