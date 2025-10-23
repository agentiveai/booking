/**
 * Email Template Renderer
 *
 * Renders email templates with dynamic variables
 */

import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { Booking, Service, User, StaffMember } from '@prisma/client';

export interface TemplateVariables {
  // Customer details
  customerName: string;
  customerEmail: string;
  customerPhone?: string;

  // Provider details
  providerName: string;
  providerBusinessName?: string;
  providerEmail: string;
  providerPhone?: string;

  // Staff details (if applicable)
  staffName?: string;
  staffTitle?: string;

  // Service details
  serviceName: string;
  serviceDescription?: string;
  serviceDuration: number; // minutes
  servicePrice: number;
  serviceCurrency: string;

  // Booking details
  bookingId: string;
  bookingDate: string; // Formatted: "mandag 20. oktober 2025"
  bookingTime: string; // Formatted: "14:00"
  bookingDateTime: string; // Formatted: "mandag 20. oktober 2025 kl 14:00"
  bookingEndTime: string; // Formatted: "15:00"
  bookingStatus: string;
  bookingNotes?: string;

  // URLs
  cancellationUrl: string;
  rescheduleUrl: string;
  providerProfileUrl: string;

  // Additional
  totalAmount: number;
  depositAmount?: number;
  refundAmount?: number;

  // Brand colors (optional)
  brandColor?: string;
  brandColorDark?: string;
}

/**
 * Render template with variables
 * Replaces {{variableName}} with actual values
 */
export function renderTemplate(template: string, variables: TemplateVariables): string {
  let rendered = template;

  // Replace all variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    rendered = rendered.replace(regex, String(value || ''));
  });

  // Remove any unmatched variables
  rendered = rendered.replace(/{{[^}]+}}/g, '');

  return rendered;
}

/**
 * Generate template variables from booking data
 */
export interface BookingWithRelations extends Booking {
  customer: User;
  provider: User;
  service: Service;
  staff?: StaffMember | null;
}

export function generateTemplateVariables(
  booking: BookingWithRelations,
  baseUrl: string
): TemplateVariables {
  const formattedDate = format(booking.startTime, 'EEEE d. MMMM yyyy', { locale: nb });
  const formattedTime = format(booking.startTime, 'HH:mm', { locale: nb });
  const formattedEndTime = format(booking.endTime, 'HH:mm', { locale: nb });

  return {
    // Customer
    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    customerPhone: booking.customerPhone || undefined,

    // Provider
    providerName: booking.provider.name,
    providerBusinessName: booking.provider.businessName || undefined,
    providerEmail: booking.provider.email,
    providerPhone: booking.provider.phone || undefined,

    // Staff
    staffName: booking.staff?.name,
    staffTitle: booking.staff?.title || undefined,

    // Service
    serviceName: booking.service.name,
    serviceDescription: booking.service.description || undefined,
    serviceDuration: booking.service.duration,
    servicePrice: Number(booking.service.price),
    serviceCurrency: booking.service.currency,

    // Booking
    bookingId: booking.id,
    bookingDate: formattedDate,
    bookingTime: formattedTime,
    bookingDateTime: `${formattedDate} kl ${formattedTime}`,
    bookingEndTime: formattedEndTime,
    bookingStatus: translateStatus(booking.status),
    bookingNotes: booking.notes || undefined,

    // URLs
    cancellationUrl: `${baseUrl}/booking/${booking.id}/cancel`,
    rescheduleUrl: `${baseUrl}/booking/${booking.id}/reschedule`,
    providerProfileUrl: `${baseUrl}/book/${booking.provider.id}`,

    // Amounts
    totalAmount: Number(booking.totalAmount),
    depositAmount: booking.depositAmount ? Number(booking.depositAmount) : undefined,
    refundAmount: booking.refundAmount ? Number(booking.refundAmount) : undefined,

    // Brand colors
    brandColor: booking.provider.brandColor,
    brandColorDark: booking.provider.brandColorDark,
  };
}

/**
 * Translate booking status to Norwegian
 */
function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    PENDING: 'Venter',
    CONFIRMED: 'Bekreftet',
    CANCELLED: 'Avbestilt',
    NO_SHOW: 'Motte ikke opp',
    COMPLETED: 'Fullfort',
  };

  return translations[status] || status;
}

/**
 * Default email template with styling
 */
