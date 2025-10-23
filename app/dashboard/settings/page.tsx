'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface BusinessHours {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('hours');
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const days = [
    'Søndag',
    'Mandag',
    'Tirsdag',
    'Onsdag',
    'Torsdag',
    'Fredag',
    'Lørdag',
  ];

  useEffect(() => {
    fetchBusinessHours();
  }, []);

  const fetchBusinessHours = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/business-hours', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setBusinessHours(data.businessHours);
      }
    } catch (error) {
      console.error('Failed to fetch business hours:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBusinessHours = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setSaving(true);

    try {
      const response = await fetch('/api/business-hours', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(businessHours),
      });

      if (response.ok) {
        alert('Åpningstider lagret!');
      } else {
        alert('Kunne ikke lagre åpningstider');
      }
    } catch (error) {
      console.error('Failed to save business hours:', error);
      alert('Noe gikk galt');
    } finally {
      setSaving(false);
    }
  };

  const updateDayHours = (dayOfWeek: number, field: keyof BusinessHours, value: any) => {
    setBusinessHours((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, [field]: value } : day
      )
    );
  };

  const copyToAll = (dayOfWeek: number) => {
    const source = businessHours.find((h) => h.dayOfWeek === dayOfWeek);
    if (!source) return;

    setBusinessHours((prev) =>
      prev.map((day) => ({
        ...day,
        openTime: source.openTime,
        closeTime: source.closeTime,
      }))
    );
  };

  const tabs = [
    {
      id: 'hours',
      name: 'Åpningstider',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'profile',
      name: 'Profil',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      id: 'payments',
      name: 'Betalinger',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
    {
      id: 'notifications',
      name: 'Varsler',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      )
    },
  ];

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
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Innstillinger</h2>
          <p className="text-gray-600 mt-1">Administrer din bedriftsprofil og preferanser</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 p-1.5">
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#0066FF] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className={activeTab === tab.id ? 'text-white' : 'text-gray-400'}>
                  {tab.icon}
                </span>
                <span className="hidden sm:inline">{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Business Hours Tab */}
        {activeTab === 'hours' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Åpningstider</h3>
              <p className="text-sm text-gray-600 mb-6">
                Sett opp når du er tilgjengelig for bookinger. Dette påvirker hvilke tider som er tilgjengelige for kundene.
              </p>

              <div className="space-y-3">
                {businessHours.map((day) => (
                  <div
                    key={day.dayOfWeek}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      day.isOpen
                        ? 'border-gray-200 bg-white hover:border-[#0066FF]'
                        : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    {/* Day toggle */}
                    <div className="flex items-center min-w-[120px]">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={day.isOpen}
                          onChange={(e) =>
                            updateDayHours(day.dayOfWeek, 'isOpen', e.target.checked)
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0066FF]"></div>
                        <span className={`ml-3 text-sm font-medium ${day.isOpen ? 'text-gray-900' : 'text-gray-500'}`}>
                          {days[day.dayOfWeek]}
                        </span>
                      </label>
                    </div>

                    {/* Time inputs */}
                    {day.isOpen ? (
                      <>
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="time"
                            value={day.openTime}
                            onChange={(e) =>
                              updateDayHours(day.dayOfWeek, 'openTime', e.target.value)
                            }
                            className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all text-sm"
                          />
                          <span className="text-gray-400">-</span>
                          <input
                            type="time"
                            value={day.closeTime}
                            onChange={(e) =>
                              updateDayHours(day.dayOfWeek, 'closeTime', e.target.value)
                            }
                            className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all text-sm"
                          />
                        </div>
                        <button
                          onClick={() => copyToAll(day.dayOfWeek)}
                          className="px-3 py-1.5 text-xs font-medium text-[#0066FF] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 whitespace-nowrap"
                        >
                          Kopier til alle
                        </button>
                      </>
                    ) : (
                      <span className="text-sm text-gray-500 flex-1">Stengt</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-end">
                <button
                  onClick={handleSaveBusinessHours}
                  disabled={saving}
                  className="px-5 py-2.5 bg-[#0066FF] text-white rounded-xl hover:bg-[#0052CC] transition-all shadow-sm hover:shadow font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Lagrer...' : 'Lagre åpningstider'}
                </button>
              </div>
            </div>

            {/* Quick presets */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Hurtigvalg
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    setBusinessHours(
                      businessHours.map((day) => ({
                        ...day,
                        isOpen: day.dayOfWeek >= 1 && day.dayOfWeek <= 5,
                        openTime: '09:00',
                        closeTime: '17:00',
                      }))
                    );
                  }}
                  className="px-4 py-3 bg-white rounded-lg text-sm hover:shadow-md transition-all border border-gray-200 font-medium text-gray-700"
                >
                  Man-Fre 09:00-17:00
                </button>
                <button
                  onClick={() => {
                    setBusinessHours(
                      businessHours.map((day) => ({
                        ...day,
                        isOpen: day.dayOfWeek >= 1 && day.dayOfWeek <= 6,
                        openTime: '10:00',
                        closeTime: '18:00',
                      }))
                    );
                  }}
                  className="px-4 py-3 bg-white rounded-lg text-sm hover:shadow-md transition-all border border-gray-200 font-medium text-gray-700"
                >
                  Man-Lør 10:00-18:00
                </button>
                <button
                  onClick={() => {
                    setBusinessHours(
                      businessHours.map((day) => ({
                        ...day,
                        isOpen: true,
                        openTime: '08:00',
                        closeTime: '20:00',
                      }))
                    );
                  }}
                  className="px-4 py-3 bg-white rounded-lg text-sm hover:shadow-md transition-all border border-gray-200 font-medium text-gray-700"
                >
                  Alle dager 08:00-20:00
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Bedriftsprofil</h3>
            <p className="text-sm text-gray-600 mb-8">
              Oppdater din bedriftsinformasjon
            </p>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">Profil innstillinger kommer snart</p>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Betalingsmetoder</h3>
            <p className="text-sm text-gray-600 mb-6">
              Koble til Vipps og Stripe for å motta betalinger
            </p>

            <div className="space-y-4">
              {/* Vipps */}
              <div className="border border-gray-200 rounded-xl p-5 hover:border-[#0066FF] transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Vipps</h4>
                      <p className="text-sm text-gray-600">Norges mest populære betalingsmetode</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 font-medium text-sm">
                    Koble til
                  </button>
                </div>
              </div>

              {/* Stripe */}
              <div className="border border-gray-200 rounded-xl p-5 hover:border-[#0066FF] transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Stripe</h4>
                      <p className="text-sm text-gray-600">Aksepter kort fra hele verden</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 font-medium text-sm">
                    Koble til
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Varslinger</h3>
            <p className="text-sm text-gray-600 mb-8">
              Velg hvordan du vil motta varsler om bookinger
            </p>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">Varslingsinnstillinger kommer snart</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
