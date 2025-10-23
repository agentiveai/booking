/**
 * Email Template API - Individual template operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { z } from 'zod';

// Validation schema for template update
const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  nameNo: z.string().min(1).max(100).optional(),
  type: z.enum([
    'CONFIRMATION',
    'REMINDER',
    'CANCELLATION',
    'RESCHEDULED',
    'FOLLOW_UP',
    'PAYMENT_RECEIPT',
    'PAYMENT_FAILED',
    'CUSTOM',
  ]).optional(),
  subject: z.string().min(1).optional(),
  subjectNo: z.string().min(1).optional(),
  htmlContent: z.string().min(1).optional(),
  htmlContentNo: z.string().min(1).optional(),
  textContent: z.string().min(1).optional(),
  textContentNo: z.string().min(1).optional(),
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
 * GET /api/templates/[id] - Get a specific template
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const template = await prisma.emailTemplate.findUnique({
      where: { id: params.id },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Allow access to system templates or own templates
    if (!template.isSystem && template.providerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ template });
  } catch (error: any) {
    console.error('Failed to fetch template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/templates/[id] - Update a template
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingTemplate = await prisma.emailTemplate.findUnique({
      where: { id: params.id },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Cannot update system templates
    if (existingTemplate.isSystem) {
      return NextResponse.json({ error: 'Cannot modify system templates' }, { status: 403 });
    }

    // Must own the template
    if (existingTemplate.providerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateTemplateSchema.parse(body);

    const template = await prisma.emailTemplate.update({
      where: { id: params.id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.nameNo && { nameNo: validatedData.nameNo }),
        ...(validatedData.type && { type: validatedData.type }),
        ...(validatedData.subject && { subject: validatedData.subject }),
        ...(validatedData.subjectNo && { subjectNo: validatedData.subjectNo }),
        ...(validatedData.htmlContent && { htmlContent: validatedData.htmlContent }),
        ...(validatedData.htmlContentNo && { htmlContentNo: validatedData.htmlContentNo }),
        ...(validatedData.textContent && { textContent: validatedData.textContent }),
        ...(validatedData.textContentNo && { textContentNo: validatedData.textContentNo }),
        ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
      },
    });

    return NextResponse.json({ template });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Failed to update template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/templates/[id] - Delete a template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingTemplate = await prisma.emailTemplate.findUnique({
      where: { id: params.id },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Cannot delete system templates
    if (existingTemplate.isSystem) {
      return NextResponse.json({ error: 'Cannot delete system templates' }, { status: 403 });
    }

    // Must own the template
    if (existingTemplate.providerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.emailTemplate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
