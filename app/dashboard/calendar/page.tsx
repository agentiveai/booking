'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface Booking {
  id: string;
  customerName: string;
  startTime: string;
  endTime: string;
  status: string;
  totalAmount: number;
  service: {
    nameNo: string;
  };
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  useEffect(() => {
    fetchBookings();
  }, [currentDate, view]);

  const fetchBookings = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);

    try {
      const userResponse = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!userResponse.ok) return;

      const userData = await userResponse.json();
      const providerId = userData.user.id;

      // Calculate date range based on view
      let startDate, endDate;
      if (view === 'month') {
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
      } else if (view === 'week') {
        const day = currentDate.getDay();
        startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - day + (day === 0 ? -6 : 1));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59);
      } else {
        startDate = new Date(currentDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(currentDate);
        endDate.setHours(23, 59, 59);
      }

      const response = await fetch(
        `/api/providers/bookings?providerId=${providerId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getBookingsForDate = (date: Date | null) => {
    if (!date) return [];

    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.startTime);
      return (
        bookingDate.getDate() === date.getDate() &&
        bookingDate.getMonth() === date.getMonth() &&
        bookingDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('no-NO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-500';
      case 'PENDING': return 'bg-yellow-500';
      case 'CANCELLED': return 'bg-red-500';
      case 'COMPLETED': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const navigateDay = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  const navigate = (direction: number) => {
    if (view === 'month') navigateMonth(direction);
    else if (view === 'week') navigateWeek(direction);
    else navigateDay(direction);
  };

  const monthName = currentDate.toLocaleDateString('no-NO', { month: 'long', year: 'numeric' });

  if (loading && bookings.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-[#0066FF] rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight capitalize">{monthName}</h2>
            <p className="text-gray-600 mt-1">Se alle dine bookinger i en kalender</p>
          </div>

          {/* View switcher */}
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-xl border border-gray-200 p-1 flex gap-1">
              {['month', 'week', 'day'].map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v as any)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all capitalize ${
                    view === v
                      ? 'bg-[#0066FF] text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {v === 'month' ? 'Måned' : v === 'week' ? 'Uke' : 'Dag'}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(-1)}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                I dag
              </button>
              <button
                onClick={() => navigate(1)}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Calendar */}
        {view === 'month' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
              {['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'].map((day) => (
                <div key={day} className="px-4 py-3 text-center">
                  <span className="text-sm font-semibold text-gray-700">{day}</span>
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {getDaysInMonth().map((day, index) => {
                const dayBookings = day ? getBookingsForDate(day) : [];
                const isToday = day &&
                  day.getDate() === new Date().getDate() &&
                  day.getMonth() === new Date().getMonth() &&
                  day.getFullYear() === new Date().getFullYear();

                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 border-r border-b border-gray-100 ${
                      !day ? 'bg-gray-50' : 'hover:bg-gray-50'
                    } transition-colors`}
                  >
                    {day && (
                      <>
                        <div className={`text-sm font-medium mb-1 w-7 h-7 rounded-full flex items-center justify-center ${
                          isToday ? 'bg-[#0066FF] text-white' : 'text-gray-900'
                        }`}>
                          {day.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayBookings.slice(0, 3).map((booking) => (
                            <div
                              key={booking.id}
                              className={`text-xs px-2 py-1 rounded ${getStatusColor(booking.status)} bg-opacity-10 border border-current border-opacity-20 truncate`}
                              title={`${formatTime(booking.startTime)} - ${booking.customerName}`}
                            >
                              <div className="flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(booking.status)}`}></span>
                                <span className="font-medium truncate">{formatTime(booking.startTime)}</span>
                              </div>
                            </div>
                          ))}
                          {dayBookings.length > 3 && (
                            <div className="text-xs text-gray-500 pl-2">
                              +{dayBookings.length - 3} flere
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Day View */}
        {view === 'day' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {currentDate.toLocaleDateString('no-NO', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            {getBookingsForDate(currentDate).length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-600">Ingen bookinger denne dagen</p>
              </div>
            ) : (
              <div className="space-y-3">
                {getBookingsForDate(currentDate).map((booking) => (
                  <div key={booking.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className={`w-1 h-16 rounded-full ${getStatusColor(booking.status)}`}></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-gray-900">{booking.customerName}</h4>
                        <span className="text-sm text-gray-600">
                          {new Intl.NumberFormat('no-NO', { style: 'decimal' }).format(Number(booking.totalAmount))} NOK
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                        <span>•</span>
                        <span>{booking.service.nameNo}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Week View - Simplified */}
        {view === 'week' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-center text-gray-600 py-8">Ukevisning kommer snart. Bruk måned eller dag i mellomtiden.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
