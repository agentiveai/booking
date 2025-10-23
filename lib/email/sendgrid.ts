import sgMail from '@sendgrid/mail';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { prisma } from '@/lib/prisma/client';
import { NotificationStatus, NotificationType, NotificationChannel } from '@prisma/client';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@booking.no';
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'Booking Platform';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface EmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  bookingId?: string;
  recipientId?: string;
  notificationType?: NotificationType;
}

/**
 * Send email using SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.error('SendGrid API key not configured');

    // Log notification as failed
    if (options.bookingId && options.recipientId && options.notificationType) {
      await logNotification({
        bookingId: options.bookingId,
        recipientId: options.recipientId,
        type: options.notificationType,
        channel: NotificationChannel.EMAIL,
        subject: options.subject,
        content: options.text || stripHtml(options.html),
        status: NotificationStatus.FAILED,
        failureReason: 'SendGrid API key not configured',
      });
    }

    return false;
  }

  try {
    const response = await sgMail.send({
      to: {
        email: options.to,
        name: options.toName,
      },
      from: {
        email: options.from || FROM_EMAIL,
        name: options.fromName || FROM_NAME,
      },
      subject: options.subject,
      html: options.html,
      text: options.text || stripHtml(options.html),
      replyTo: options.replyTo,
    });

    const messageId = response[0]?.headers?.['x-message-id'] || 'unknown';

    // Log successful notification
    if (options.bookingId && options.recipientId && options.notificationType) {
      await logNotification({
        bookingId: options.bookingId,
        recipientId: options.recipientId,
        type: options.notificationType,
        channel: NotificationChannel.EMAIL,
        subject: options.subject,
        content: options.text || stripHtml(options.html),
        status: NotificationStatus.SENT,
        sendgridMessageId: messageId,
      });
    }

    return true;
  } catch (error: any) {
    console.error('Failed to send email:', error);

    // Log failed notification
    if (options.bookingId && options.recipientId && options.notificationType) {
      await logNotification({
        bookingId: options.bookingId,
        recipientId: options.recipientId,
        type: options.notificationType,
        channel: NotificationChannel.EMAIL,
        subject: options.subject,
        content: options.text || stripHtml(options.html),
        status: NotificationStatus.FAILED,
        failureReason: error.message || 'Unknown SendGrid error',
      });
    }

    return false;
  }
}

/**
 * Log notification to database
 */
interface LogNotificationOptions {
  bookingId: string;
  recipientId: string;
  type: NotificationType;
  channel: NotificationChannel;
  subject?: string;
  content: string;
  status: NotificationStatus;
  sendgridMessageId?: string;
  failureReason?: string;
}

async function logNotification(options: LogNotificationOptions) {
  try {
    await prisma.notification.create({
      data: {
        bookingId: options.bookingId,
        recipientId: options.recipientId,
        type: options.type,
        channel: options.channel,
        subject: options.subject,
        content: options.content,
        status: options.status,
        sendgridMessageId: options.sendgridMessageId,
        failureReason: options.failureReason,
        sentAt: options.status === NotificationStatus.SENT ? new Date() : null,
      },
    });
  } catch (error) {
    console.error('Failed to log notification:', error);
  }
}

/**
 * Strip HTML tags for plain text
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmation(
  to: string,
  bookingDetails: {
    customerName: string;
    serviceName: string;
    providerName: string;
    providerBusinessName?: string;
    staffName?: string;
    startTime: Date;
    endTime: Date;
    totalAmount: number;
    bookingId: string;
    customerId: string;
    cancellationUrl: string;
  }
): Promise<boolean> {
  const formattedDate = format(bookingDetails.startTime, 'EEEE d. MMMM yyyy', { locale: nb });
  const formattedTime = format(bookingDetails.startTime, 'HH:mm', { locale: nb });
  const duration = Math.round((bookingDetails.endTime.getTime() - bookingDetails.startTime.getTime()) / (1000 * 60));

  const html = `
    <!DOCTYPE html>
    <html lang="no">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px 20px; border: 1px solid #e5e7eb; border-top: none; }
        .booking-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
        .info-row { margin: 10px 0; }
        .label { font-weight: 600; color: #6b7280; }
        .value { color: #111827; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-radius: 0 0 8px 8px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>✅ Booking Bekreftet</h1>
      </div>
      <div class="content">
        <p>Hei ${bookingDetails.customerName},</p>
        <p>Din booking er bekreftet! Her er detaljene:</p>

        <div class="booking-card">
          <div class="info-row">
            <span class="label">Tjeneste:</span>
            <span class="value">${bookingDetails.serviceName}</span>
          </div>
          <div class="info-row">
            <span class="label">Leverandør:</span>
            <span class="value">${bookingDetails.providerBusinessName || bookingDetails.providerName}</span>
          </div>
          ${bookingDetails.staffName ? `
          <div class="info-row">
            <span class="label">Utføres av:</span>
            <span class="value">${bookingDetails.staffName}</span>
          </div>
          ` : ''}
          <div class="info-row">
            <span class="label">Dato:</span>
            <span class="value">${formattedDate}</span>
          </div>
          <div class="info-row">
            <span class="label">Tid:</span>
            <span class="value">${formattedTime} (${duration} minutter)</span>
          </div>
          <div class="info-row">
            <span class="label">Pris:</span>
            <span class="value">${bookingDetails.totalAmount.toFixed(2)} NOK</span>
          </div>
          <div class="info-row">
            <span class="label">Booking-ID:</span>
            <span class="value">${bookingDetails.bookingId}</span>
          </div>
        </div>

        <p>Du vil motta en påminnelse 24 timer før avtalen.</p>

        <center>
          <a href="${bookingDetails.cancellationUrl}" class="button">Avbestill eller endre booking</a>
        </center>

        <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
          Hvis du har spørsmål, vennligst kontakt ${bookingDetails.providerBusinessName || bookingDetails.providerName}.
        </p>
      </div>
      <div class="footer">
        <p>Dette er en automatisk generert e-post. Ikke svar på denne meldingen.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    toName: bookingDetails.customerName,
    subject: `Booking bekreftet - ${bookingDetails.serviceName}`,
    html,
    bookingId: bookingDetails.bookingId,
    recipientId: bookingDetails.customerId,
    notificationType: NotificationType.BOOKING_CONFIRMATION,
  });
}

/**
 * Send 24-hour reminder email
 */
