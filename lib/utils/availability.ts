import { addMinutes, areIntervalsOverlapping } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import prisma from '../prisma/client';

interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  availableStaffCount?: number; // How many staff can take this slot
}

interface AvailabilityOptions {
  providerId: string;
  serviceId: string;
  date: Date;
  timezone?: string;
}

/**
 * Get available staff members for a service at a specific time
 */
async function getAvailableStaffForSlot(
  serviceId: string,
  startTime: Date,
  endTime: Date
): Promise<string[]> {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      staffAssignments: {
        include: {
          staff: true,
        },
      },
    },
  });

  if (!service) return [];

  // If service doesn't require staff, return empty array
  if (!service.requiresStaff) return [];

  // Get all potentially available staff
  let potentialStaff: string[];

  if (service.anyStaffMember) {
    // Any active staff from the provider can perform this service
    const allStaff = await prisma.staffMember.findMany({
      where: {
        providerId: service.providerId,
        isActive: true,
      },
      select: { id: true },
    });
    potentialStaff = allStaff.map((s) => s.id);
  } else {
    // Only specifically assigned staff can perform this service
    potentialStaff = service.staffAssignments
      .filter((sa) => sa.staff.isActive)
      .map((sa) => sa.staffId);
  }

  if (potentialStaff.length === 0) return [];

  // Check which staff members are actually available (not booked)
  const staffBookings = await prisma.booking.findMany({
    where: {
      staffId: { in: potentialStaff },
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      OR: [
        {
          AND: [
            { startTime: { lte: startTime } },
            { endTime: { gt: startTime } },
          ],
        },
        {
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gte: endTime } },
          ],
        },
        {
          AND: [
            { startTime: { gte: startTime } },
            { endTime: { lte: endTime } },
          ],
        },
      ],
    },
    select: { staffId: true },
  });

  const bookedStaffIds = new Set(staffBookings.map((b) => b.staffId).filter((id): id is string => id !== null));

  // Check staff-specific availability blocks (vacation, sick leave, etc.)
  const staffBlocks = await prisma.staffAvailability.findMany({
    where: {
      staffId: { in: potentialStaff },
      isAvailable: false,
      OR: [
        {
          AND: [
            { startTime: { lte: startTime } },
            { endTime: { gt: startTime } },
          ],
        },
        {
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gte: endTime } },
          ],
        },
        {
          AND: [
            { startTime: { gte: startTime } },
            { endTime: { lte: endTime } },
          ],
        },
      ],
    },
    select: { staffId: true },
  });

  const blockedStaffIds = new Set(staffBlocks.map((b) => b.staffId));

  // Return staff who are not booked and not blocked
  return potentialStaff.filter(
    (staffId) => !bookedStaffIds.has(staffId) && !blockedStaffIds.has(staffId)
  );
}

/**
 * Check if a specific time slot is available for booking
 * Now considers staff capacity
 */
export async function isTimeSlotAvailable(
  providerId: string,
  serviceId: string,
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!service) return false;

  // If service doesn't require staff, just check maxConcurrent limit
  if (!service.requiresStaff) {
    const concurrentBookings = await prisma.booking.count({
      where: {
        providerId,
        serviceId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });

    return concurrentBookings < service.maxConcurrent;
  }

  // For staff-based services, check if any staff member is available
  const availableStaff = await getAvailableStaffForSlot(serviceId, startTime, endTime);

  // Also respect maxConcurrent limit
  if (availableStaff.length > 0) {
    const concurrentBookings = await prisma.booking.count({
      where: {
        providerId,
        serviceId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });

    return concurrentBookings < Math.min(availableStaff.length, service.maxConcurrent);
  }

  // Check for blocked availability at provider level
  const blockedTimes = await prisma.availability.findMany({
    where: {
      providerId,
      isAvailable: false,
      OR: [
        {
          AND: [
            { startTime: { lte: startTime } },
            { endTime: { gt: startTime } },
          ],
        },
        {
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gte: endTime } },
          ],
        },
        {
          AND: [
            { startTime: { gte: startTime } },
            { endTime: { lte: endTime } },
          ],
        },
      ],
    },
  });

  return availableStaff.length > 0 && blockedTimes.length === 0;
}

/**
 * Get available time slots for a specific service and date
 * Now considers staff capacity and concurrent bookings
 */
