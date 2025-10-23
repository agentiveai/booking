'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface AnalyticsData {
  totalBookings: number;
  totalRevenue: number;
  avgBookingValue: number;
  completionRate: number;
  noShowRate: number;
  topServices: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    bookings: number;
    revenue: number;
  }>;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalBookings: 0,
    totalRevenue: 0,
    avgBookingValue: 0,
    completionRate: 0,
    noShowRate: 0,
    topServices: [],
    monthlyTrend: [],
  });
  const [timeRange, setTimeRange] = useState('30'); // days

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
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

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(timeRange));

      const response = await fetch(
        `/api/providers/bookings?providerId=${providerId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        const bookings = data.bookings || [];

        // Calculate metrics
        const totalBookings = bookings.length;
        const totalRevenue = bookings
          .filter((b: any) => b.status !== 'CANCELLED')
          .reduce((sum: number, b: any) => sum + Number(b.totalAmount || 0), 0);
        const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

        const completedBookings = bookings.filter((b: any) => b.status === 'COMPLETED').length;
        const noShowBookings = bookings.filter((b: any) => b.status === 'NO_SHOW').length;
        const relevantBookings = bookings.filter((b: any) =>
          ['COMPLETED', 'NO_SHOW', 'CANCELLED'].includes(b.status)
        ).length;

        const completionRate = relevantBookings > 0 ? (completedBookings / relevantBookings) * 100 : 0;
        const noShowRate = relevantBookings > 0 ? (noShowBookings / relevantBookings) * 100 : 0;

        // Top services
        const serviceMap = new Map();
        bookings.forEach((b: any) => {
          const serviceName = b.service.nameNo;
          if (!serviceMap.has(serviceName)) {
            serviceMap.set(serviceName, { name: serviceName, count: 0, revenue: 0 });
          }
          const service = serviceMap.get(serviceName);
          service.count++;
          if (b.status !== 'CANCELLED') {
            service.revenue += Number(b.totalAmount || 0);
          }
        });

        const topServices = Array.from(serviceMap.values())
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        setAnalytics({
          totalBookings,
          totalRevenue,
          avgBookingValue,
          completionRate,
          noShowRate,
          topServices,
          monthlyTrend: [],
        });
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
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
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Analyse</h2>
            <p className="text-gray-600 mt-1">Se statistikk og trender for virksomheten din</p>
          </div>

          {/* Time range selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all text-sm font-medium text-gray-900"
          >
            <option value="7">Siste 7 dager</option>
            <option value="30">Siste 30 dager</option>
            <option value="90">Siste 90 dager</option>
            <option value="365">Siste år</option>
          </select>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total bookings */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Totalt bookinger</p>
            <p className="text-3xl font-bold text-gray-900">{analytics.totalBookings}</p>
          </div>

          {/* Total revenue */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total inntekt</p>
            <p className="text-3xl font-bold text-gray-900">
              {new Intl.NumberFormat('no-NO', { style: 'decimal', minimumFractionDigits: 0 }).format(analytics.totalRevenue)}
              <span className="text-lg font-medium text-gray-600 ml-1">NOK</span>
            </p>
          </div>

          {/* Avg booking value */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Gj.snitt verdi</p>
            <p className="text-3xl font-bold text-gray-900">
              {new Intl.NumberFormat('no-NO', { style: 'decimal', minimumFractionDigits: 0 }).format(analytics.avgBookingValue)}
              <span className="text-lg font-medium text-gray-600 ml-1">NOK</span>
            </p>
          </div>

          {/* Completion rate */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Fullføringsrate</p>
            <p className="text-3xl font-bold text-gray-900">
              {analytics.completionRate.toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Additional metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top services */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mest populære tjenester</h3>
            {analytics.topServices.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Ingen data tilgjengelig</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analytics.topServices.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 bg-[#0066FF] rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{service.name}</p>
                        <p className="text-sm text-gray-600">{service.count} bookinger</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {new Intl.NumberFormat('no-NO', { style: 'decimal', minimumFractionDigits: 0 }).format(service.revenue)} NOK
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Performance metrics */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ytelsesmålinger</h3>
            <div className="space-y-4">
              {/* Completion rate bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Fullføringsrate</span>
                  <span className="text-sm font-semibold text-gray-900">{analytics.completionRate.toFixed(1)}%</span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${analytics.completionRate}%` }}
                  ></div>
                </div>
              </div>

              {/* No-show rate bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">No-show rate</span>
                  <span className="text-sm font-semibold text-gray-900">{analytics.noShowRate.toFixed(1)}%</span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all"
                    style={{ width: `${analytics.noShowRate}%` }}
                  ></div>
                </div>
              </div>

              {/* Insights */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#0066FF] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">Innsikt</h4>
                    <p className="text-sm text-gray-600">
                      {analytics.noShowRate > 10
                        ? 'Din no-show rate er høy. Vurder å sende flere påminnelser til kundene.'
                        : analytics.completionRate > 80
                        ? 'Flott! Du har en høy fullføringsrate. Fortsett det gode arbeidet!'
                        : 'Din ytelse ser bra ut. Fortsett å følge opp kundene dine.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coming soon section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-100">
          <div className="text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <svg className="w-8 h-8 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Flere analyser kommer snart</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Vi jobber med å legge til grafer, trendanalyser, og mer detaljert statistikk for å hjelpe deg å vokse virksomheten din.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
