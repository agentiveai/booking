'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

interface Booking {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string;
  totalAmount: number;
  service: {
    nameNo: string;
    duration: number;
  };
  provider: {
    businessName: string;
    name: string;
  };
}

export default function MyBookingsPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSearched(false);

    try {
      const response = await fetch(`/api/bookings/my-bookings?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (response.ok) {
        setBookings(data.bookings || []);
        setSearched(true);
      } else {
        setError(data.error || 'Kunne ikke hente bookinger');
      }
    } catch (err) {
      setError('Noe gikk galt. Pr�v igjen senere.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Er du sikker på at du vil avbestille denne bookingen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerEmail: email }),
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh bookings
        handleSearch(new Event('submit') as any);
        alert(`Bookingen er avbestilt. ${data.refundMessage || ''}`);
      } else {
        const data = await response.json();
        alert(data.error || 'Kunne ikke avbestille booking');
      }
    } catch (err) {
      alert('Noe gikk galt. Prøv igjen senere.');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: { text: 'Venter', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      CONFIRMED: { text: 'Bekreftet', color: 'bg-green-100 text-green-800 border-green-200' },
      COMPLETED: { text: 'Fullf�rt', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      CANCELLED: { text: 'Avbestilt', color: 'bg-red-100 text-red-800 border-red-200' },
      NO_SHOW: { text: 'Ikke m�tt', color: 'bg-gray-100 text-gray-800 border-gray-200' },
    };
    const badge = badges[status as keyof typeof badges] || badges.PENDING;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const isPastBooking = (endTime: string) => {
    return new Date(endTime) < new Date();
  };

  const canCancelBooking = (booking: Booking) => {
    return !isPastBooking(booking.endTime) &&
           booking.status !== 'CANCELLED' &&
           booking.status !== 'COMPLETED';
  };

  const upcomingBookings = bookings.filter(b => !isPastBooking(b.endTime));
  const pastBookings = bookings.filter(b => isPastBooking(b.endTime));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#0066FF] to-[#0052CC] rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mine bookinger</h1>
              <p className="text-sm text-gray-600">Se og administrer dine avtaler</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Form */}
        {!searched && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Finn dine bookinger</h2>
              <p className="text-gray-600">Skriv inn e-postadressen du brukte ved booking</p>
            </div>

            <form onSubmit={handleSearch} className="max-w-md mx-auto">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  E-postadresse
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent text-gray-900"
                  placeholder="din@epost.no"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#0066FF] text-white font-semibold rounded-xl hover:bg-[#0052CC] transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    S�ker...
                  </span>
                ) : (
                  'S�k etter bookinger'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Bookings List */}
        {searched && (
          <div className="space-y-6">
            {/* Search again button */}
            <button
              onClick={() => {
                setSearched(false);
                setBookings([]);
                setEmail('');
              }}
              className="text-sm text-[#0066FF] hover:text-[#0052CC] font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              S�k med annen e-post
            </button>

            {bookings.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ingen bookinger funnet</h3>
                <p className="text-gray-600">Vi fant ingen bookinger for {email}</p>
              </div>
            ) : (
              <>
                {/* Upcoming Bookings */}
                {upcomingBookings.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-6 h-6 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Kommende avtaler ({upcomingBookings.length})
                    </h2>
                    <div className="space-y-4">
                      {upcomingBookings.map((booking) => (
                        <div key={booking.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                          <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900">{booking.service.nameNo}</h3>
                                  {getStatusBadge(booking.status)}
                                </div>
                                <p className="text-sm text-gray-600">{booking.provider.businessName || booking.provider.name}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="flex items-center gap-3 text-gray-700">
                                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <div>
                                  <div className="text-sm font-medium">{format(new Date(booking.startTime), 'EEEE d. MMMM yyyy', { locale: nb })}</div>
                                  <div className="text-sm text-gray-600">
                                    {format(new Date(booking.startTime), 'HH:mm')} - {format(new Date(booking.endTime), 'HH:mm')}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 text-gray-700">
                                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                  <div className="text-sm font-medium">{booking.service.duration} minutter</div>
                                  <div className="text-sm text-gray-600">{booking.totalAmount} NOK</div>
                                </div>
                              </div>
                            </div>

                            {booking.notes && (
                              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                <p className="text-sm text-gray-700"><strong>Notat:</strong> {booking.notes}</p>
                              </div>
                            )}

                            <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
                              {canCancelBooking(booking) && (
                                <div className="flex gap-3">
                                  <button
                                    onClick={() => handleCancelBooking(booking.id)}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
                                  >
                                    Avbestill
                                  </button>
                                  <button className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                                    Endre tidspunkt
                                  </button>
                                </div>
                              )}
                              <a
                                href={`/api/bookings/${booking.id}/ics`}
                                download
                                className="w-full px-4 py-2 text-sm font-medium text-[#0066FF] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 flex items-center justify-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Legg til i kalender
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Past Bookings */}
                {pastBookings.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Tidligere avtaler ({pastBookings.length})
                    </h2>
                    <div className="space-y-4">
                      {pastBookings.map((booking) => (
                        <div key={booking.id} className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden opacity-75">
                          <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900">{booking.service.nameNo}</h3>
                                  {getStatusBadge(booking.status)}
                                </div>
                                <p className="text-sm text-gray-600">{booking.provider.businessName || booking.provider.name}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 text-gray-700">
                              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <div>
                                <div className="text-sm font-medium">{format(new Date(booking.startTime), 'EEEE d. MMMM yyyy', { locale: nb })}</div>
                                <div className="text-sm text-gray-600">
                                  {format(new Date(booking.startTime), 'HH:mm')} - {format(new Date(booking.endTime), 'HH:mm')}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
