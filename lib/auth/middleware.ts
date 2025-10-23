import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JWTPayload } from './jwt';
import prisma from '../prisma/client';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

/**
 * Extract token from Authorization header
 */
function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(
  request: NextRequest,
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const token = extractToken(request);

  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const payload = verifyToken(token);

  if (!payload) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }

  // Attach user to request
  const authenticatedRequest = request as AuthenticatedRequest;
  authenticatedRequest.user = payload;

  return handler(authenticatedRequest);
}

/**
 * Middleware to require specific role
 */
export async function requireRole(
  request: NextRequest,
  roles: string[],
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  return requireAuth(request, async (req) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return handler(req);
  });
}

/**
 * Middleware to require provider role
 */
export async function requireProvider(
  request: NextRequest,
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  return requireRole(request, ['PROVIDER', 'ADMIN'], handler);
}

/**
 * Get current user from request
 */
export async function getCurrentUser(request: AuthenticatedRequest) {
  if (!request.user) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: request.user.userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      businessName: true,
      businessAddress: true,
      timezone: true,
      language: true,
      createdAt: true,
    },
  });

  return user;
}
