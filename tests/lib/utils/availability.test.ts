import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isTimeSlotAvailable } from '@/lib/utils/availability';
import prisma from '@/lib/prisma/client';

// Mock Prisma
vi.mock('@/lib/prisma/client', () => ({
  default: {
    service: {
      findUnique: vi.fn(),
    },
    booking: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    staffMember: {
      findMany: vi.fn(),
    },
    staffAvailability: {
      findMany: vi.fn(),
    },
    availability: {
      findMany: vi.fn(),
    },
  },
}));

describe('Availability Calculation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isTimeSlotAvailable', () => {
    it('should return false when maxConcurrent limit is reached', async () => {
      const mockService = {
        id: 'service-1',
        maxConcurrent: 2,
        requiresStaff: false,
      };

      vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
      vi.mocked(prisma.booking.count).mockResolvedValue(2); // Already at max

      const result = await isTimeSlotAvailable(
        'provider-1',
        'service-1',
        new Date('2025-10-21T10:00:00Z'),
        new Date('2025-10-21T11:00:00Z')
      );

      expect(result).toBe(false);
    });

    it('should return true when slot is available', async () => {
      const mockService = {
        id: 'service-1',
        maxConcurrent: 2,
        requiresStaff: false,
      };

      vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
      vi.mocked(prisma.booking.count).mockResolvedValue(1); // Below max

      const result = await isTimeSlotAvailable(
        'provider-1',
        'service-1',
        new Date('2025-10-21T10:00:00Z'),
        new Date('2025-10-21T11:00:00Z')
      );

      expect(result).toBe(true);
    });

    it('should return false when service not found', async () => {
      vi.mocked(prisma.service.findUnique).mockResolvedValue(null);

      const result = await isTimeSlotAvailable(
        'provider-1',
        'invalid-service',
        new Date('2025-10-21T10:00:00Z'),
        new Date('2025-10-21T11:00:00Z')
      );

      expect(result).toBe(false);
    });

    it('should handle staff-based services correctly', async () => {
      const mockService = {
        id: 'service-1',
        maxConcurrent: 5,
        requiresStaff: true,
        anyStaffMember: true,
        providerId: 'provider-1',
      };

      vi.mocked(prisma.service.findUnique).mockResolvedValue(mockService as any);
      vi.mocked(prisma.staffMember.findMany).mockResolvedValue([
        { id: 'staff-1', isActive: true },
        { id: 'staff-2', isActive: true },
      ] as any);
      vi.mocked(prisma.booking.findMany).mockResolvedValue([]);
      vi.mocked(prisma.staffAvailability.findMany).mockResolvedValue([]);
      vi.mocked(prisma.booking.count).mockResolvedValue(0);
      vi.mocked(prisma.availability.findMany).mockResolvedValue([]);

      const result = await isTimeSlotAvailable(
        'provider-1',
        'service-1',
        new Date('2025-10-21T10:00:00Z'),
        new Date('2025-10-21T11:00:00Z')
      );

      expect(result).toBe(true);
    });
  });
});
