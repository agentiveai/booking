import { NextRequest, NextResponse } from 'next/server';
import { getAvailableTimeSlots } from '@/lib/utils/availability';
import { z } from 'zod';

const availabilitySchema = z.object({
  providerId: z.string(),
  serviceId: z.string(),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  timezone: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const queryData = {
      providerId: searchParams.get('providerId'),
      serviceId: searchParams.get('serviceId'),
      date: searchParams.get('date'),
      timezone: searchParams.get('timezone') || undefined,
    };

    // Validate query parameters
    const validatedData = availabilitySchema.parse(queryData);

    // Get available time slots
    const slots = await getAvailableTimeSlots({
      providerId: validatedData.providerId,
      serviceId: validatedData.serviceId,
      date: new Date(validatedData.date),
      timezone: validatedData.timezone,
    });

    // Filter to only return available slots
    const availableSlots = slots
      .filter((slot) => slot.available)
      .map((slot) => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
      }));

    return NextResponse.json({
      date: validatedData.date,
      availableSlots,
      totalSlots: availableSlots.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Availability check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
