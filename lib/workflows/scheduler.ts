/**
 * Workflow Scheduler
 *
 * Handles time-based workflow triggers (reminders, follow-ups)
 */

import { prisma } from '@/lib/prisma/client';
import { WorkflowTrigger, BookingStatus } from '@prisma/client';
import { executeWorkflowsForTrigger } from './executor';
import { addHours, addMinutes, subHours, subMinutes, isAfter, isBefore } from 'date-fns';

/**
 * Process scheduled workflows
 * Should be called by a cron job every 5-15 minutes
 */
export async function processScheduledWorkflows(): Promise<{
  success: boolean;
  processed: number;
  errors: string[];
}> {
  const now = new Date();
  const errors: string[] = [];
  let processed = 0;

  try {
    // Process 24-hour before reminders
    await processTimeBasedTrigger({
      trigger: WorkflowTrigger.HOURS_BEFORE_24,
      hoursOffset: -24,
      now,
      onProcess: () => processed++,
      onError: (error) => errors.push(error),
    });

    // Process 48-hour before reminders
    await processTimeBasedTrigger({
      trigger: WorkflowTrigger.HOURS_BEFORE_48,
      hoursOffset: -48,
      now,
      onProcess: () => processed++,
      onError: (error) => errors.push(error),
    });

    // Process 1-hour before reminders
    await processTimeBasedTrigger({
      trigger: WorkflowTrigger.HOURS_BEFORE_1,
      hoursOffset: -1,
      now,
      onProcess: () => processed++,
      onError: (error) => errors.push(error),
    });

    // Process 30-minute before reminders
    await processTimeBasedTrigger({
      trigger: WorkflowTrigger.MINUTES_BEFORE_30,
      minutesOffset: -30,
      now,
      onProcess: () => processed++,
      onError: (error) => errors.push(error),
    });

    // Process 24-hour after follow-ups
    await processTimeBasedTrigger({
      trigger: WorkflowTrigger.HOURS_AFTER_24,
      hoursOffset: 24,
      now,
      onProcess: () => processed++,
      onError: (error) => errors.push(error),
    });

    return {
      success: errors.length === 0,
      processed,
      errors,
    };
  } catch (error: any) {
    return {
      success: false,
      processed,
      errors: [error.message],
    };
  }
}

interface TimeBasedTriggerOptions {
  trigger: WorkflowTrigger;
  hoursOffset?: number;
  minutesOffset?: number;
  now: Date;
  onProcess: () => void;
  onError: (error: string) => void;
}

/**
 * Process bookings for a specific time-based trigger
 */
async function processTimeBasedTrigger(options: TimeBasedTriggerOptions): Promise<void> {
  const { trigger, hoursOffset, minutesOffset, now, onProcess, onError } = options;

  // Calculate target time window
  let targetTime: Date;
  if (hoursOffset) {
    targetTime = hoursOffset > 0 ? subHours(now, hoursOffset) : addHours(now, Math.abs(hoursOffset));
  } else if (minutesOffset) {
    targetTime = minutesOffset > 0 ? subMinutes(now, minutesOffset) : addMinutes(now, Math.abs(minutesOffset));
  } else {
    onError(`Invalid time offset for trigger ${trigger}`);
    return;
  }

  // Define time window (plus/minus 15 minutes to catch bookings in case cron runs slightly off)
  const windowStart = subMinutes(targetTime, 15);
  const windowEnd = addMinutes(targetTime, 15);

  try {
    // Find bookings in the time window that haven't been processed for this trigger yet
    const bookings = await prisma.booking.findMany({
      where: {
        startTime: {
          gte: windowStart,
          lte: windowEnd,
        },
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.PENDING],
        },
      },
      include: {
        provider: {
          include: {
            workflows: {
              where: {
                trigger,
                isActive: true,
              },
            },
          },
        },
      },
    });

    // Filter bookings that have active workflows for this trigger
    const bookingsWithWorkflows = bookings.filter(
      (booking) => booking.provider.workflows.length > 0
    );

    // Check if notification has already been sent
    for (const booking of bookingsWithWorkflows) {
      const notificationType = mapTriggerToNotificationType(trigger);

      // Check if we've already sent this notification
      const existingNotification = await prisma.notification.findFirst({
        where: {
          bookingId: booking.id,
          type: notificationType,
          status: {
            in: ['SENT', 'DELIVERED'],
          },
        },
      });

      if (existingNotification) {
        // Already processed, skip
        continue;
      }

      // Execute workflows
      try {
        await executeWorkflowsForTrigger(trigger, booking.id);
        onProcess();
      } catch (error: any) {
        onError(`Failed to execute workflows for booking ${booking.id}: ${error.message}`);
      }
    }
  } catch (error: any) {
    onError(`Failed to process trigger ${trigger}: ${error.message}`);
  }
}

