'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface Booking {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  startTime: string;
  endTime: string;
  status: string;
  totalAmount: number;
  paymentStatus: string;
  service: {
    id: string;
    nameNo: string;
    duration: number;
  };
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    method: string;
  }>;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('upcoming');

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, dateFilter]);

  const fetchBookings = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);

    try {
      // Get user info to get provider ID
      const userResponse = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!userResponse.ok) return;

      const userData = await userResponse.json();
      const providerId = userData.user.id;

      let url = `/api/providers/bookings?providerId=${providerId}&`;

      if (statusFilter !== 'ALL') {
        url += `status=${statusFilter}&`;
      }

      // Date filters
      const now = new Date();
      if (dateFilter === 'upcoming') {
        url += `startDate=${now.toISOString()}&endDate=${new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString()}`;
      } else if (dateFilter === 'past') {
        url += `startDate=${new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()}&endDate=${now.toISOString()}`;
      } else if (dateFilter === 'today') {
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const endOfDay = new Date(now.setHours(23, 59, 59, 999));
        url += `startDate=${startOfDay.toISOString()}&endDate=${endOfDay.toISOString()}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('no-NO', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('no-NO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'PENDING':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'NO_SHOW':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'COMPLETED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'Bekreftet';
      case 'PENDING': return 'Venter';
      case 'CANCELLED': return 'Avbestilt';
      case 'NO_SHOW': return 'Møtte ikke';
      case 'COMPLETED': return 'Fullført';
      default: return status;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'text-green-600';
      case 'PENDING':
      case 'AUTHORIZED': return 'text-yellow-600';
      case 'FAILED':
      case 'REFUNDED': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'PAID': return 'Betalt';
      case 'PENDING': return 'Venter betaling';
      case 'AUTHORIZED': return 'Autorisert';
      case 'FAILED': return 'Betaling feilet';
      case 'REFUNDED': return 'Refundert';
      default: return status;
    }
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchBookings();
      } else {
        alert('Kunne ikke oppdatere booking');
      }
    } catch (error) {
      console.error('Failed to update booking:', error);
      alert('Noe gikk galt');
    }
  };

  if (loading) {
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
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Bookinger</h2>
            <p className="text-gray-600 mt-1">Administrer alle dine bookinger</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Tidsperiode
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all text-gray-900"
              >
                <option value="all">Alle</option>
                <option value="today">I dag</option>
                <option value="upcoming">Kommende</option>
                <option value="past">Tidligere</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all text-gray-900"
              >
                <option value="ALL">Alle</option>
                <option value="PENDING">Venter</option>
                <option value="CONFIRMED">Bekreftet</option>
                <option value="COMPLETED">Fullført</option>
                <option value="CANCELLED">Avbestilt</option>
                <option value="NO_SHOW">Møtte ikke</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bookings list */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {bookings.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ingen bookinger</h3>
              <p className="text-gray-600">Ingen bookinger matcher de valgte filtrene</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-[#0066FF] rounded-xl flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {booking.customerName.charAt(0).toUpperCase()}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Customer info */}
                      <div className="mb-3">
                        <h3 className="font-semibold text-gray-900 mb-0.5">
                          {booking.customerName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {booking.customerEmail}
                          {booking.customerPhone && ` • ${booking.customerPhone}`}
                        </p>
                      </div>

                      {/* Service and time */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                        <div className="flex items-center text-gray-900">
                          <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium">{booking.service.nameNo}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(booking.startTime)}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                        </div>
                        <div className="flex items-center text-gray-900 font-medium">
                          <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {new Intl.NumberFormat('no-NO', { style: 'decimal', minimumFractionDigits: 0 }).format(Number(booking.totalAmount))} NOK
                        </div>
                        <div className={`flex items-center font-medium ${getPaymentStatusColor(booking.paymentStatus)}`}>
                          • {getPaymentStatusText(booking.paymentStatus)}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {booking.status === 'PENDING' && (
                          <button
                            onClick={() => handleUpdateStatus(booking.id, 'CONFIRMED')}
                            className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
                          >
                            Bekreft
                          </button>
                        )}
                        {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                          <button
                            onClick={() => handleUpdateStatus(booking.id, 'CANCELLED')}
                            className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
                          >
                            Avbestill
                          </button>
                        )}
                        {booking.status === 'CONFIRMED' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(booking.id, 'COMPLETED')}
                              className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                            >
                              Fullfør
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(booking.id, 'NO_SHOW')}
                              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                            >
                              No-show
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className="flex-shrink-0">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${getStatusColor(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
