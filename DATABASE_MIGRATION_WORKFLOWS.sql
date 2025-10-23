-- Phase 3: Workflows & Automations - Database Migration
-- Run this SQL directly in your database when it's available

-- 1. Create WorkflowTrigger enum
CREATE TYPE "WorkflowTrigger" AS ENUM (
  'BOOKING_CREATED',
  'BOOKING_CONFIRMED',
  'BOOKING_CANCELLED',
  'BOOKING_COMPLETED',
  'HOURS_BEFORE_24',
  'HOURS_BEFORE_48',
  'HOURS_BEFORE_1',
  'MINUTES_BEFORE_30',
  'HOURS_AFTER_24'
);

-- 2. Create EmailTemplateType enum
CREATE TYPE "EmailTemplateType" AS ENUM (
  'CONFIRMATION',
  'REMINDER',
  'CANCELLATION',
  'RESCHEDULED',
  'FOLLOW_UP',
  'PAYMENT_RECEIPT',
  'PAYMENT_FAILED',
  'CUSTOM'
);

-- 3. Create Workflow table
CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameNo" TEXT NOT NULL,
    "description" TEXT,
    "descriptionNo" TEXT,
    "trigger" "WorkflowTrigger" NOT NULL,
    "timeOffset" INTEGER,
    "actions" JSONB NOT NULL,
    "conditions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- 4. Create EmailTemplate table
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "providerId" TEXT,
    "name" TEXT NOT NULL,
    "nameNo" TEXT NOT NULL,
    "type" "EmailTemplateType" NOT NULL,
    "subject" TEXT NOT NULL,
    "subjectNo" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "htmlContentNo" TEXT NOT NULL,
    "textContent" TEXT NOT NULL,
    "textContentNo" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- 5. Add foreign key constraints
ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_providerId_fkey"
    FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_providerId_fkey"
    FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. Create indexes for performance
CREATE INDEX "Workflow_providerId_isActive_idx" ON "Workflow"("providerId", "isActive");
CREATE INDEX "Workflow_trigger_isActive_idx" ON "Workflow"("trigger", "isActive");
CREATE INDEX "EmailTemplate_providerId_type_idx" ON "EmailTemplate"("providerId", "type");
CREATE INDEX "EmailTemplate_type_isSystem_idx" ON "EmailTemplate"("type", "isSystem");

