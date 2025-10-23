'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function EmbeddingPage() {
  const [userId, setUserId] = useState<string>('');
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'inline' | 'popup' | 'floating'>('inline');

  useEffect(() => {
    fetchUserId();
  }, []);

  const fetchUserId = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUserId(data.user.id);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const embedCodes = {
    inline: `<!-- Inline Booking Widget -->
<div id="booking-widget" data-provider-id="${userId}"></div>
<script src="${baseUrl}/widget.js"></script>`,

    popup: `<!-- Popup Booking Button -->
<button data-booking-popup="${userId}" style="padding: 12px 24px; background: #0066FF; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
  Book Appointment
</button>
<script src="${baseUrl}/widget.js"></script>`,

    floating: `<!-- Floating Booking Button -->
<script src="${baseUrl}/widget.js"
        data-provider-id="${userId}"
        data-float="true"
        data-button-text="Book Now"
        data-button-color="#0066FF"
        data-position="bottom-right"></script>`
  };

  const iframeUrl = `${baseUrl}/embed/${userId}`;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Embed på Din Nettside</h2>
          <p className="text-gray-600 mt-1">
            Legg til bookingfunksjonalitet direkte på din egen nettside
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Hvorfor bruke embed widgets?</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Kunder booker direkte på din nettside (ingen omdirigering)</li>
                <li>• 5-10x høyere konverteringsrate enn eksterne bookingsider</li>
                <li>• Fullt tilpasset med dine merkevarefarge og logo</li>
                <li>• Enkel å installere - bare kopier og lim inn koden</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Widget Type Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('inline')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'inline'
                    ? 'bg-white text-[#0066FF] border-b-2 border-[#0066FF]'
                    : 'bg-gray-50 text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                  <span>Inline Embed</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('popup')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'popup'
                    ? 'bg-white text-[#0066FF] border-b-2 border-[#0066FF]'
                    : 'bg-gray-50 text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  <span>Popup Modal</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('floating')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'floating'
                    ? 'bg-white text-[#0066FF] border-b-2 border-[#0066FF]'
                    : 'bg-gray-50 text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span>Floating Button</span>
                </div>
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Inline Embed */}
            {activeTab === 'inline' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Inline Embed Widget</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Integrer booking-widgeten direkte inn i siden din. Perfekt for en dedikert booking-side.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Embed-kode (kopier og lim inn i HTML-en din)
                  </label>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{embedCodes.inline}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(embedCodes.inline, 'inline')}
                      className="absolute top-2 right-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                    >
                      {copied === 'inline' ? '✓ Kopiert!' : 'Kopier'}
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Forhåndsvisning</h4>
                  <div className="bg-white rounded border border-gray-200 p-4">
                    <iframe
                      src={iframeUrl}
                      style={{
                        width: '100%',
                        minHeight: '500px',
                        border: 'none',
                        borderRadius: '8px',
                      }}
                      title="Inline Embed Preview"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Popup Modal */}
            {activeTab === 'popup' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Popup Modal Widget</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Legg til en knapp som åpner booking-widgeten i en modal. Perfekt for å spare plass på siden.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Embed-kode
                  </label>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{embedCodes.popup}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(embedCodes.popup, 'popup')}
                      className="absolute top-2 right-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                    >
                      {copied === 'popup' ? '✓ Kopiert!' : 'Kopier'}
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-gray-700">
                    💡 <strong>Tips:</strong> Du kan tilpasse knappen med dine egne CSS-stiler. Bare behold <code className="bg-white px-1 rounded">data-booking-popup</code> attributtet.
                  </p>
                </div>
              </div>
            )}

            {/* Floating Button */}
            {activeTab === 'floating' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Floating Button Widget</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    En flytende knapp som alltid er synlig i hjørnet av siden. Høyest konverteringsrate!
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Embed-kode
                  </label>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{embedCodes.floating}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(embedCodes.floating, 'floating')}
                      className="absolute top-2 right-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                    >
                      {copied === 'floating' ? '✓ Kopiert!' : 'Kopier'}
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Tilpasningsalternativer</h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div>
                      <code className="bg-white px-2 py-1 rounded text-xs">data-button-text</code>
                      <span className="ml-2">Tekst på knappen (standard: &quot;Book&quot;)</span>
                    </div>
                    <div>
                      <code className="bg-white px-2 py-1 rounded text-xs">data-button-color</code>
                      <span className="ml-2">Farge på knappen (hex-kode, f.eks. #0066FF)</span>
                    </div>
                    <div>
                      <code className="bg-white px-2 py-1 rounded text-xs">data-position</code>
                      <span className="ml-2">Posisjon: bottom-right, bottom-left, top-right, top-left</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Resources */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trenger du hjelp?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">Test widgeten</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Åpne <code className="bg-gray-100 px-1 rounded">/embed/{userId}</code> i nettleseren for å teste.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">Tilpass utseende</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Gå til Merkevare & Design for å endre logo og farger.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
