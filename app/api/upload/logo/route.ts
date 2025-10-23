import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];

/**
 * Upload logo for provider
 * POST /api/upload/logo
 */
export async function POST(request: NextRequest) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    try {
      // Only providers can upload logos
      if (req.user!.role !== 'PROVIDER' && req.user!.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Only providers can upload logos' },
          { status: 403 }
        );
      }

      const formData = await request.formData();
      const file = formData.get('logo') as File;

      if (!file) {
        return NextResponse.json(
          { error: 'No file uploaded' },
          { status: 400 }
        );
      }

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: 'Invalid file type. Allowed types: PNG, JPG, SVG, WEBP' },
          { status: 400 }
        );
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'File too large. Maximum size: 2MB' },
          { status: 400 }
        );
      }

      // Get file extension
      const extension = file.name.split('.').pop()?.toLowerCase() || 'png';

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${req.user!.userId}-${timestamp}.${extension}`;

      // Create upload directory if it doesn't exist
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'logos');
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      // Save file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filepath = path.join(uploadDir, filename);
      await writeFile(filepath, buffer);

      // Generate public URL
      const logoUrl = `/uploads/logos/${filename}`;

      // Update user record
      await prisma.user.update({
        where: { id: req.user!.userId },
        data: { logo: logoUrl },
      });

      return NextResponse.json({
        success: true,
        logoUrl,
        message: 'Logo uploaded successfully',
      });
    } catch (error: any) {
      console.error('Logo upload error:', error);
      return NextResponse.json(
        { error: 'Failed to upload logo' },
        { status: 500 }
      );
    }
  });
}

/**
 * Delete logo for provider
 * DELETE /api/upload/logo
 */
export async function DELETE(request: NextRequest) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    try {
      // Only providers can delete logos
      if (req.user!.role !== 'PROVIDER' && req.user!.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Only providers can delete logos' },
          { status: 403 }
        );
      }

      // Update user record to remove logo
      await prisma.user.update({
        where: { id: req.user!.userId },
        data: { logo: null },
      });

      return NextResponse.json({
        success: true,
        message: 'Logo deleted successfully',
      });
    } catch (error: any) {
      console.error('Logo deletion error:', error);
      return NextResponse.json(
        { error: 'Failed to delete logo' },
        { status: 500 }
      );
    }
  });
}
