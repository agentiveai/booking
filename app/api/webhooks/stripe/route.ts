import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma/client';
import { sendBookingConfirmation } from '@/lib/email/sendgrid';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * Stripe webhook handler
 * Handles payment_intent.succeeded and payment_intent.payment_failed events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailure(paymentIntent);
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentCancellation(paymentIntent);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata.bookingId;

  if (!bookingId) {
    console.error('No bookingId in payment metadata');
    return;
  }

  try {
    // Update payment record
    const payment = await prisma.payment.findFirst({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (!payment) {
      console.error(`Payment not found for intent ${paymentIntent.id}`);
      return;
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
      },
    });

    // Update booking status
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED' },
      include: {
        service: {
          include: { provider: true },
        },
        staff: true,
      },
    });

    // Send confirmation email
    await sendBookingConfirmation(booking.customerEmail, {
      customerName: booking.customerName,
      serviceName: booking.service.name,
      providerName: booking.service.provider.name,
      providerBusinessName: booking.service.provider.businessName || undefined,
      staffName: booking.staff?.name,
      startTime: booking.startTime,
      endTime: booking.endTime,
      totalAmount: Number(booking.totalAmount),
      bookingId: booking.id,
      cancellationUrl: `${process.env.APP_URL}/booking/cancel/${booking.id}`,
    });

    console.log(`Booking ${bookingId} confirmed after payment success`);
  } catch (error) {
    console.error(`Failed to handle payment success for booking ${bookingId}:`, error);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata.bookingId;

  if (!bookingId) {
    console.error('No bookingId in payment metadata');
    return;
  }

  try {
    // Update payment record
    const payment = await prisma.payment.findFirst({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (!payment) {
      console.error(`Payment not found for intent ${paymentIntent.id}`);
      return;
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        processedAt: new Date(),
      },
    });

    // Update booking status to cancelled
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
    });

    console.log(`Booking ${bookingId} cancelled due to payment failure`);
  } catch (error) {
    console.error(`Failed to handle payment failure for booking ${bookingId}:`, error);
  }
}

/**
 * Handle cancelled payment
 */
async function handlePaymentCancellation(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata.bookingId;

  if (!bookingId) {
    console.error('No bookingId in payment metadata');
    return;
  }

  try {
    // Update payment record
    const payment = await prisma.payment.findFirst({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (!payment) {
      console.error(`Payment not found for intent ${paymentIntent.id}`);
      return;
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'CANCELLED',
        processedAt: new Date(),
      },
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
    });

    console.log(`Booking ${bookingId} cancelled due to payment cancellation`);
  } catch (error) {
    console.error(`Failed to handle payment cancellation for booking ${bookingId}:`, error);
  }
}
