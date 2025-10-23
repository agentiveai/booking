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

