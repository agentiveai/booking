/**
 * Email Templates API - CRUD endpoints for managing email templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { z } from 'zod';

// Validation schema for template creation/update
const templateSchema = z.object({
  name: z.string().min(1).max(100),
  nameNo: z.string().min(1).max(100),
  type: z.enum([
    'CONFIRMATION',
    'REMINDER',
    'CANCELLATION',
    'RESCHEDULED',
    'FOLLOW_UP',
    'PAYMENT_RECEIPT',
    'PAYMENT_FAILED',
    'CUSTOM',
  ]),
  subject: z.string().min(1),
  subjectNo: z.string().min(1),
  htmlContent: z.string().min(1),
  htmlContentNo: z.string().min(1),
  textContent: z.string().min(1),
  textContentNo: z.string().min(1),
  isActive: z.boolean().default(true),
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
 * GET /api/templates - List all templates (system + provider's custom)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get system templates and provider's custom templates
    const templates = await prisma.emailTemplate.findMany({
      where: {
        OR: [
          { isSystem: true },
          { providerId: userId },
        ],
      },
      orderBy: [
        { isSystem: 'desc' }, // System templates first
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error('Failed to fetch templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/templates - Create a new custom template
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = templateSchema.parse(body);

    const template = await prisma.emailTemplate.create({
      data: {
        providerId: userId,
        name: validatedData.name,
        nameNo: validatedData.nameNo,
        type: validatedData.type,
        subject: validatedData.subject,
        subjectNo: validatedData.subjectNo,
        htmlContent: validatedData.htmlContent,
        htmlContentNo: validatedData.htmlContentNo,
        textContent: validatedData.textContent,
        textContentNo: validatedData.textContentNo,
        isSystem: false,
        isActive: validatedData.isActive,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Failed to create template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
