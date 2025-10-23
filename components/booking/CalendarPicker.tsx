'use client';

import { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore, startOfDay, addDays } from 'date-fns';
import { nb } from 'date-fns/locale';

interface CalendarPickerProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  availabilityData?: { [key: string]: number }; // date string -> available slots count
  isLoading?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

export default function CalendarPicker({
  selectedDate,
  onDateSelect,
  availabilityData = {},
  isLoading = false,
  minDate,
  maxDate,
}: CalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate which day of week the month starts on (0 = Sunday, 6 = Saturday)
  const firstDayOfMonth = monthStart.getDay();

  // Adjust for Norwegian week (Monday = 0)
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  // Create array of days including padding
  const days = Array(startOffset).fill(null).concat(daysInMonth);

  const weekDays = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const isDayDisabled = (day: Date | null): boolean => {
    if (!day) return true;

    const today = startOfDay(new Date());
    if (isBefore(day, today)) return true;

    if (minDate && isBefore(day, startOfDay(minDate))) return true;
    if (maxDate && isBefore(maxDate, day)) return true;

    return false;
  };

  const getAvailabilityIndicator = (day: Date | null) => {
    if (!day) return null;

    const dateStr = format(day, 'yyyy-MM-dd');
    const slotsCount = availabilityData[dateStr] || 0;

    if (isDayDisabled(day)) return null;

    if (slotsCount === 0) {
      return <div className="w-1 h-1 bg-red-400 rounded-full absolute bottom-1 left-1/2 -translate-x-1/2"></div>;
    } else if (slotsCount <= 3) {
      return <div className="w-1 h-1 bg-yellow-400 rounded-full absolute bottom-1 left-1/2 -translate-x-1/2"></div>;
    } else {
      return <div className="w-1 h-1 bg-green-400 rounded-full absolute bottom-1 left-1/2 -translate-x-1/2"></div>;
    }
  };

  const getDayClasses = (day: Date | null): string => {
    if (!day) return 'invisible';

    const baseClasses = 'relative w-full aspect-square flex items-center justify-center text-sm rounded-lg transition-all cursor-pointer';

    if (isDayDisabled(day)) {
      return `${baseClasses} text-gray-300 cursor-not-allowed bg-gray-50`;
    }

    if (selectedDate && isSameDay(day, selectedDate)) {
      return `${baseClasses} bg-[#0066FF] text-white font-semibold shadow-md ring-2 ring-[#0066FF] ring-offset-2`;
    }

    if (isToday(day)) {
      return `${baseClasses} bg-blue-50 text-[#0066FF] font-semibold border-2 border-[#0066FF] hover:bg-blue-100`;
    }

    if (!isSameMonth(day, currentMonth)) {
      return `${baseClasses} text-gray-400 hover:bg-gray-50`;
    }

    return `${baseClasses} text-gray-900 hover:bg-blue-50 hover:text-[#0066FF] font-medium`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {format(currentMonth, 'MMMM yyyy', { locale: nb })}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            type="button"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            type="button"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => (
          <div key={index} className="aspect-square">
            {day ? (
              <button
                type="button"
                onClick={() => !isDayDisabled(day) && onDateSelect(day)}
                disabled={isDayDisabled(day)}
                className={getDayClasses(day)}
              >
                {format(day, 'd')}
                {getAvailabilityIndicator(day)}
              </button>
            ) : (
              <div className="invisible"></div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="text-gray-600">Mange ledige</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
          <span className="text-gray-600">Få ledige</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
          <span className="text-gray-600">Fullbooket</span>
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
          <div className="w-8 h-8 border-3 border-gray-200 border-t-[#0066FF] rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
