/**
 * Cron Job API - Workflow Scheduler
 *
 * This endpoint should be called by Vercel Cron or external cron service
 * Configure in vercel.json to run every 15 minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { processScheduledWorkflows } from '@/lib/workflows/scheduler';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Process scheduled workflows
    const result = await processScheduledWorkflows();

    return NextResponse.json({
      success: result.success,
      processed: result.processed,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also allow POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request);
}