/**
 * Map workflow trigger to notification type
 */
function mapTriggerToNotificationType(trigger: WorkflowTrigger): any {
  const mapping: Record<WorkflowTrigger, string> = {
    [WorkflowTrigger.BOOKING_CREATED]: 'BOOKING_CONFIRMATION',
    [WorkflowTrigger.BOOKING_CONFIRMED]: 'BOOKING_CONFIRMATION',
    [WorkflowTrigger.BOOKING_CANCELLED]: 'BOOKING_CANCELLED',
    [WorkflowTrigger.BOOKING_COMPLETED]: 'BOOKING_CONFIRMATION',
    [WorkflowTrigger.HOURS_BEFORE_24]: 'BOOKING_REMINDER_24H',
    [WorkflowTrigger.HOURS_BEFORE_48]: 'BOOKING_REMINDER_24H',
    [WorkflowTrigger.HOURS_BEFORE_1]: 'BOOKING_REMINDER_1H',
    [WorkflowTrigger.MINUTES_BEFORE_30]: 'BOOKING_REMINDER_1H',
    [WorkflowTrigger.HOURS_AFTER_24]: 'BOOKING_CONFIRMATION',
  };

  return mapping[trigger] || 'BOOKING_CONFIRMATION';
}

/**
 * Get next scheduled workflow run time
 */
export async function getNextScheduledRun(): Promise<{
  nextRun: Date | null;
  pendingBookings: number;
}> {
  const now = new Date();
  const next24Hours = addHours(now, 24);

  // Count bookings in next 24 hours that might trigger workflows
  const count = await prisma.booking.count({
    where: {
      startTime: {
        gte: now,
        lte: next24Hours,
      },
      status: {
        in: [BookingStatus.CONFIRMED, BookingStatus.PENDING],
      },
    },
  });

  // Next run should be in 15 minutes (or whatever your cron interval is)
  const nextRun = addMinutes(now, 15);

  return {
    nextRun,
    pendingBookings: count,
  };
}

/**
 * Get workflow execution statistics
 */
export async function getWorkflowStats(providerId: string): Promise<{
  totalWorkflows: number;
  activeWorkflows: number;
  totalNotificationsSent: number;
  notificationsSentLast30Days: number;
  failureRate: number;
}> {
  const thirtyDaysAgo = subHours(new Date(), 24 * 30);

  const [totalWorkflows, activeWorkflows, allNotifications, recentNotifications] = await Promise.all([
    prisma.workflow.count({
      where: { providerId },
    }),
    prisma.workflow.count({
      where: { providerId, isActive: true },
    }),
    prisma.notification.count({
      where: {
        booking: {
          providerId,
        },
      },
    }),
    prisma.notification.findMany({
      where: {
        booking: {
          providerId,
        },
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    }),
  ]);

  const failedRecent = recentNotifications.filter((n) => n.status === 'FAILED').length;
  const failureRate = recentNotifications.length > 0
    ? (failedRecent / recentNotifications.length) * 100
    : 0;

  return {
    totalWorkflows,
    activeWorkflows,
    totalNotificationsSent: allNotifications,
    notificationsSentLast30Days: recentNotifications.length,
    failureRate: Math.round(failureRate * 10) / 10,
  };
}
