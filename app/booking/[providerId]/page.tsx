'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { format, addDays, startOfDay } from 'date-fns';
import { nb } from 'date-fns/locale';
import CalendarPicker from '@/components/booking/CalendarPicker';

interface Service {
  id: string;
  name: string;
  nameNo: string;
  description?: string;
  descriptionNo?: string;
  duration: number;
  price: number;
}

interface TimeSlot {
  start: string;
  end: string;
}

export default function BookingPage() {
  const params = useParams();
  const providerId = params.providerId as string;

  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [availabilityMap, setAvailabilityMap] = useState<{ [key: string]: number }>({});
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    notes: '',
    paymentMethod: 'VIPPS',
  });

  useEffect(() => {
    fetchServices();
  }, [providerId]);

  // Prefetch availability for the next 30 days when service is selected
  useEffect(() => {
    if (selectedService && step === 2) {
      prefetchAvailability();
    }
  }, [selectedService, step]);

  const fetchServices = async () => {
    try {
      const response = await fetch(`/api/services?providerId=${providerId}`);
      const data = await response.json();
      setServices(data.services);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    }
  };

  const prefetchAvailability = async () => {
    if (!selectedService) return;

    setLoadingAvailability(true);
    const availMap: { [key: string]: number } = {};

    try {
      // Fetch availability for next 30 days
      const promises = [];
      for (let i = 0; i < 30; i++) {
        const date = addDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');

        const promise = fetch(
          `/api/bookings/availability?providerId=${providerId}&serviceId=${selectedService.id}&date=${dateStr}`
        )
          .then(res => res.json())
          .then(data => {
            availMap[dateStr] = data.availableSlots?.length || 0;
          })
          .catch(err => {
            console.error(`Failed to fetch availability for ${dateStr}:`, err);
            availMap[dateStr] = 0;
          });

        promises.push(promise);
      }

      await Promise.all(promises);
      setAvailabilityMap(availMap);
    } catch (error) {
      console.error('Failed to prefetch availability:', error);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const fetchAvailability = async (date: Date) => {
    if (!selectedService) return;

    setLoading(true);
    setAvailableSlots([]);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const response = await fetch(
        `/api/bookings/availability?providerId=${providerId}&serviceId=${selectedService.id}&date=${dateStr}`
      );
      const data = await response.json();
      setAvailableSlots(data.availableSlots || []);
    } catch (error) {
      console.error('Failed to fetch availability:', error);
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedDate(null);
    setAvailableSlots([]);
    setSelectedSlot(null);
    setStep(2);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    fetchAvailability(date);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedSlot) return;

    setLoading(true);
    try {
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          serviceId: selectedService.id,
          startTime: selectedSlot.start,
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          customerPhone: formData.customerPhone,
          notes: formData.notes,
          paymentMethod: formData.paymentMethod,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.payment?.redirectUrl) {
          // Vipps payment - redirect to Vipps
          window.location.href = data.payment.redirectUrl;
        } else {
          // Stripe or other payment - redirect to confirmation page
          window.location.href = `/booking/confirmation?bookingId=${data.booking.id}`;
        }
      } else {
        alert(data.error || 'Kunne ikke opprette booking');
      }
    } catch (error) {
      console.error('Failed to create booking:', error);
      alert('Noe gikk galt. Prøv igjen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Book time</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Progress bar */}
        <div className="mb-10">
          <div className="flex items-center justify-between relative">
            {/* Line behind circles */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10"></div>
            <div
              className="absolute top-5 left-0 h-0.5 bg-[#0066FF] transition-all duration-300 -z-10"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            ></div>

            {[
              { num: 1, label: 'Tjeneste' },
              { num: 2, label: 'Dato & Tid' },
              { num: 3, label: 'Opplysninger' },
              { num: 4, label: 'Bekreftelse' },
            ].map(({ num, label }) => (
              <div key={num} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                    step >= num
                      ? 'bg-[#0066FF] text-white shadow-lg shadow-blue-500/30'
                      : 'bg-white text-gray-400 border-2 border-gray-200'
                  }`}
                >
                  {num}
                </div>
                <span className={`text-xs mt-2 font-medium ${step >= num ? 'text-gray-900' : 'text-gray-500'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Select Service */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-8 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Velg tjeneste</h2>
              <p className="text-gray-600 mt-1">Hva ønsker du å booke?</p>
            </div>

            {services.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-900 mb-2">Ingen tjenester tilgjengelig</p>
                <p className="text-gray-600">Kontakt bedriften for mer informasjon</p>
              </div>
            ) : (
              <div className="p-6 space-y-3">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className="w-full text-left p-6 bg-white border border-gray-200 rounded-xl hover:border-[#0066FF] hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#0066FF] transition-colors">
                          {service.nameNo}
                        </h3>
                        {service.descriptionNo && (
                          <p className="text-sm text-gray-600 mt-1">{service.descriptionNo}</p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {service.duration} min
                          </span>
                          <span className="font-semibold text-gray-900">
                            {new Intl.NumberFormat('no-NO', { style: 'decimal', minimumFractionDigits: 0 }).format(Number(service.price))} NOK
                          </span>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-[#0066FF] transition-colors flex-shrink-0 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Date & Time */}
        {step === 2 && selectedService && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-8 border-b border-gray-100">
              <button
                onClick={() => {
                  setStep(1);
                  setSelectedDate(null);
                  setAvailableSlots([]);
                }}
                className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors mb-4"
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Tilbake
              </button>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Velg dato og tid</h2>
              <p className="text-gray-600 mt-1">Når passer det best for deg?</p>
            </div>

            <div className="p-8 space-y-8">
              {/* Calendar */}
              <div className="relative">
                <CalendarPicker
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  availabilityData={availabilityMap}
                  isLoading={loadingAvailability}
                  minDate={startOfDay(new Date())}
                />
              </div>

              {/* Time slots */}
              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-4">
                    Tilgjengelige tider for {format(selectedDate, 'EEEE d. MMMM', { locale: nb })}
                  </label>
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="w-12 h-12 border-4 border-gray-200 border-t-[#0066FF] rounded-full animate-spin mb-4"></div>
                      <p className="text-gray-600">Laster ledige tider...</p>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-lg font-medium text-gray-900 mb-2">Ingen ledige tider</p>
                      <p className="text-gray-600">Prøv en annen dato</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {availableSlots.map((slot, index) => (
                        <button
                          key={index}
                          onClick={() => handleSlotSelect(slot)}
                          className="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-[#0066FF] hover:bg-blue-50 hover:text-[#0066FF] transition-all font-medium text-gray-900"
                        >
                          {new Date(slot.start).toLocaleTimeString('no-NO', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Customer Information */}
        {step === 3 && selectedService && selectedSlot && selectedDate && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-8 border-b border-gray-100">
              <button
                onClick={() => setStep(2)}
                className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors mb-4"
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Tilbake
              </button>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Dine opplysninger</h2>
              <p className="text-gray-600 mt-1">Fyll inn kontaktinformasjon</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Booking Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Din booking</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tjeneste:</span>
                    <span className="font-semibold text-gray-900">{selectedService.nameNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dato:</span>
                    <span className="font-semibold text-gray-900">
                      {format(selectedDate, 'EEEE d. MMMM yyyy', { locale: nb })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tid:</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(selectedSlot.start).toLocaleTimeString('no-NO', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Varighet:</span>
                    <span className="font-semibold text-gray-900">{selectedService.duration} min</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-blue-200">
                    <span className="text-gray-900 font-semibold">Pris:</span>
                    <span className="text-[#0066FF] font-bold">
                      {new Intl.NumberFormat('no-NO', { style: 'decimal', minimumFractionDigits: 0 }).format(Number(selectedService.price))} NOK
                    </span>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Fullt navn <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                  placeholder="Ola Nordmann"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  E-postadresse <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                  placeholder="ola@example.com"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Telefonnummer
                </label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                  placeholder="+47 123 45 678"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Melding til leverandør (valgfritt)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all text-gray-900 placeholder-gray-400 resize-none"
                  placeholder="Har du noe spesielt du vil informere om?"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Betalingsmetode
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: 'VIPPS' })}
                    className={`px-4 py-3 border-2 rounded-xl text-sm font-medium transition-all ${
                      formData.paymentMethod === 'VIPPS'
                        ? 'border-[#0066FF] bg-blue-50 text-[#0066FF]'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Vipps
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: 'STRIPE' })}
                    className={`px-4 py-3 border-2 rounded-xl text-sm font-medium transition-all ${
                      formData.paymentMethod === 'STRIPE'
                        ? 'border-[#0066FF] bg-blue-50 text-[#0066FF]'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Kort
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: 'CASH' })}
                    className={`px-4 py-3 border-2 rounded-xl text-sm font-medium transition-all ${
                      formData.paymentMethod === 'CASH'
                        ? 'border-[#0066FF] bg-blue-50 text-[#0066FF]'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Kontant
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#0066FF] text-white rounded-xl hover:bg-[#0052CC] transition-all font-semibold text-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Oppretter booking...
                  </span>
                ) : (
                  'Bekreft booking'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && selectedService && selectedSlot && selectedDate && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Booking bekreftet!</h2>
              <p className="text-gray-600 mb-8">
                Du vil motta en bekreftelse på e-post med alle detaljer.
              </p>

              <div className="bg-gray-50 rounded-xl p-6 text-left mb-8 max-w-md mx-auto">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Sammendrag</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tjeneste:</span>
                    <span className="font-semibold text-gray-900">{selectedService.nameNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dato:</span>
                    <span className="font-semibold text-gray-900">
                      {format(selectedDate, 'd. MMMM yyyy', { locale: nb })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tid:</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(selectedSlot.start).toLocaleTimeString('no-NO', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <a
                href="/my-bookings"
                className="inline-block px-6 py-3 bg-[#0066FF] text-white rounded-xl hover:bg-[#0052CC] transition-all font-medium"
              >
                Se dine bookinger
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
