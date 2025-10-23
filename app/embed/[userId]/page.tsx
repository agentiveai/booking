'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

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
  logo?: string | null;
  brandColor?: string;
  brandColorDark?: string;
  hideBranding?: boolean;
}

export default function EmbedBookingWidget() {
  const params = useParams();
  const userId = params.userId as string;

  const [provider, setProvider] = useState<Provider | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const brandColor = provider?.brandColor || '#0066FF';
  const brandColorDark = provider?.brandColorDark || '#0052CC';

  useEffect(() => {
    fetchProviderData();
  }, [userId]);

  const fetchProviderData = async () => {
    try {
      const response = await fetch(`/api/public/provider/${userId}`);

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

  const handleServiceClick = (serviceId: string) => {
    // Open in new window/tab
    window.open(`${window.location.origin}/book/${userId}/${serviceId}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-white">
        <div
          className="w-8 h-8 border-3 border-gray-200 rounded-full animate-spin"
          style={{ borderTopColor: brandColor }}
        ></div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6 bg-white">
        <div className="text-center">
          <p className="text-gray-600">Kunne ikke laste bookingwidget</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6">
      {/* Provider Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          {provider.logo ? (
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center p-1">
              <img
                src={provider.logo}
                alt={provider.businessName || provider.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : (
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
              style={{
                background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColorDark} 100%)`,
              }}
            >
              {provider.businessName?.charAt(0).toUpperCase() || provider.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {provider.businessName || provider.name}
            </h2>
            <p className="text-sm text-gray-600">Book time online</p>
          </div>
        </div>
      </div>

      {/* Services List */}
      {services.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Ingen tjenester tilgjengelig</p>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => handleServiceClick(service.id)}
              className="w-full text-left p-4 bg-white border-2 border-gray-200 rounded-lg hover:shadow-md transition-all group"
              style={{ borderColor: '#E5E7EB' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = brandColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 mr-3">
                  <h3 className="font-semibold text-gray-900 mb-1 transition-colors truncate">
                    {service.nameNo}
                  </h3>
                  {service.descriptionNo && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {service.descriptionNo}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {service.duration} min
                    </span>
                    <span className="font-semibold" style={{ color: brandColor }}>
                      {new Intl.NumberFormat('no-NO', { style: 'decimal', minimumFractionDigits: 0 }).format(Number(service.price))} NOK
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div
                    className="px-3 py-1.5 text-white rounded-lg text-sm font-medium transition-colors"
                    style={{ backgroundColor: brandColor }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = brandColorDark;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = brandColor;
                    }}
                  >
                    Book
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Powered by footer - conditional */}
      {!provider.hideBranding && (
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <a
            href={window.location.origin}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 transition-colors"
            style={{ color: '#6B7280' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = brandColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#6B7280';
            }}
          >
            Powered by Booking Platform
          </a>
        </div>
      )}
    </div>
  );
}