export async function send24HourReminder(
  to: string,
  bookingDetails: {
    customerName: string;
    serviceName: string;
    providerName: string;
    providerBusinessName?: string;
    staffName?: string;
    startTime: Date;
    bookingId: string;
    customerId: string;
    cancellationUrl: string;
  }
): Promise<boolean> {
  const formattedDate = format(bookingDetails.startTime, 'EEEE d. MMMM yyyy', { locale: nb });
  const formattedTime = format(bookingDetails.startTime, 'HH:mm', { locale: nb });

  const html = `
    <!DOCTYPE html>
    <html lang="no">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px 20px; border: 1px solid #e5e7eb; border-top: none; }
        .reminder-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
        .info-row { margin: 10px 0; }
        .label { font-weight: 600; color: #6b7280; }
        .value { color: #111827; }
        .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-radius: 0 0 8px 8px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>⏰ Påminnelse: Din avtale i morgen</h1>
      </div>
      <div class="content">
        <p>Hei ${bookingDetails.customerName},</p>
        <p>Dette er en påminnelse om din avtale i morgen:</p>

        <div class="reminder-card">
          <div class="info-row">
            <span class="label">Tjeneste:</span>
            <span class="value">${bookingDetails.serviceName}</span>
          </div>
          <div class="info-row">
            <span class="label">Leverandør:</span>
            <span class="value">${bookingDetails.providerBusinessName || bookingDetails.providerName}</span>
          </div>
          ${bookingDetails.staffName ? `
          <div class="info-row">
            <span class="label">Utføres av:</span>
            <span class="value">${bookingDetails.staffName}</span>
          </div>
          ` : ''}
          <div class="info-row">
            <span class="label">Dato:</span>
            <span class="value">${formattedDate}</span>
          </div>
          <div class="info-row">
            <span class="label">Tid:</span>
            <span class="value">${formattedTime}</span>
          </div>
        </div>

        <p>Vi gleder oss til å se deg!</p>

        <center>
          <a href="${bookingDetails.cancellationUrl}" class="button">Avbestill hvis nødvendig</a>
        </center>

        <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
          Hvis du trenger å avbestille, vennligst gjør det så snart som mulig.
        </p>
      </div>
      <div class="footer">
        <p>Dette er en automatisk generert e-post. Ikke svar på denne meldingen.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    toName: bookingDetails.customerName,
    subject: `Påminnelse: ${bookingDetails.serviceName} i morgen kl ${formattedTime}`,
    html,
    bookingId: bookingDetails.bookingId,
    recipientId: bookingDetails.customerId,
    notificationType: NotificationType.BOOKING_REMINDER_24H,
  });
}

/**
 * Send cancellation confirmation email
 */
export async function sendCancellationConfirmation(
  to: string,
  bookingDetails: {
    customerName: string;
    serviceName: string;
    startTime: Date;
    bookingId: string;
    customerId: string;
    refundAmount?: number;
  }
): Promise<boolean> {
  const formattedDate = format(bookingDetails.startTime, 'EEEE d. MMMM yyyy', { locale: nb });
  const formattedTime = format(bookingDetails.startTime, 'HH:mm', { locale: nb });

  const refundInfo = bookingDetails.refundAmount
    ? `<p>En refusjon på ${bookingDetails.refundAmount.toFixed(2)} NOK vil bli behandlet innen 5-10 virkedager.</p>`
    : '';

  const html = `
    <!DOCTYPE html>
    <html lang="no">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px 20px; border: 1px solid #e5e7eb; border-top: none; }
        .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-radius: 0 0 8px 8px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>❌ Booking Avbestilt</h1>
      </div>
      <div class="content">
        <p>Hei ${bookingDetails.customerName},</p>
        <p>Din booking har blitt avbestilt:</p>

        <ul>
          <li><strong>Tjeneste:</strong> ${bookingDetails.serviceName}</li>
          <li><strong>Dato:</strong> ${formattedDate}</li>
          <li><strong>Tid:</strong> ${formattedTime}</li>
        </ul>

        ${refundInfo}

        <p>Vi håper å se deg igjen snart!</p>
      </div>
      <div class="footer">
        <p>Dette er en automatisk generert e-post. Ikke svar på denne meldingen.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    toName: bookingDetails.customerName,
    subject: `Booking avbestilt - ${bookingDetails.serviceName}`,
    html,
    bookingId: bookingDetails.bookingId,
    recipientId: bookingDetails.customerId,
    notificationType: NotificationType.BOOKING_CANCELLED,
  });
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return Boolean(SENDGRID_API_KEY && FROM_EMAIL);
}

/**
 * Get email configuration status
 */
export function getEmailConfig() {
  return {
    configured: isEmailConfigured(),
    fromEmail: FROM_EMAIL,
    fromName: FROM_NAME,
    apiKeyConfigured: Boolean(SENDGRID_API_KEY),
  };
}
