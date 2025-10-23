'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Service {
  id: string;
  nameNo: string;
  descriptionNo: string;
  duration: number;
  price: number;
  isActive: boolean;
}

interface Provider {
  id: string;
  name: string;
  businessName: string;
  email: string;
}

export default function BookingLandingPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  const [provider, setProvider] = useState<Provider | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchProviderData();
  }, [username]);

  const fetchProviderData = async () => {
    try {
      // Fetch provider info and services by username/business name
      const response = await fetch(`/api/public/provider/${username}`);

      if (!response.ok) {
        setError(true);
        setLoading(false);
        return;
      }

      const data = await response.json();
      setProvider(data.provider);
      setServices(data.services);
    } catch (err) {
      console.error('Failed to fetch provider data:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (serviceId: string) => {
    router.push(`/booking/${provider?.id}?serviceId=${serviceId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-[#0066FF] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Siden ble ikke funnet</h2>
          <p className="text-gray-600">Vi kunne ikke finne denne bookingsiden.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#0066FF] to-[#0052CC] rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              {provider.businessName?.charAt(0).toUpperCase() || provider.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                {provider.businessName || provider.name}
              </h1>
              <p className="text-gray-600">Velg en tjeneste for å booke time</p>
            </div>
          </div>
        </div>
      </header>

      {/* Services Grid */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {services.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ingen tjenester tilgjengelig</h3>
            <p className="text-gray-600">Denne bedriften har ikke lagt til noen tjenester ennå.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => handleServiceSelect(service.id)}
                className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 text-left border-2 border-transparent hover:border-[#0066FF]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-[#0066FF] transition-colors">
                      {service.nameNo}
                    </h3>
                    {service.descriptionNo && (
                      <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                        {service.descriptionNo}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{service.duration} min</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {new Intl.NumberFormat('no-NO', { style: 'decimal', minimumFractionDigits: 0 }).format(Number(service.price))}
                    </span>
                    <span className="text-sm text-gray-600">NOK</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center px-4 py-2.5 bg-[#0066FF] text-white rounded-xl font-medium text-sm group-hover:bg-[#0052CC] transition-colors">
                  Book time
                  <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Powered by footer */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500">
            Powered by{' '}
            <a href="/" className="text-[#0066FF] hover:text-[#0052CC] font-medium">
              Booking Platform
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
