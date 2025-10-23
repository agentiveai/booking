import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { triggerWorkflows } from '@/lib/workflows/executor';
import { WorkflowTrigger } from '@prisma/client';
import { createRefund } from '@/lib/payments/stripe';
import { vippsClient } from '@/lib/payments/vipps';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { customerEmail } = await request.json();

    if (!customerEmail) {
      return NextResponse.json(
        { error: 'E-post er påkrevd' },
        { status: 400 }
      );
    }

    // Get the booking
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        service: true,
        provider: {
          select: {
            name: true,
            businessName: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking ikke funnet' },
        { status: 404 }
      );
    }

    // Verify the customer email matches
    if (booking.customerEmail.toLowerCase() !== customerEmail.toLowerCase()) {
      return NextResponse.json(
        { error: 'Ugyldig e-postadresse for denne bookingen' },
        { status: 403 }
      );
    }

    // Check if booking can be cancelled
    if (booking.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Denne bookingen er allerede avbestilt' },
        { status: 400 }
      );
    }

    if (booking.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Denne bookingen er allerede fullført og kan ikke avbestilles' },
        { status: 400 }
      );
    }

    if (new Date(booking.endTime) < new Date()) {
      return NextResponse.json(
        { error: 'Du kan ikke avbestille en booking som har passert' },
        { status: 400 }
      );
    }

    // Calculate refund amount based on time until booking
    const hoursUntilBooking =
      (new Date(booking.startTime).getTime() - Date.now()) / (1000 * 60 * 60);

    let refundPercentage = 100;
    let refundMessage = 'Du vil motta full refundering.';

    // Default cancellation policy: full refund if more than 24 hours
    if (hoursUntilBooking < 24) {
      refundPercentage = 0;
      refundMessage = 'Det blir ingen refundering da det er mindre enn 24 timer til avtalen.';
    }

    const refundAmount = (Number(booking.totalAmount) * refundPercentage) / 100;

    // Process refund if eligible
    if (refundPercentage > 0) {
      // Get payment record
      const payment = await prisma.payment.findFirst({
        where: { bookingId: id },
        orderBy: { createdAt: 'desc' },
      });

      if (payment) {
        try {
          // Process refund based on payment method
          if (payment.method === 'STRIPE' && payment.stripePaymentIntentId) {
            await createRefund(
              payment.stripePaymentIntentId,
              refundAmount,
              'requested_by_customer'
            );
            console.log(`Stripe refund initiated for booking ${id}: ${refundAmount} NOK`);
          } else if (payment.method === 'VIPPS' && payment.vippsOrderId) {
            await vippsClient.refundPayment(
              payment.vippsOrderId,
              Math.round(refundAmount * 100) // Convert to øre
            );
            console.log(`Vipps refund initiated for booking ${id}: ${refundAmount} NOK`);
          }

          // Update payment status
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'REFUNDED',
            },
          });
        } catch (refundError) {
          console.error('Refund processing error:', refundError);
          // Continue with cancellation even if refund fails
          // Update refund status to show manual processing needed
          refundMessage = 'Bookingen er avbestilt. Refundering vil bli behandlet manuelt innen 5-7 virkedager.';
        }
      }
    }

    // Update booking status
    await prisma.booking.update({
      where: { id: id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        // Note: cancelledBy is optional for customer cancellations
        refundAmount: refundAmount,
        refundStatus: refundPercentage > 0 ? 'PROCESSING' : null,
      },
    });

    // Trigger cancellation workflows (async, don't wait)
    triggerWorkflows(WorkflowTrigger.BOOKING_CANCELLED, id)
      .catch((error) => console.error('Failed to trigger BOOKING_CANCELLED workflows:', error));

    return NextResponse.json({
      message: 'Bookingen er avbestilt',
      refundPercentage,
      refundMessage,
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return NextResponse.json(
      { error: 'Noe gikk galt. Prøv igjen senere.' },
      { status: 500 }
    );
  }
}
