import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma/client';
import { hashPassword } from '@/lib/auth/password';
import { generateToken } from '@/lib/auth/jwt';
import { withRateLimit, RateLimitPresets } from '@/lib/utils/rate-limit';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  role: z.enum(['CUSTOMER', 'PROVIDER']).default('CUSTOMER'),
  businessName: z.string().optional(),
  businessAddress: z.string().optional(),
  language: z.string().default('no'),
});

// Apply strict rate limiting to registration endpoint
export const POST = withRateLimit(RateLimitPresets.auth, async (request: NextRequest) => {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create user with default business hours if provider
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: validatedData.email,
          password: hashedPassword,
          name: validatedData.name,
          phone: validatedData.phone,
          role: validatedData.role,
          businessName: validatedData.businessName,
          businessAddress: validatedData.businessAddress,
          language: validatedData.language,
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          businessName: true,
          businessAddress: true,
          language: true,
          timezone: true,
          createdAt: true,
        },
      });

      // Create default business hours for providers (Mon-Fri 9-17)
      if (validatedData.role === 'PROVIDER') {
        const defaultHours = [
          { dayOfWeek: 1, isOpen: true, openTime: '09:00', closeTime: '17:00' }, // Monday
          { dayOfWeek: 2, isOpen: true, openTime: '09:00', closeTime: '17:00' }, // Tuesday
          { dayOfWeek: 3, isOpen: true, openTime: '09:00', closeTime: '17:00' }, // Wednesday
          { dayOfWeek: 4, isOpen: true, openTime: '09:00', closeTime: '17:00' }, // Thursday
          { dayOfWeek: 5, isOpen: true, openTime: '09:00', closeTime: '17:00' }, // Friday
          { dayOfWeek: 6, isOpen: false, openTime: '09:00', closeTime: '17:00' }, // Saturday
          { dayOfWeek: 0, isOpen: false, openTime: '09:00', closeTime: '17:00' }, // Sunday
        ];

        await tx.businessHours.createMany({
          data: defaultHours.map(hours => ({
            providerId: newUser.id,
            ...hours,
          })),
        });
      }

      return newUser;
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json(
      {
        user,
        token,
        message: 'Registration successful',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
