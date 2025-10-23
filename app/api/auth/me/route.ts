import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getCurrentUser, AuthenticatedRequest } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    const user = await getCurrentUser(req);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  });
}
