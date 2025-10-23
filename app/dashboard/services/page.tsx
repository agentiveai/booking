'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface Service {
  id: string;
  name: string;
  nameNo: string;
  description?: string;
  descriptionNo?: string;
  duration: number;
  price: number;
  bufferTimeBefore: number;
  bufferTimeAfter: number;
  isActive: boolean;
  requiresStaff: boolean;
  anyStaffMember: boolean;
  maxConcurrent: number;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [copiedServiceId, setCopiedServiceId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 60,
    price: 0,
    bufferTimeBefore: 0,
    bufferTimeAfter: 0,
    requiresStaff: true,
    anyStaffMember: true,
    maxConcurrent: 1,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const userResponse = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        const providerId = userData.user.id;
        setUserId(providerId);

        const response = await fetch(`/api/services?providerId=${providerId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setServices(data.services);
        }
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const url = editingService
        ? `/api/services/${editingService.id}`
        : '/api/services';

      const method = editingService ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          nameNo: formData.name, // Use same name for both
          descriptionNo: formData.description, // Use same description for both
        }),
      });

      if (response.ok) {
        setShowCreateModal(false);
        resetForm();
        fetchServices();
      } else {
        const data = await response.json();
        alert(data.error || 'Kunne ikke lagre tjeneste');
      }
    } catch (error) {
      console.error('Failed to save service:', error);
      alert('Noe gikk galt');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      duration: 60,
      price: 0,
      bufferTimeBefore: 0,
      bufferTimeAfter: 0,
      requiresStaff: true,
      anyStaffMember: true,
      maxConcurrent: 1,
    });
    setEditingService(null);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.nameNo, // Use Norwegian name
      description: service.descriptionNo || '',
      duration: service.duration,
      price: service.price,
      bufferTimeBefore: service.bufferTimeBefore,
      bufferTimeAfter: service.bufferTimeAfter,
      requiresStaff: service.requiresStaff ?? true,
      anyStaffMember: service.anyStaffMember ?? true,
      maxConcurrent: service.maxConcurrent ?? 1,
    });
    setShowCreateModal(true);
  };

  const handleToggleActive = async (serviceId: string, isActive: boolean) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        fetchServices();
      }
    } catch (error) {
      console.error('Failed to toggle service:', error);
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Er du sikker på at du vil slette denne tjenesten?')) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        fetchServices();
      } else {
        const data = await response.json();
        alert(data.error || 'Kunne ikke slette tjeneste');
      }
    } catch (error) {
      console.error('Failed to delete service:', error);
      alert('Noe gikk galt');
    }
  };

  const copyServiceLink = (serviceId: string) => {
    const serviceUrl = `${window.location.origin}/book/${userId}/${serviceId}`;
    navigator.clipboard.writeText(serviceUrl);
    setCopiedServiceId(serviceId);
    setTimeout(() => setCopiedServiceId(null), 2000);
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
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Tjenester</h2>
            <p className="text-gray-600 mt-1">Administrer dine bookbare tjenester</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-[#0066FF] text-white rounded-xl hover:bg-[#0052CC] transition-all shadow-sm hover:shadow font-medium text-sm flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Ny tjeneste
          </button>
        </div>

        {/* Services grid */}
        {services.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Ingen tjenester ennå
            </h3>
            <p className="text-gray-600 mb-6">
              Opprett din første tjeneste for å begynne å ta imot bookinger
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2.5 bg-[#0066FF] text-white rounded-xl hover:bg-[#0052CC] transition-all shadow-sm hover:shadow font-medium text-sm"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Opprett tjeneste
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                className={`bg-white rounded-xl border transition-all ${
                  service.isActive
                    ? 'border-gray-200 hover:shadow-md'
                    : 'border-gray-100 opacity-60'
                }`}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                        {service.nameNo}
                      </h3>
                      {service.descriptionNo && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {service.descriptionNo}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-2.5 mb-5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Varighet</span>
                      <span className="font-medium text-gray-900">
                        {service.duration} min
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Pris</span>
                      <span className="font-semibold text-[#0066FF]">
                        {new Intl.NumberFormat('no-NO', { style: 'decimal', minimumFractionDigits: 0 }).format(Number(service.price))} NOK
                      </span>
                    </div>
                    {(service.bufferTimeBefore > 0 || service.bufferTimeAfter > 0) && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Buffer</span>
                        <span className="text-gray-900">
                          {service.bufferTimeBefore > 0 && `${service.bufferTimeBefore}m før`}
                          {service.bufferTimeBefore > 0 && service.bufferTimeAfter > 0 && ' / '}
                          {service.bufferTimeAfter > 0 && `${service.bufferTimeAfter}m etter`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status badge */}
                  <div className="mb-5">
                    <button
                      onClick={() => handleToggleActive(service.id, service.isActive)}
                      className={`w-full px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                        service.isActive
                          ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {service.isActive ? 'Aktiv' : 'Inaktiv'}
                    </button>
                  </div>

                  {/* Copy Link Button */}
                  <div className="mb-3">
                    <button
                      onClick={() => copyServiceLink(service.id)}
                      className="w-full px-3 py-2 text-sm font-medium text-[#0066FF] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 flex items-center justify-center gap-2"
                    >
                      {copiedServiceId === service.id ? (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Kopiert!
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Kopier bookinglenke
                        </>
                      )}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(service)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Rediger
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Slett
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Modal header */}
              <div className="sticky top-0 bg-white px-6 py-5 border-b border-gray-100 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                    {editingService ? 'Rediger tjeneste' : 'Ny tjeneste'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Tjenestenavn <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                    placeholder="F.eks. Hårklipp, Massasje, Konsultasjon"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Beskrivelse
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all text-gray-900 placeholder-gray-400 resize-none"
                    placeholder="Kort beskrivelse av tjenesten..."
                  />
                </div>

                {/* Duration and Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Varighet (minutter) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="1"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Pris (NOK) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all text-gray-900"
                    />
                  </div>
                </div>

                {/* Buffer times */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Buffer tid (valgfritt)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Før avtale (minutter)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={formData.bufferTimeBefore}
                        onChange={(e) => setFormData({ ...formData, bufferTimeBefore: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all text-gray-900"
                      />
                      <p className="mt-1.5 text-xs text-gray-500">For forberedelse</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Etter avtale (minutter)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={formData.bufferTimeAfter}
                        onChange={(e) => setFormData({ ...formData, bufferTimeAfter: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all text-gray-900"
                      />
                      <p className="mt-1.5 text-xs text-gray-500">For rydding</p>
                    </div>
                  </div>
                </div>

                {/* Staff & Capacity Settings */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Bemanning og kapasitet</h4>

                  {/* Requires Staff Checkbox */}
                  <div className="mb-4">
                    <label className="flex items-start cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.requiresStaff}
                        onChange={(e) => setFormData({ ...formData, requiresStaff: e.target.checked })}
                        className="mt-0.5 w-4 h-4 text-[#0066FF] border-gray-300 rounded focus:ring-[#0066FF]"
                      />
                      <div className="ml-3">
                        <span className="text-sm font-medium text-gray-900">Krever ansatt</span>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Denne tjenesten må utføres av et teammedlem
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Any Staff Member Checkbox */}
                  {formData.requiresStaff && (
                    <div className="mb-4">
                      <label className="flex items-start cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.anyStaffMember}
                          onChange={(e) => setFormData({ ...formData, anyStaffMember: e.target.checked })}
                          className="mt-0.5 w-4 h-4 text-[#0066FF] border-gray-300 rounded focus:ring-[#0066FF]"
                        />
                        <div className="ml-3">
                          <span className="text-sm font-medium text-gray-900">Hvilken som helst ansatt</span>
                          <p className="text-xs text-gray-600 mt-0.5">
                            Alle teammedlemmer kan utføre denne tjenesten
                          </p>
                        </div>
                      </label>
                    </div>
                  )}

                  {/* Max Concurrent */}
                  {formData.requiresStaff && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Maks samtidige bookinger
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={formData.maxConcurrent}
                        onChange={(e) => setFormData({ ...formData, maxConcurrent: parseInt(e.target.value) || 1 })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all text-gray-900"
                      />
                      <p className="mt-1.5 text-xs text-gray-600">
                        Hvor mange kunder kan booke samtidig (f.eks. gruppetimer)
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-5 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Avbryt
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-sm font-semibold bg-[#0066FF] text-white rounded-xl hover:bg-[#0052CC] transition-all shadow-sm hover:shadow"
                  >
                    {editingService ? 'Oppdater tjeneste' : 'Opprett tjeneste'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
