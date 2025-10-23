import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma/client';
import { requireAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { createRefund } from '@/lib/payments/stripe';
import { vippsClient } from '@/lib/payments/vipps';
import { triggerWorkflows } from '@/lib/workflows/executor';
import { WorkflowTrigger } from '@prisma/client';

const updateBookingSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'NO_SHOW', 'COMPLETED']).optional(),
  notes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check if this is a public confirmation request (no auth header)
    const authHeader = request.headers.get('authorization');
    const isPublicRequest = !authHeader;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        provider: {
          select: {
            id: true,
            name: true,
            businessName: true,
          },
        },
        service: {
          select: {
            name: true,
          },
        },
        staff: {
          select: {
            name: true,
          },
        },
        payments: true,
        cancellationPolicy: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking ikke funnet' },
        { status: 404 }
      );
    }

    // For public confirmation page, return limited data
    if (isPublicRequest) {
      return NextResponse.json({
        id: booking.id,
        serviceName: booking.service.name,
        providerName: booking.provider.name,
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
        totalAmount: Number(booking.totalAmount),
        status: booking.status,
        customerEmail: booking.customerEmail,
        customerName: booking.customerName,
        staffName: booking.staff?.name,
      });
    }

    // For authenticated requests, require proper auth
    return requireAuth(request, async (req: AuthenticatedRequest) => {
      // Check authorization
      if (
        booking.customerId !== req.user!.userId &&
        booking.providerId !== req.user!.userId &&
        req.user!.role !== 'ADMIN'
      ) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }

      return NextResponse.json({ booking });
    });
  } catch (error) {
    console.error('Get booking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const validatedData = updateBookingSchema.parse(body);

      // Get existing booking
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          payments: true,
          cancellationPolicy: true,
        },
      });

      if (!booking) {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        );
      }

      // Check authorization (only provider or admin can update)
      if (
        booking.providerId !== req.user!.userId &&
        req.user!.role !== 'ADMIN'
      ) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }

      // Handle cancellation with refund
      if (validatedData.status === 'CANCELLED' && booking.status !== 'CANCELLED') {
        await handleCancellation(booking);
      }

      // Update booking
      const updatedBooking = await prisma.booking.update({
        where: { id: id },
        data: {
          ...validatedData,
          ...(validatedData.status === 'CANCELLED' && {
            cancelledAt: new Date(),
            cancelledBy: req.user!.userId,
          }),
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          service: true,
          payments: true,
        },
      });

      // Trigger workflows based on status changes (async, don't wait)
      if (validatedData.status && validatedData.status !== booking.status) {
        if (validatedData.status === 'CONFIRMED') {
          triggerWorkflows(WorkflowTrigger.BOOKING_CONFIRMED, id)
            .catch((error) => console.error('Failed to trigger BOOKING_CONFIRMED workflows:', error));
        } else if (validatedData.status === 'CANCELLED') {
          triggerWorkflows(WorkflowTrigger.BOOKING_CANCELLED, id)
            .catch((error) => console.error('Failed to trigger BOOKING_CANCELLED workflows:', error));
        } else if (validatedData.status === 'COMPLETED') {
          triggerWorkflows(WorkflowTrigger.BOOKING_COMPLETED, id)
            .catch((error) => console.error('Failed to trigger BOOKING_COMPLETED workflows:', error));
        }
      }

      return NextResponse.json({
        booking: updatedBooking,
        message: 'Booking updated successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.issues },
          { status: 400 }
        );
      }

      console.error('Update booking error:', error);
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
      const { id } = await params;
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          payments: true,
          cancellationPolicy: true,
        },
      });

      if (!booking) {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        );
      }

      // Check authorization
      if (
        booking.customerId !== req.user!.userId &&
        booking.providerId !== req.user!.userId &&
        req.user!.role !== 'ADMIN'
      ) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }

      // Handle cancellation with refund
      await handleCancellation(booking);

      // Soft delete (update status)
      await prisma.booking.update({
        where: { id: id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: req.user!.userId,
        },
      });

      // Trigger cancellation workflows (async, don't wait)
      triggerWorkflows(WorkflowTrigger.BOOKING_CANCELLED, id)
        .catch((error) => console.error('Failed to trigger BOOKING_CANCELLED workflows:', error));

      return NextResponse.json({
        message: 'Booking cancelled successfully',
      });
    } catch (error) {
      console.error('Delete booking error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}

async function handleCancellation(booking: any) {
  // Calculate refund amount based on cancellation policy
  const hoursUntilBooking =
    (new Date(booking.startTime).getTime() - Date.now()) / (1000 * 60 * 60);

  let refundPercentage = 0;

  if (booking.cancellationPolicy) {
    if (hoursUntilBooking >= booking.cancellationPolicy.fullRefundHours) {
      refundPercentage = 100;
    } else if (hoursUntilBooking >= booking.cancellationPolicy.partialRefundHours) {
      refundPercentage = booking.cancellationPolicy.partialRefundPercent;
    }
  } else {
    // Default policy: full refund if more than 24 hours
    refundPercentage = hoursUntilBooking >= 24 ? 100 : 0;
  }

  const refundAmount = (Number(booking.totalAmount) * refundPercentage) / 100;

  // Process refund if applicable
  if (refundAmount > 0 && booking.payments.length > 0) {
    const payment = booking.payments[0];

    try {
      if (payment.method === 'STRIPE' && payment.stripePaymentIntentId) {
        await createRefund(payment.stripePaymentIntentId, refundAmount);
      } else if (payment.method === 'VIPPS' && payment.vippsOrderId) {
        await vippsClient.refundPayment(
          payment.vippsOrderId,
          Math.round(refundAmount * 100)
        );
      }

      // Update booking with refund info
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          refundAmount,
          refundStatus: 'PROCESSING',
        },
      });
    } catch (error) {
      console.error('Refund processing error:', error);
      // Continue with cancellation even if refund fails
    }
  }
}
