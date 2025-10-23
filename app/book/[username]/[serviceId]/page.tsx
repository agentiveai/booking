'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Service {
  id: string;
  nameNo: string;
  descriptionNo: string;
  duration: number;
  price: number;
}

interface Provider {
  id: string;
  name: string;
  businessName: string;
  logo?: string | null;
  brandColor?: string;
  brandColorDark?: string;
  hideBranding?: boolean;
}

export default function DirectServiceBookingPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const serviceId = params.serviceId as string;

  const [provider, setProvider] = useState<Provider | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Get brand colors with fallbacks
  const brandColor = provider?.brandColor || '#0066FF';
  const brandColorDark = provider?.brandColorDark || '#0052CC';

  useEffect(() => {
    fetchData();
  }, [username, serviceId]);

  const fetchData = async () => {
    try {
      // First get the provider
      const providerResponse = await fetch(`/api/public/provider/${username}`);
      if (!providerResponse.ok) {
        setError(true);
        setLoading(false);
        return;
      }

      const providerData = await providerResponse.json();
      setProvider(providerData.provider);

      // Find the specific service
      const foundService = providerData.services.find((s: Service) => s.id === serviceId);
      if (!foundService) {
        setError(true);
        setLoading(false);
        return;
      }

      setService(foundService);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    router.push(`/booking/${provider?.id}?serviceId=${serviceId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div
          className="w-12 h-12 border-4 border-gray-200 rounded-full animate-spin"
          style={{ borderTopColor: brandColor }}
        ></div>
      </div>
    );
  }

  if (error || !provider || !service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Tjenesten ble ikke funnet</h2>
          <p className="text-gray-600">Vi kunne ikke finne denne tjenesten.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Provider Header */}
        <div className="text-center mb-8">
          {provider.logo ? (
            <div className="w-24 h-24 mx-auto mb-4 rounded-2xl overflow-hidden bg-white shadow-xl flex items-center justify-center p-2">
              <img
                src={provider.logo}
                alt={provider.businessName || provider.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : (
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl mx-auto mb-4"
              style={{
                background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColorDark} 100%)`,
              }}
            >
              {provider.businessName?.charAt(0).toUpperCase() || provider.name.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="text-xl font-semibold text-gray-600">
            {provider.businessName || provider.name}
          </h1>
        </div>

        {/* Service Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              {service.nameNo}
            </h2>
            {service.descriptionNo && (
              <p className="text-lg text-gray-600 max-w-xl mx-auto">
                {service.descriptionNo}
              </p>
            )}
          </div>

          {/* Service Details */}
          <div className="flex items-center justify-center gap-8 mb-10 flex-wrap">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${brandColor}15` }}
              >
                <svg
                  className="w-6 h-6"
                  style={{ color: brandColor }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm text-gray-600">Varighet</p>
                <p className="text-lg font-semibold text-gray-900">{service.duration} min</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm text-gray-600">Pris</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Intl.NumberFormat('no-NO', { style: 'decimal', minimumFractionDigits: 0 }).format(Number(service.price))} NOK
                </p>
              </div>
            </div>
          </div>

          {/* Book Button */}
          <button
            onClick={handleBookNow}
            className="w-full py-4 text-white rounded-2xl transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            style={{
              backgroundColor: brandColor,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = brandColorDark;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = brandColor;
            }}
          >
            Book time nå
          </button>

          {/* See all services link */}
          <div className="mt-6 text-center">
            <Link
              href={`/book/${username}`}
              className="text-sm text-gray-600 transition-colors"
              style={{
                color: '#6B7280',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = brandColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#6B7280';
              }}
            >
              Se alle tjenester fra {provider.businessName || provider.name} →
            </Link>
          </div>
        </div>

        {/* Powered by footer - conditional */}
        {!provider.hideBranding && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Powered by{' '}
              <Link
                href="/"
                className="font-medium transition-colors"
                style={{ color: brandColor }}
              >
                Booking Platform
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
