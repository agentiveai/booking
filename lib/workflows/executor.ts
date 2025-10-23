/**
 * Workflow Executor
 *
 * Executes workflow actions based on triggers
 */

import { prisma } from '@/lib/prisma/client';
import { WorkflowTrigger, Booking, Workflow } from '@prisma/client';
import { sendEmail } from '@/lib/email/sendgrid';
import { generateTemplateVariables, renderTemplate } from '@/lib/email/templates/renderer';

export interface WorkflowAction {
  type: 'EMAIL' | 'SMS' | 'WEBHOOK';
  templateId?: string;
  templateType?: 'confirmation' | 'reminder' | 'cancellation' | 'custom';
  subject?: string;
  content?: string;
  recipientType: 'CUSTOMER' | 'PROVIDER' | 'STAFF' | 'CUSTOM';
  customEmail?: string;
  webhookUrl?: string;
  smsMessage?: string;
}

/**
 * Execute workflows for a specific trigger
 */
export async function executeWorkflowsForTrigger(
  trigger: WorkflowTrigger,
  bookingId: string
): Promise<{
  success: boolean;
  executed: number;
  failed: number;
  errors: string[];
}> {
  try {
    // Fetch booking with all relations
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        provider: true,
        service: true,
        staff: true,
      },
    });

    if (!booking) {
      return {
        success: false,
        executed: 0,
        failed: 1,
        errors: ['Booking not found'],
      };
    }

    // Fetch active workflows for this provider and trigger
    const workflows = await prisma.workflow.findMany({
      where: {
        providerId: booking.providerId,
        trigger,
        isActive: true,
      },
    });

    if (workflows.length === 0) {
      return {
        success: true,
        executed: 0,
        failed: 0,
        errors: [],
      };
    }

    let executed = 0;
    let failed = 0;
    const errors: string[] = [];

    // Execute each workflow
    for (const workflow of workflows) {
      try {
        // Check conditions
        if (!checkWorkflowConditions(workflow, booking)) {
          continue;
        }

        // Execute actions
        const actions = workflow.actions as WorkflowAction[];
        for (const action of actions) {
          const result = await executeAction(action, booking);
          if (result.success) {
            executed++;
          } else {
            failed++;
            errors.push(`Workflow ${workflow.name}: ${result.error}`);
          }
        }
      } catch (error: any) {
        failed++;
        errors.push(`Workflow ${workflow.name}: ${error.message}`);
      }
    }

    return {
      success: failed === 0,
      executed,
      failed,
      errors,
    };
  } catch (error: any) {
    return {
      success: false,
      executed: 0,
      failed: 1,
      errors: [error.message],
    };
  }
}

/**
 * Check if workflow conditions are met
 */
function checkWorkflowConditions(workflow: Workflow, booking: any): boolean {
  if (!workflow.conditions) {
    return true;
  }

  const conditions = workflow.conditions as any;

  // Check service IDs
  if (conditions.serviceIds && Array.isArray(conditions.serviceIds)) {
    if (!conditions.serviceIds.includes(booking.serviceId)) {
      return false;
    }
  }

  // Check minimum price
  if (conditions.minPrice && Number(booking.totalAmount) < conditions.minPrice) {
    return false;
  }

  // Check maximum price
  if (conditions.maxPrice && Number(booking.totalAmount) > conditions.maxPrice) {
    return false;
  }

  // Check booking status
  if (conditions.statuses && Array.isArray(conditions.statuses)) {
    if (!conditions.statuses.includes(booking.status)) {
      return false;
    }
  }

  return true;
}

/**
 * Execute a single workflow action
 */
