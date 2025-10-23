/**
 * Workflow API - Individual workflow operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { z } from 'zod';

// Validation schema for workflow update
const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  nameNo: z.string().min(1).max(100).optional(),
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
  ]).optional(),
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
  })).optional(),
  conditions: z.object({
    serviceIds: z.array(z.string()).optional(),
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    statuses: z.array(z.string()).optional(),
  }).optional(),
  isActive: z.boolean().optional(),
});

// Helper to get authenticated user
async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.userId;
  } catch {
    return null;
  }
}

/**
 * GET /api/workflows/[id] - Get a specific workflow
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workflow = await prisma.workflow.findUnique({
      where: { id: id },
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Verify ownership
    if (workflow.providerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ workflow });
  } catch (error: any) {
    console.error('Failed to fetch workflow:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/workflows/[id] - Update a workflow
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if workflow exists and user owns it
    const existingWorkflow = await prisma.workflow.findUnique({
      where: { id: id },
    });

    if (!existingWorkflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    if (existingWorkflow.providerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateWorkflowSchema.parse(body);

    const workflow = await prisma.workflow.update({
      where: { id: id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.nameNo && { nameNo: validatedData.nameNo }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.descriptionNo !== undefined && { descriptionNo: validatedData.descriptionNo }),
        ...(validatedData.trigger && { trigger: validatedData.trigger }),
        ...(validatedData.timeOffset !== undefined && { timeOffset: validatedData.timeOffset }),
        ...(validatedData.actions && { actions: validatedData.actions as any }),
        ...(validatedData.conditions !== undefined && { conditions: validatedData.conditions as any }),
        ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
      },
    });

    return NextResponse.json({ workflow });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Failed to update workflow:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workflows/[id] - Delete a workflow
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if workflow exists and user owns it
    const existingWorkflow = await prisma.workflow.findUnique({
      where: { id: id },
    });

    if (!existingWorkflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    if (existingWorkflow.providerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.workflow.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete workflow:', error);
    return NextResponse.json(
      { error: 'Failed to delete workflow' },
      { status: 500 }
    );
  }
}