export async function getAvailableTimeSlots(
  options: AvailabilityOptions
): Promise<TimeSlot[]> {
  const { providerId, serviceId, date, timezone = 'Europe/Oslo' } = options;

  // Get service details
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      staffAssignments: {
        include: {
          staff: true,
        },
      },
    },
  });

  if (!service) {
    throw new Error('Service not found');
  }

  // Get business hours for the day
  const dayOfWeek = date.getDay();
  const businessHours = await prisma.businessHours.findUnique({
    where: {
      providerId_dayOfWeek: {
        providerId,
        dayOfWeek,
      },
    },
  });

  if (!businessHours || !businessHours.isOpen) {
    return [];
  }

  // Parse business hours
  const [openHour, openMinute] = businessHours.openTime.split(':').map(Number);
  const [closeHour, closeMinute] = businessHours.closeTime.split(':').map(Number);

  // Create start and end times in the provider's timezone
  const dayStart = new Date(date);
  dayStart.setHours(openHour, openMinute, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(closeHour, closeMinute, 0, 0);

  // Convert to UTC for database queries
  const startUTC = fromZonedTime(dayStart, timezone);
  const endUTC = fromZonedTime(dayEnd, timezone);

  // Get blocked times at provider level
  const blockedTimes = await prisma.availability.findMany({
    where: {
      providerId,
      isAvailable: false,
      startTime: { lte: endUTC },
      endTime: { gte: startUTC },
    },
  });

  // Generate time slots
  const slots: TimeSlot[] = [];
  const slotDuration = service.duration;
  const bufferBefore = service.bufferTimeBefore;
  const bufferAfter = service.bufferTimeAfter;
  const totalDuration = bufferBefore + slotDuration + bufferAfter;

  let currentTime = new Date(dayStart);

  while (currentTime < dayEnd) {
    const slotStart = new Date(currentTime);
    const slotEnd = addMinutes(slotStart, slotDuration);
    const slotEndWithBuffer = addMinutes(slotStart, totalDuration);

    // Check if slot is within business hours
    if (slotEndWithBuffer <= dayEnd) {
      const slotStartUTC = fromZonedTime(slotStart, timezone);
      const slotEndUTC = fromZonedTime(slotEnd, timezone);
      const slotEndWithBufferUTC = fromZonedTime(slotEndWithBuffer, timezone);

      // Check if slot is blocked at provider level
      const isBlocked = blockedTimes.some((blocked) =>
        areIntervalsOverlapping(
          { start: slotStartUTC, end: slotEndUTC },
          { start: blocked.startTime, end: blocked.endTime }
        )
      );

      if (!isBlocked) {
        // Get available staff for this time slot
        const availableStaff = await getAvailableStaffForSlot(
          serviceId,
          slotStartUTC,
          slotEndWithBufferUTC
        );

        // Count current bookings for this slot
        const concurrentBookings = await prisma.booking.count({
          where: {
            providerId,
            serviceId,
            status: { notIn: ['CANCELLED', 'NO_SHOW'] },
            OR: [
              {
                AND: [
                  { startTime: { lte: slotStartUTC } },
                  { endTime: { gt: slotStartUTC } },
                ],
              },
              {
                AND: [
                  { startTime: { lt: slotEndWithBufferUTC } },
                  { endTime: { gte: slotEndWithBufferUTC } },
                ],
              },
              {
                AND: [
                  { startTime: { gte: slotStartUTC } },
                  { endTime: { lte: slotEndWithBufferUTC } },
                ],
              },
            ],
          },
        });

        // Determine availability based on staff and capacity limits
        const maxCapacity = service.requiresStaff
          ? Math.min(availableStaff.length, service.maxConcurrent)
          : service.maxConcurrent;

        const available = concurrentBookings < maxCapacity;

        slots.push({
          start: slotStartUTC,
          end: slotEndUTC,
          available,
          availableStaffCount: maxCapacity - concurrentBookings,
        });
      } else {
        // Slot is blocked
        slots.push({
          start: slotStartUTC,
          end: slotEndUTC,
          available: false,
          availableStaffCount: 0,
        });
      }
    }

    // Move to next slot (using slot duration, not total with buffer)
    currentTime = addMinutes(currentTime, slotDuration);
  }

  return slots;
}

/**
 * Check if provider is available at a specific time
 */
export async function checkProviderAvailability(
  providerId: string,
  serviceId: string,
  startTime: Date,
  endTime: Date
): Promise<{ available: boolean; reason?: string }> {
  // Check business hours
  const dayOfWeek = startTime.getDay();
  const businessHours = await prisma.businessHours.findUnique({
    where: {
      providerId_dayOfWeek: {
        providerId,
        dayOfWeek,
      },
    },
  });

  if (!businessHours || !businessHours.isOpen) {
    return { available: false, reason: 'Provider is not open on this day' };
  }

  // Check if time is within business hours
  const startHour = startTime.getHours();
  const startMinute = startTime.getMinutes();
  const endHour = endTime.getHours();
  const endMinute = endTime.getMinutes();

  const [openHour, openMinute] = businessHours.openTime.split(':').map(Number);
  const [closeHour, closeMinute] = businessHours.closeTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  const openMinutes = openHour * 60 + openMinute;
  const closeMinutes = closeHour * 60 + closeMinute;

  if (startMinutes < openMinutes || endMinutes > closeMinutes) {
    return { available: false, reason: 'Time is outside business hours' };
  }

  // Check for available capacity
  const isAvailable = await isTimeSlotAvailable(providerId, serviceId, startTime, endTime);

  if (!isAvailable) {
    return { available: false, reason: 'Time slot is fully booked' };
  }

  return { available: true };
}

/**
 * Assign an available staff member to a booking
 */
export async function assignStaffToBooking(
  serviceId: string,
  startTime: Date,
  endTime: Date
): Promise<string | null> {
  const availableStaff = await getAvailableStaffForSlot(serviceId, startTime, endTime);

  if (availableStaff.length === 0) {
    return null;
  }

  // Return the first available staff member
  // In the future, this could be enhanced with load balancing or preferences
  return availableStaff[0];
}

/**
 * Prevent double bookings with database transaction
 */
export async function createBookingWithLock(bookingData: {
  providerId: string;
  customerId: string;
  serviceId: string;
  startTime: Date;
  endTime: Date;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  totalAmount: number;
  depositAmount?: number;
  notes?: string;
}) {
  return await prisma.$transaction(async (tx) => {
    // Check availability within transaction
    const isAvailable = await isTimeSlotAvailable(
      bookingData.providerId,
      bookingData.serviceId,
      bookingData.startTime,
      bookingData.endTime
    );

    if (!isAvailable) {
      throw new Error('Time slot is no longer available');
    }

    // Assign staff member if needed
    const staffId = await assignStaffToBooking(
      bookingData.serviceId,
      bookingData.startTime,
      bookingData.endTime
    );

    // Create booking
    const booking = await tx.booking.create({
      data: {
        ...bookingData,
        staffId,
        status: 'PENDING',
        paymentStatus: 'PENDING',
      },
      include: {
        service: true,
        provider: true,
        customer: true,
        staff: true,
      },
    });

    return booking;
  });
}
