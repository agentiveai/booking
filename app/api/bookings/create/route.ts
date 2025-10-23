import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createBookingWithLock } from '@/lib/utils/availability';
import { createPaymentIntent } from '@/lib/payments/stripe';
import { vippsClient } from '@/lib/payments/vipps';
import { sendBookingConfirmation } from '@/lib/email/sendgrid';
import prisma from '@/lib/prisma/client';
import { triggerWorkflows } from '@/lib/workflows/executor';
import { WorkflowTrigger } from '@prisma/client';
import { withRateLimit, RateLimitPresets } from '@/lib/utils/rate-limit';

const createBookingSchema = z.object({
  providerId: z.string(),
  serviceId: z.string(),
  startTime: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid startTime format',
  }),
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(['STRIPE', 'VIPPS', 'CASH']),
  depositAmount: z.number().optional(),
  customerId: z.string().optional(), // For logged-in users
});

// Apply rate limiting to prevent booking spam
export const POST = withRateLimit(RateLimitPresets.api, async (request: NextRequest) => {
  try {
    const body = await request.json();
    const validatedData = createBookingSchema.parse(body);

    // Get service details
    const service = await prisma.service.findUnique({
      where: { id: validatedData.serviceId },
      include: { provider: true },
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Calculate end time
    const startTime = new Date(validatedData.startTime);
    const endTime = new Date(startTime.getTime() + service.duration * 60 * 1000);

    // Determine customer ID (create guest if not logged in)
    let customerId = validatedData.customerId;

    if (!customerId) {
      // Check if customer exists
      let customer = await prisma.user.findUnique({
        where: { email: validatedData.customerEmail },
      });

      // Create customer if doesn't exist
      if (!customer) {
        customer = await prisma.user.create({
          data: {
            email: validatedData.customerEmail,
            name: validatedData.customerName,
            phone: validatedData.customerPhone,
            role: 'CUSTOMER',
          },
        });
      }

      customerId = customer.id;
    }

    // Determine total amount and deposit
    const totalAmount = Number(service.price);
    const depositAmount = validatedData.depositAmount || totalAmount;

    // Create booking with lock to prevent double-booking
    const booking = await createBookingWithLock({
      providerId: validatedData.providerId,
      customerId,
      serviceId: validatedData.serviceId,
      startTime,
      endTime,
      customerName: validatedData.customerName,
      customerEmail: validatedData.customerEmail,
      customerPhone: validatedData.customerPhone,
      totalAmount,
      depositAmount,
      notes: validatedData.notes,
    });

    // Handle payment
    let paymentData: any = null;

    if (validatedData.paymentMethod === 'STRIPE') {
      // Create Stripe payment intent
      const paymentIntent = await createPaymentIntent({
        amount: depositAmount,
        metadata: {
          bookingId: booking.id,
          customerId: booking.customerId,
        },
        description: `${service.name} - ${service.provider.businessName || service.provider.name}`,
      });

      // Store payment record
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: depositAmount,
          method: 'STRIPE',
          status: 'PENDING',
          stripePaymentIntentId: paymentIntent.id,
          captureMethod: 'manual',
        },
      });

      paymentData = {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } else if (validatedData.paymentMethod === 'VIPPS') {
      // Create Vipps payment
      const vippsPayment = await vippsClient.createPayment({
        amount: Math.round(depositAmount * 100), // Convert to øre
        orderId: booking.id,
        returnUrl: `${process.env.APP_URL}/booking/confirmation/${booking.id}`,
        description: `${service.name} - ${service.provider.businessName || service.provider.name}`,
        customerPhone: validatedData.customerPhone,
      });

      // Store payment record
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: depositAmount,
          method: 'VIPPS',
          status: 'PENDING',
          vippsOrderId: booking.id,
        },
      });

      paymentData = {
        redirectUrl: vippsPayment.url,
        orderId: vippsPayment.orderId,
      };
    }

    // Update booking with payment method
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentMethod: validatedData.paymentMethod,
        status: validatedData.paymentMethod === 'CASH' ? 'CONFIRMED' : 'PENDING',
      },
    });

    // Trigger workflows for booking creation (async, don't wait)
    triggerWorkflows(WorkflowTrigger.BOOKING_CREATED, booking.id)
      .catch((error) => console.error('Failed to trigger BOOKING_CREATED workflows:', error));

    // If booking is confirmed, trigger confirmation workflows
    if (updatedBooking.status === 'CONFIRMED') {
      triggerWorkflows(WorkflowTrigger.BOOKING_CONFIRMED, booking.id)
        .catch((error) => console.error('Failed to trigger BOOKING_CONFIRMED workflows:', error));
    }

    // Send confirmation email (async, don't wait)
    if (validatedData.paymentMethod === 'CASH') {
      // Fetch booking with staff details
      const bookingWithStaff = await prisma.booking.findUnique({
        where: { id: booking.id },
        include: { staff: true },
      });

      sendBookingConfirmation(validatedData.customerEmail, {
        customerName: validatedData.customerName,
        serviceName: service.name,
        providerName: service.provider.name,
        providerBusinessName: service.provider.businessName || undefined,
        staffName: bookingWithStaff?.staff?.name,
        startTime,
        endTime,
        totalAmount,
        bookingId: booking.id,
        cancellationUrl: `${process.env.APP_URL}/booking/cancel/${booking.id}`,
      }).catch((error) => console.error('Failed to send confirmation email:', error));
    }

    return NextResponse.json(
      {
        booking: {
          id: booking.id,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status,
          totalAmount: booking.totalAmount,
          depositAmount: booking.depositAmount,
        },
        payment: paymentData,
        message: 'Booking created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    if (error.message === 'Time slot is no longer available') {
      return NextResponse.json(
        { error: 'Time slot is no longer available' },
        { status: 409 }
      );
    }

    console.error('Booking creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