-- 7. Insert default system email templates (Norwegian)
INSERT INTO "EmailTemplate" ("id", "providerId", "name", "nameNo", "type", "subject", "subjectNo", "htmlContent", "htmlContentNo", "textContent", "textContentNo", "isSystem", "isActive") VALUES
(
  'tpl_confirmation_default',
  NULL,
  'Booking Confirmation',
  'Bookingbekreftelse',
  'CONFIRMATION',
  'Booking confirmed - {{serviceName}}',
  'Booking bekreftet - {{serviceName}}',
  '<!DOCTYPE html><html lang="no"><head><meta charset="UTF-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}.header{background:{{brandColor}};color:white;padding:30px 20px;text-align:center;border-radius:8px 8px 0 0}.content{background:#f9fafb;padding:30px 20px;border:1px solid #e5e7eb}.booking-card{background:white;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid {{brandColor}}}.info-row{margin:10px 0}.label{font-weight:600;color:#6b7280;min-width:120px}.button{display:inline-block;background:{{brandColor}};color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin:20px 0}.footer{background:#f3f4f6;padding:20px;text-align:center;font-size:14px;color:#6b7280;border-radius:0 0 8px 8px}</style></head><body><div class="header"><h1>✅ Booking Bekreftet</h1></div><div class="content"><p>Hei {{customerName}},</p><p>Din booking er bekreftet! Her er detaljene:</p><div class="booking-card"><div class="info-row"><span class="label">Tjeneste:</span> <span>{{serviceName}}</span></div><div class="info-row"><span class="label">Leverandør:</span> <span>{{providerBusinessName}}</span></div><div class="info-row"><span class="label">Dato & tid:</span> <span>{{bookingDateTime}}</span></div><div class="info-row"><span class="label">Varighet:</span> <span>{{serviceDuration}} minutter</span></div><div class="info-row"><span class="label">Pris:</span> <span>{{totalAmount}} {{serviceCurrency}}</span></div></div><center><a href="{{cancellationUrl}}" class="button">Avbestill eller endre</a></center></div><div class="footer"><p>Dette er en automatisk e-post.</p></div></body></html>',
  '<!DOCTYPE html><html lang="no"><head><meta charset="UTF-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}.header{background:{{brandColor}};color:white;padding:30px 20px;text-align:center;border-radius:8px 8px 0 0}.content{background:#f9fafb;padding:30px 20px;border:1px solid #e5e7eb}.booking-card{background:white;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid {{brandColor}}}.info-row{margin:10px 0}.label{font-weight:600;color:#6b7280;min-width:120px}.button{display:inline-block;background:{{brandColor}};color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin:20px 0}.footer{background:#f3f4f6;padding:20px;text-align:center;font-size:14px;color:#6b7280;border-radius:0 0 8px 8px}</style></head><body><div class="header"><h1>✅ Booking Bekreftet</h1></div><div class="content"><p>Hei {{customerName}},</p><p>Din booking er bekreftet! Her er detaljene:</p><div class="booking-card"><div class="info-row"><span class="label">Tjeneste:</span> <span>{{serviceName}}</span></div><div class="info-row"><span class="label">Leverandør:</span> <span>{{providerBusinessName}}</span></div><div class="info-row"><span class="label">Dato & tid:</span> <span>{{bookingDateTime}}</span></div><div class="info-row"><span class="label">Varighet:</span> <span>{{serviceDuration}} minutter</span></div><div class="info-row"><span class="label">Pris:</span> <span>{{totalAmount}} {{serviceCurrency}}</span></div></div><center><a href="{{cancellationUrl}}" class="button">Avbestill eller endre</a></center></div><div class="footer"><p>Dette er en automatisk e-post.</p></div></body></html>',
  'Hei {{customerName}}, Din booking er bekreftet! Tjeneste: {{serviceName}} Dato: {{bookingDateTime}} Leverandør: {{providerBusinessName}} Pris: {{totalAmount}} {{serviceCurrency}}',
  'Hei {{customerName}}, Din booking er bekreftet! Tjeneste: {{serviceName}} Dato: {{bookingDateTime}} Leverandør: {{providerBusinessName}} Pris: {{totalAmount}} {{serviceCurrency}}',
  true,
  true
),
(
  'tpl_reminder_24h_default',
  NULL,
  '24-Hour Reminder',
  '24-timers påminnelse',
  'REMINDER',
  'Reminder: {{serviceName}} tomorrow at {{bookingTime}}',
  'Påminnelse: {{serviceName}} i morgen kl {{bookingTime}}',
  '<!DOCTYPE html><html lang="no"><head><meta charset="UTF-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}.header{background:#f59e0b;color:white;padding:30px 20px;text-align:center;border-radius:8px 8px 0 0}.content{background:#f9fafb;padding:30px 20px;border:1px solid #e5e7eb}.booking-card{background:white;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #f59e0b}.info-row{margin:10px 0}.label{font-weight:600;color:#6b7280}.button{display:inline-block;background:#f59e0b;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin:20px 0}.footer{background:#f3f4f6;padding:20px;text-align:center;font-size:14px;color:#6b7280;border-radius:0 0 8px 8px}</style></head><body><div class="header"><h1>⏰ Påminnelse: Din avtale i morgen</h1></div><div class="content"><p>Hei {{customerName}},</p><p>Dette er en påminnelse om din avtale i morgen:</p><div class="booking-card"><div class="info-row"><span class="label">Tjeneste:</span> <span>{{serviceName}}</span></div><div class="info-row"><span class="label">Leverandør:</span> <span>{{providerBusinessName}}</span></div><div class="info-row"><span class="label">Dato & tid:</span> <span>{{bookingDateTime}}</span></div></div><p>Vi gleder oss til å se deg!</p><center><a href="{{cancellationUrl}}" class="button">Avbestill hvis nødvendig</a></center></div><div class="footer"><p>Dette er en automatisk e-post.</p></div></body></html>',
  '<!DOCTYPE html><html lang="no"><head><meta charset="UTF-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}.header{background:#f59e0b;color:white;padding:30px 20px;text-align:center;border-radius:8px 8px 0 0}.content{background:#f9fafb;padding:30px 20px;border:1px solid #e5e7eb}.booking-card{background:white;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #f59e0b}.info-row{margin:10px 0}.label{font-weight:600;color:#6b7280}.button{display:inline-block;background:#f59e0b;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin:20px 0}.footer{background:#f3f4f6;padding:20px;text-align:center;font-size:14px;color:#6b7280;border-radius:0 0 8px 8px}</style></head><body><div class="header"><h1>⏰ Påminnelse: Din avtale i morgen</h1></div><div class="content"><p>Hei {{customerName}},</p><p>Dette er en påminnelse om din avtale i morgen:</p><div class="booking-card"><div class="info-row"><span class="label">Tjeneste:</span> <span>{{serviceName}}</span></div><div class="info-row"><span class="label">Leverandør:</span> <span>{{providerBusinessName}}</span></div><div class="info-row"><span class="label">Dato & tid:</span> <span>{{bookingDateTime}}</span></div></div><p>Vi gleder oss til å se deg!</p><center><a href="{{cancellationUrl}}" class="button">Avbestill hvis nødvendig</a></center></div><div class="footer"><p>Dette er en automatisk e-post.</p></div></body></html>',
  'Hei {{customerName}}, Påminnelse om din avtale i morgen: {{serviceName}} kl {{bookingTime}} hos {{providerBusinessName}}',
  'Hei {{customerName}}, Påminnelse om din avtale i morgen: {{serviceName}} kl {{bookingTime}} hos {{providerBusinessName}}',
  true,
  true
),
(
  'tpl_cancellation_default',
  NULL,
  'Cancellation Confirmation',
  'Avbestillingsbekreftelse',
  'CANCELLATION',
  'Booking cancelled - {{serviceName}}',
  'Booking avbestilt - {{serviceName}}',
  '<!DOCTYPE html><html lang="no"><head><meta charset="UTF-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}.header{background:#dc2626;color:white;padding:30px 20px;text-align:center;border-radius:8px 8px 0 0}.content{background:#f9fafb;padding:30px 20px;border:1px solid #e5e7eb}.booking-card{background:white;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #dc2626}.info-row{margin:10px 0}.button{display:inline-block;background:#dc2626;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin:20px 0}.footer{background:#f3f4f6;padding:20px;text-align:center;font-size:14px;color:#6b7280;border-radius:0 0 8px 8px}</style></head><body><div class="header"><h1>❌ Booking Avbestilt</h1></div><div class="content"><p>Hei {{customerName}},</p><p>Din booking har blitt avbestilt:</p><div class="booking-card"><div class="info-row"><span class="label">Tjeneste:</span> <span>{{serviceName}}</span></div><div class="info-row"><span class="label">Dato & tid:</span> <span>{{bookingDateTime}}</span></div></div><p>Vi håper å se deg igjen snart!</p><center><a href="{{providerProfileUrl}}" class="button">Book en ny time</a></center></div><div class="footer"><p>Dette er en automatisk e-post.</p></div></body></html>',
  '<!DOCTYPE html><html lang="no"><head><meta charset="UTF-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}.header{background:#dc2626;color:white;padding:30px 20px;text-align:center;border-radius:8px 8px 0 0}.content{background:#f9fafb;padding:30px 20px;border:1px solid #e5e7eb}.booking-card{background:white;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #dc2626}.info-row{margin:10px 0}.button{display:inline-block;background:#dc2626;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin:20px 0}.footer{background:#f3f4f6;padding:20px;text-align:center;font-size:14px;color:#6b7280;border-radius:0 0 8px 8px}</style></head><body><div class="header"><h1>❌ Booking Avbestilt</h1></div><div class="content"><p>Hei {{customerName}},</p><p>Din booking har blitt avbestilt:</p><div class="booking-card"><div class="info-row"><span class="label">Tjeneste:</span> <span>{{serviceName}}</span></div><div class="info-row"><span class="label">Dato & tid:</span> <span>{{bookingDateTime}}</span></div></div><p>Vi håper å se deg igjen snart!</p><center><a href="{{providerProfileUrl}}" class="button">Book en ny time</a></center></div><div class="footer"><p>Dette er en automatisk e-post.</p></div></body></html>',
  'Hei {{customerName}}, Din booking for {{serviceName}} ({{bookingDateTime}}) har blitt avbestilt. Vi håper å se deg igjen!',
  'Hei {{customerName}}, Din booking for {{serviceName}} ({{bookingDateTime}}) har blitt avbestilt. Vi håper å se deg igjen!',
  true,
  true
);

-- Migration complete!
