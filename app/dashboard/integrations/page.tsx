'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function IntegrationsPage() {
  const [userId, setUserId] = useState<string>('');
  const [copied, setCopied] = useState<'iframe' | 'script' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
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
      console.error('Failed to fetch user info:', error);
    } finally {
      setLoading(false);
    }
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';
  const embedUrl = `${baseUrl}/embed/${userId}`;
  const bookingPageUrl = `${baseUrl}/book/${userId}`;

  const iframeCode = `<iframe
  src="${embedUrl}"
  width="100%"
  height="600"
  frameborder="0"
  style="border: none; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"
></iframe>`;

  const scriptCode = `<!-- Booking Widget -->
<div id="booking-widget-${userId}"></div>
<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.src = '${embedUrl}';
    iframe.width = '100%';
    iframe.height = '600';
    iframe.frameBorder = '0';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '12px';
    iframe.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    document.getElementById('booking-widget-${userId}').appendChild(iframe);
  })();
</script>`;

  const copyToClipboard = (text: string, type: 'iframe' | 'script') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
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
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Integrasjoner</h2>
          <p className="text-gray-600 mt-1">Integrer bookingsystemet på din egen nettside</p>
        </div>

        {/* Website Embed Section */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#0066FF] rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Embed på din nettside
                </h3>
                <p className="text-sm text-gray-600">
                  Legg til bookingwidget direkte på din nettside. Kundene dine kan booke uten å forlate siden din!
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Preview */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Forhåndsvisning
              </h4>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <iframe
                  src={embedUrl}
                  width="100%"
                  height="600"
                  frameBorder="0"
                  className="rounded-lg shadow-sm"
                  style={{ border: 'none' }}
                ></iframe>
              </div>
            </div>

            {/* Iframe Code */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Metode 1: iFrame (Enklest)
                </h4>
                <button
                  onClick={() => copyToClipboard(iframeCode, 'iframe')}
                  className="px-3 py-1.5 text-xs font-medium text-[#0066FF] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 flex items-center gap-2"
                >
                  {copied === 'iframe' ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Kopiert!
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Kopier kode
                    </>
                  )}
                </button>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-green-400 font-mono">
                  <code>{iframeCode}</code>
                </pre>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Lim inn denne koden hvor du vil at bookingwidgeten skal vises på nettsiden din.
              </p>
            </div>

            {/* Script Code */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Metode 2: JavaScript (Mer fleksibel)
                </h4>
                <button
                  onClick={() => copyToClipboard(scriptCode, 'script')}
                  className="px-3 py-1.5 text-xs font-medium text-[#0066FF] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 flex items-center gap-2"
                >
                  {copied === 'script' ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Kopiert!
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Kopier kode
                    </>
                  )}
                </button>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-green-400 font-mono">
                  <code>{scriptCode}</code>
                </pre>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Denne metoden laster inn widgeten dynamisk med JavaScript.
              </p>
            </div>
          </div>
        </div>

        {/* Direct Booking Link Section */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Direkte bookinglenke
                </h3>
                <p className="text-sm text-gray-600">
                  Del denne lenken direkte med kundene dine via e-post, SMS eller sosiale medier
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-3">
              <input
                type="text"
                readOnly
                value={bookingPageUrl}
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-mono text-sm"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(bookingPageUrl);
                  setCopied('script'); // Reuse copied state
                  setTimeout(() => setCopied(null), 2000);
                }}
                className="px-4 py-3 bg-[#0066FF] text-white rounded-xl hover:bg-[#0052CC] transition-all shadow-sm hover:shadow font-medium text-sm flex items-center gap-2 whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Kopier
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-3">
              Denne lenken tar kundene direkte til din bookingside hvor de kan velge tjeneste og tidspunkt.
            </p>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Trenger du hjelp?
          </h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p><strong>WordPress:</strong> Lim inn iframe-koden i en HTML-blokk</p>
            <p><strong>Wix:</strong> Bruk "Embed HTML" komponenten</p>
            <p><strong>Squarespace:</strong> Legg til en "Code Block"</p>
            <p><strong>Webflow:</strong> Bruk "Embed" elementet</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
