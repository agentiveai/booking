import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { generateICS } from '@/lib/calendar/ics';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: id },
      include: {
        service: true,
        provider: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Generate ICS content
    const icsContent = generateICS({
      id: booking.id,
      title: booking.service.nameNo,
      description: `${booking.service.descriptionNo || ''}\n\nBooket av: ${booking.customerName}\nTelefon: ${booking.customerPhone || 'Ikke oppgitt'}\n\n${booking.notes || ''}`.trim(),
      location: booking.provider.businessAddress || undefined,
      startTime: booking.startTime,
      endTime: booking.endTime,
      organizerName: booking.provider.businessName || booking.provider.name,
      organizerEmail: booking.provider.email,
      attendeeName: booking.customerName,
      attendeeEmail: booking.customerEmail,
    });

    // Return ICS file
    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="booking-${booking.id}.ics"`,
      },
    });
  } catch (error) {
    console.error('Error generating ICS:', error);
    return NextResponse.json(
      { error: 'Failed to generate calendar file' },
      { status: 500 }
    );
  }
}
