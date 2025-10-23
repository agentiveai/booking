import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

export interface CreatePaymentIntentOptions {
  amount: number; // Amount in NOK (smallest currency unit, øre)
  currency?: string;
  customerId?: string;
  metadata?: Record<string, string>;
  captureMethod?: 'automatic' | 'manual';
  description?: string;
}

/**
 * Create a payment intent for booking
 */
export async function createPaymentIntent(
  options: CreatePaymentIntentOptions
): Promise<Stripe.PaymentIntent> {
  const {
    amount,
    currency = 'nok',
    customerId,
    metadata,
    captureMethod = 'manual', // Default to manual for authorization holds
    description,
  } = options;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to øre
    currency,
    customer: customerId,
    metadata,
    capture_method: captureMethod,
    description,
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return paymentIntent;
}

/**
 * Capture an authorized payment
 */
export async function capturePayment(
  paymentIntentId: string,
  amountToCapture?: number
): Promise<Stripe.PaymentIntent> {
  const captureOptions: Stripe.PaymentIntentCaptureParams = {};

  if (amountToCapture !== undefined) {
    captureOptions.amount_to_capture = Math.round(amountToCapture * 100);
  }

  return await stripe.paymentIntents.capture(paymentIntentId, captureOptions);
}

/**
 * Cancel a payment intent (release authorization hold)
 */
export async function cancelPayment(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.cancel(paymentIntentId);
}

/**
 * Create a refund
 */
export async function createRefund(
  paymentIntentId: string,
  amount?: number,
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
): Promise<Stripe.Refund> {
  const refundOptions: Stripe.RefundCreateParams = {
    payment_intent: paymentIntentId,
    reason: reason || 'requested_by_customer',
  };

  if (amount !== undefined) {
    refundOptions.amount = Math.round(amount * 100);
  }

  return await stripe.refunds.create(refundOptions);
}

/**
 * Create a customer in Stripe
 */
export async function createCustomer(
  email: string,
  name: string,
  metadata?: Record<string, string>
): Promise<Stripe.Customer> {
  return await stripe.customers.create({
    email,
    name,
    metadata,
  });
}

/**
 * Retrieve a payment intent
 */
export async function getPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.retrieve(paymentIntentId);
}

/**
 * Construct webhook event from raw body
 */
export async function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Promise<Stripe.Event> {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

export default stripe;
