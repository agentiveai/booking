import { format } from 'date-fns';

interface BookingEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  organizerName: string;
  organizerEmail: string;
  attendeeName: string;
  attendeeEmail: string;
}

/**
 * Formats a date for ICS format (YYYYMMDDTHHMMSSZ)
 */
function formatICSDate(date: Date): string {
  return format(date, "yyyyMMdd'T'HHmmss'Z'");
}

/**
 * Escapes special characters in ICS text fields
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generates an ICS calendar file content for a booking
 */
export function generateICS(booking: BookingEvent): string {
  const now = new Date();
  const dtstamp = formatICSDate(now);
  const dtstart = formatICSDate(booking.startTime);
  const dtend = formatICSDate(booking.endTime);

  // Generate a unique UID
  const uid = `${booking.id}@booking-platform.no`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Booking Platform//Booking System//NO',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${escapeICSText(booking.title)}`,
    ...(booking.description ? [`DESCRIPTION:${escapeICSText(booking.description)}`] : []),
    ...(booking.location ? [`LOCATION:${escapeICSText(booking.location)}`] : []),
    `ORGANIZER;CN=${escapeICSText(booking.organizerName)}:mailto:${booking.organizerEmail}`,
    `ATTENDEE;CN=${escapeICSText(booking.attendeeName)};RSVP=TRUE:mailto:${booking.attendeeEmail}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Påminnelse: Din avtale er i morgen',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Påminnelse: Din avtale starter om 1 time',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return icsContent;
}

/**
 * Creates a download link for an ICS file
 */
export function downloadICS(icsContent: string, filename: string = 'booking.ics'): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