export function getDefaultTemplate(type: 'confirmation' | 'reminder' | 'cancellation'): {
  subject: string;
  html: string;
} {
  const baseStyles = `
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .email-container {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: {{brandColor}};
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 30px 20px;
    }
    .booking-card {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid {{brandColor}};
    }
    .info-row {
      display: flex;
      margin: 10px 0;
    }
    .label {
      font-weight: 600;
      color: #6b7280;
      min-width: 120px;
    }
    .value {
      color: #111827;
    }
    .button {
      display: inline-block;
      background: {{brandColor}};
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 600;
    }
    .button:hover {
      background: {{brandColorDark}};
    }
    .footer {
      background: #f3f4f6;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
    }
  `;

  if (type === 'confirmation') {
    return {
      subject: 'Booking bekreftet - {{serviceName}}',
      html: `
        <!DOCTYPE html>
        <html lang="no">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${baseStyles}</style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1> Booking Bekreftet</h1>
            </div>
            <div class="content">
              <p>Hei {{customerName}},</p>
              <p>Din booking er bekreftet! Her er detaljene:</p>

              <div class="booking-card">
                <div class="info-row">
                  <span class="label">Tjeneste:</span>
                  <span class="value">{{serviceName}}</span>
                </div>
                <div class="info-row">
                  <span class="label">Leverand�r:</span>
                  <span class="value">{{providerBusinessName}}</span>
                </div>
                <div class="info-row">
                  <span class="label">Dato & tid:</span>
                  <span class="value">{{bookingDateTime}}</span>
                </div>
                <div class="info-row">
                  <span class="label">Varighet:</span>
                  <span class="value">{{serviceDuration}} minutter</span>
                </div>
                <div class="info-row">
                  <span class="label">Pris:</span>
                  <span class="value">{{totalAmount}} {{serviceCurrency}}</span>
                </div>
                <div class="info-row">
                  <span class="label">Booking-ID:</span>
                  <span class="value">{{bookingId}}</span>
                </div>
              </div>

              <p>Du vil motta en p�minnelse 24 timer f�r avtalen.</p>

              <center>
                <a href="{{cancellationUrl}}" class="button">Avbestill eller endre booking</a>
              </center>

              <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                Hvis du har sp�rsm�l, vennligst kontakt {{providerBusinessName}}.
              </p>
            </div>
            <div class="footer">
              <p>Dette er en automatisk generert e-post. Ikke svar p� denne meldingen.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  } else if (type === 'reminder') {
    return {
      subject: 'P�minnelse: {{serviceName}} i morgen kl {{bookingTime}}',
      html: `
        <!DOCTYPE html>
        <html lang="no">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${baseStyles.replace(/{{brandColor}}/g, '#f59e0b').replace(/{{brandColorDark}}/g, '#d97706')}</style>
        </head>
        <body>
          <div class="email-container">
            <div class="header" style="background: #f59e0b;">
              <h1>� P�minnelse: Din avtale i morgen</h1>
            </div>
            <div class="content">
              <p>Hei {{customerName}},</p>
              <p>Dette er en p�minnelse om din avtale i morgen:</p>

              <div class="booking-card" style="border-left-color: #f59e0b;">
                <div class="info-row">
                  <span class="label">Tjeneste:</span>
                  <span class="value">{{serviceName}}</span>
                </div>
                <div class="info-row">
                  <span class="label">Leverand�r:</span>
                  <span class="value">{{providerBusinessName}}</span>
                </div>
                <div class="info-row">
                  <span class="label">Dato & tid:</span>
                  <span class="value">{{bookingDateTime}}</span>
                </div>
              </div>

              <p>Vi gleder oss til � se deg!</p>

              <center>
                <a href="{{cancellationUrl}}" class="button" style="background: #f59e0b;">Avbestill hvis n�dvendig</a>
              </center>

              <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                Hvis du trenger � avbestille, vennligst gj�r det s� snart som mulig.
              </p>
            </div>
            <div class="footer">
              <p>Dette er en automatisk generert e-post. Ikke svar p� denne meldingen.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  } else { // cancellation
    return {
      subject: 'Booking avbestilt - {{serviceName}}',
      html: `
        <!DOCTYPE html>
        <html lang="no">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${baseStyles.replace(/{{brandColor}}/g, '#dc2626').replace(/{{brandColorDark}}/g, '#b91c1c')}</style>
        </head>
        <body>
          <div class="email-container">
            <div class="header" style="background: #dc2626;">
              <h1>L Booking Avbestilt</h1>
            </div>
            <div class="content">
              <p>Hei {{customerName}},</p>
              <p>Din booking har blitt avbestilt:</p>

              <div class="booking-card" style="border-left-color: #dc2626;">
                <div class="info-row">
                  <span class="label">Tjeneste:</span>
                  <span class="value">{{serviceName}}</span>
                </div>
                <div class="info-row">
                  <span class="label">Dato & tid:</span>
                  <span class="value">{{bookingDateTime}}</span>
                </div>
              </div>

              <p>Vi h�per � se deg igjen snart!</p>

              <center>
                <a href="{{providerProfileUrl}}" class="button" style="background: #dc2626;">Book en ny time</a>
              </center>
            </div>
            <div class="footer">
              <p>Dette er en automatisk generert e-post. Ikke svar p� denne meldingen.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  }
}
