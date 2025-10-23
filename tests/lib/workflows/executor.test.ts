import { describe, it, expect, beforeEach, vi } from 'vitest';
import { executeWorkflowsForTrigger } from '@/lib/workflows/executor';
import { prisma } from '@/lib/prisma/client';

// Mock Prisma and email service
vi.mock('@/lib/prisma/client', () => ({
  default: {
    booking: {
      findUnique: vi.fn(),
    },
    workflow: {
      findMany: vi.fn(),
    },
  },
  prisma: {
    booking: {
      findUnique: vi.fn(),
    },
    workflow: {
      findMany: vi.fn(),
    },
  },
}));
vi.mock('@/lib/email/sendgrid', () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));

describe('Workflow Executor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeWorkflowsForTrigger', () => {
    it('should execute workflows for a given trigger', async () => {
      const mockBooking = {
        id: 'booking-1',
        providerId: 'provider-1',
        customerId: 'customer-1',
        serviceId: 'service-1',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        startTime: new Date(),
        endTime: new Date(),
        totalAmount: 1000,
        status: 'CONFIRMED',
        customer: { name: 'Test User', email: 'test@example.com' },
        provider: { name: 'Provider', email: 'provider@example.com' },
        service: { name: 'Test Service' },
        staff: null,
      };

      const mockWorkflows = [
        {
          id: 'workflow-1',
          name: 'Test Workflow',
          providerId: 'provider-1',
          trigger: 'BOOKING_CREATED',
          actions: [
            {
              type: 'EMAIL',
              templateType: 'confirmation',
              recipientType: 'CUSTOMER',
              subject: 'Booking Confirmation',
              content: 'Your booking is confirmed',
            },
          ],
          conditions: null,
          isActive: true,
        },
      ];

      vi.mocked(prisma.booking.findUnique).mockResolvedValue(mockBooking as any);
      vi.mocked(prisma.workflow.findMany).mockResolvedValue(mockWorkflows as any);

      const result = await executeWorkflowsForTrigger('BOOKING_CREATED', 'booking-1');

      // Verify workflows were fetched
      expect(prisma.workflow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            providerId: 'provider-1',
            trigger: 'BOOKING_CREATED',
            isActive: true,
          }),
        })
      );

      // Verify execution result
      expect(result.success).toBe(true);
      expect(result.executed).toBe(1);
    });

    it('should not execute workflows if booking not found', async () => {
      vi.mocked(prisma.booking.findUnique).mockResolvedValue(null);

      const result = await executeWorkflowsForTrigger('BOOKING_CREATED', 'invalid-booking');

      // Should not fetch workflows if booking doesn't exist
      expect(prisma.workflow.findMany).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Booking not found');
    });

    it('should handle workflow execution errors gracefully', async () => {
      const mockBooking = {
        id: 'booking-1',
        providerId: 'provider-1',
        customer: { email: 'test@example.com' },
        provider: { email: 'provider@example.com' },
        service: { name: 'Test Service' },
      };

      vi.mocked(prisma.booking.findUnique).mockResolvedValue(mockBooking as any);
      vi.mocked(prisma.workflow.findMany).mockRejectedValue(new Error('Database error'));

      // Should not throw error
      const result = await executeWorkflowsForTrigger('BOOKING_CREATED', 'booking-1');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