async function executeAction(
  action: WorkflowAction,
  booking: any
): Promise<{ success: boolean; error?: string }> {
  try {
    if (action.type === 'EMAIL') {
      return await executeEmailAction(action, booking);
    } else if (action.type === 'SMS') {
      return await executeSMSAction(action, booking);
    } else if (action.type === 'WEBHOOK') {
      return await executeWebhookAction(action, booking);
    } else {
      return {
        success: false,
        error: `Unknown action type: ${action.type}`,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Execute email action
 */
async function executeEmailAction(
  action: WorkflowAction,
  booking: any
): Promise<{ success: boolean; error?: string }> {
  try {
    // Determine recipient
    let recipientEmail: string;
    let recipientName: string;
    let recipientId: string;

    if (action.recipientType === 'CUSTOMER') {
      recipientEmail = booking.customerEmail;
      recipientName = booking.customerName;
      recipientId = booking.customerId;
    } else if (action.recipientType === 'PROVIDER') {
      recipientEmail = booking.provider.email;
      recipientName = booking.provider.name;
      recipientId = booking.providerId;
    } else if (action.recipientType === 'STAFF' && booking.staff) {
      recipientEmail = booking.staff.email;
      recipientName = booking.staff.name;
      recipientId = booking.staffId;
    } else if (action.recipientType === 'CUSTOM' && action.customEmail) {
      recipientEmail = action.customEmail;
      recipientName = 'Recipient';
      recipientId = booking.customerId; // Default to customer for logging
    } else {
      return {
        success: false,
        error: 'Invalid recipient configuration',
      };
    }

    // Generate template variables
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const variables = generateTemplateVariables(booking, baseUrl);

    // Get template content
    let subject: string;
    let htmlContent: string;

    if (action.templateId) {
      // Load custom template from database
      const template = await prisma.emailTemplate.findUnique({
        where: { id: action.templateId },
      });

      if (!template) {
        return {
          success: false,
          error: `Template not found: ${action.templateId}`,
        };
      }

      subject = renderTemplate(template.subject, variables);
      htmlContent = renderTemplate(template.htmlContent, variables);
    } else if (action.subject && action.content) {
      // Use inline content
      subject = renderTemplate(action.subject, variables);
      htmlContent = renderTemplate(action.content, variables);
    } else {
      return {
        success: false,
        error: 'No email template or content provided',
      };
    }

    // Send email
    const success = await sendEmail({
      to: recipientEmail,
      toName: recipientName,
      subject,
      html: htmlContent,
      bookingId: booking.id,
      recipientId,
      notificationType: mapTriggerToNotificationType(action.templateType),
    });

    return {
      success,
      error: success ? undefined : 'Failed to send email',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Execute SMS action (placeholder - requires Twilio integration)
 */
async function executeSMSAction(
  action: WorkflowAction,
  booking: any
): Promise<{ success: boolean; error?: string }> {
  // TODO: Implement Twilio SMS integration
  console.log('SMS action not yet implemented:', action);
  return {
    success: false,
    error: 'SMS functionality not yet implemented',
  };
}

/**
 * Execute webhook action
 */
async function executeWebhookAction(
  action: WorkflowAction,
  booking: any
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!action.webhookUrl) {
      return {
        success: false,
        error: 'Webhook URL not provided',
      };
    }

    const response = await fetch(action.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: 'booking_workflow',
        bookingId: booking.id,
        customerId: booking.customerId,
        providerId: booking.providerId,
        serviceId: booking.serviceId,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        totalAmount: booking.totalAmount,
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Webhook returned ${response.status}: ${response.statusText}`,
      };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Map template type to notification type
 */
function mapTriggerToNotificationType(templateType?: string): any {
  const mapping: Record<string, string> = {
    confirmation: 'BOOKING_CONFIRMATION',
    reminder: 'BOOKING_REMINDER_24H',
    cancellation: 'BOOKING_CANCELLED',
  };

  return mapping[templateType || ''] || 'BOOKING_CONFIRMATION';
}

/**
 * Trigger workflows immediately
 */
export async function triggerWorkflows(
  trigger: WorkflowTrigger,
  bookingId: string
): Promise<void> {
  // Execute workflows in background (don't await)
  executeWorkflowsForTrigger(trigger, bookingId)
    .then((result) => {
      if (!result.success) {
        console.error('Workflow execution errors:', result.errors);
      } else {
        console.log(`Executed ${result.executed} workflow actions for booking ${bookingId}`);
      }
    })
    .catch((error) => {
      console.error('Failed to execute workflows:', error);
    });
}
