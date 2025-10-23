/**
 * Workflows API - CRUD endpoints for managing workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { z } from 'zod';

// Validation schema for workflow creation/update
const workflowSchema = z.object({
  name: z.string().min(1).max(100),
  nameNo: z.string().min(1).max(100),
  description: z.string().optional(),
  descriptionNo: z.string().optional(),
  trigger: z.enum([
    'BOOKING_CREATED',
    'BOOKING_CONFIRMED',
    'BOOKING_CANCELLED',
    'BOOKING_COMPLETED',
    'HOURS_BEFORE_24',
    'HOURS_BEFORE_48',
    'HOURS_BEFORE_1',
    'MINUTES_BEFORE_30',
    'HOURS_AFTER_24',
  ]),
  timeOffset: z.number().optional(),
  actions: z.array(z.object({
    type: z.enum(['EMAIL', 'SMS', 'WEBHOOK']),
    templateId: z.string().optional(),
    templateType: z.enum(['confirmation', 'reminder', 'cancellation', 'custom']).optional(),
    subject: z.string().optional(),
    content: z.string().optional(),
    recipientType: z.enum(['CUSTOMER', 'PROVIDER', 'STAFF', 'CUSTOM']),
    customEmail: z.string().email().optional(),
    webhookUrl: z.string().url().optional(),
    smsMessage: z.string().optional(),
  })),
  conditions: z.object({
    serviceIds: z.array(z.string()).optional(),
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    statuses: z.array(z.string()).optional(),
  }).optional(),
  isActive: z.boolean().default(true),
});

// Helper to get authenticated user
async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  // TODO: Implement proper JWT verification
  // For now, extract user ID from token (temporary)
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.userId;
  } catch {
    return null;
  }
}

/**
 * GET /api/workflows - List all workflows for authenticated provider
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workflows = await prisma.workflow.findMany({
      where: { providerId: userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ workflows });
  } catch (error: any) {
    console.error('Failed to fetch workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workflows - Create a new workflow
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = workflowSchema.parse(body);

    const workflow = await prisma.workflow.create({
      data: {
        providerId: userId,
        name: validatedData.name,
        nameNo: validatedData.nameNo,
        description: validatedData.description,
        descriptionNo: validatedData.descriptionNo,
        trigger: validatedData.trigger,
        timeOffset: validatedData.timeOffset,
        actions: validatedData.actions as any,
        conditions: validatedData.conditions as any,
        isActive: validatedData.isActive,
      },
    });

    return NextResponse.json({ workflow }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Failed to create workflow:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    );
  }
}
