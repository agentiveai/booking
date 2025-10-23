'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface BrandingSettings {
  logo: string | null;
  brandColor: string;
  brandColorDark: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  hideBranding: boolean;
}

export default function BrandingPage() {
  const [settings, setSettings] = useState<BrandingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    brandColor: '#0066FF',
    brandColorDark: '#0052CC',
    hideBranding: false,
  });

  useEffect(() => {
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/branding', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.branding);
        setFormData({
          brandColor: data.branding.brandColor,
          brandColorDark: data.branding.brandColorDark,
          hideBranding: data.branding.hideBranding,
        });
        setPreviewLogo(data.branding.logo);
      }
    } catch (error) {
      console.error('Failed to fetch branding:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > 2 * 1024 * 1024) {
      alert('Filen er for stor. Maksimal størrelse: 2MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Ugyldig filtype. Tillatte typer: PNG, JPG, SVG, WEBP');
      return;
    }

    setUploading(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewLogo(data.logoUrl);
        alert('Logo lastet opp!');
        fetchBranding();
      } else {
        const error = await response.json();
        alert(error.error || 'Kunne ikke laste opp logo');
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      alert('Noe gikk galt ved opplasting av logo');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!confirm('Er du sikker på at du vil slette logoen?')) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch('/api/upload/logo', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setPreviewLogo(null);
        alert('Logo slettet!');
        fetchBranding();
      }
    } catch (error) {
      console.error('Logo delete error:', error);
      alert('Kunne ikke slette logo');
    }
  };

  const handleSaveColors = async () => {
    if (formData.hideBranding && settings?.plan === 'FREE') {
      alert('Å skjule plattform-branding krever Pro-plan eller høyere');
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/branding', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Innstillinger lagret!');
        fetchBranding();
      } else {
        const error = await response.json();
        alert(error.error || 'Kunne ikke lagre innstillinger');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Noe gikk galt');
    } finally {
      setSaving(false);
    }
  };

  const generateDarkColor = (hexColor: string): string => {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    // Darken by 15%
    const newR = Math.floor(r * 0.85);
    const newG = Math.floor(g * 0.85);
    const newB = Math.floor(b * 0.85);

    // Convert back to hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  };

  const handleColorChange = (color: string) => {
    setFormData({
      ...formData,
      brandColor: color,
      brandColorDark: generateDarkColor(color),
    });
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
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Merkevare & Design</h2>
          <p className="text-gray-600 mt-1">Tilpass hvordan bookingsiden din ser ut</p>
        </div>

        {/* Plan Banner (if FREE) */}
        {settings?.plan === 'FREE' && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-[#0066FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Oppgrader til Pro</h3>
                <p className="text-gray-700 mb-4">
                  Få tilgang til avansert merkevare-tilpasning, skjul plattform-branding, og mye mer.
                </p>
                <button className="px-4 py-2 bg-[#0066FF] text-white rounded-lg hover:bg-[#0052CC] transition-colors font-medium text-sm">
                  Se Pro-plan (15 EUR/måned)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Logo Upload */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Logo</h3>

          <div className="flex items-start gap-6">
            {/* Logo Preview */}
            <div className="flex-shrink-0">
              {previewLogo ? (
                <div className="w-32 h-32 border-2 border-gray-200 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden">
                  <img src={previewLogo} alt="Logo" className="max-w-full max-h-full object-contain" />
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50">
                  <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-4">
                Last opp din bedrifts logo. Anbefalt størrelse: 200x200 piksler. Max 2MB.
              </p>

              <div className="flex gap-3">
                <label className="px-4 py-2 bg-[#0066FF] text-white rounded-lg hover:bg-[#0052CC] transition-colors cursor-pointer font-medium text-sm">
                  {uploading ? 'Laster opp...' : 'Last opp logo'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>

                {previewLogo && (
                  <button
                    onClick={handleDeleteLogo}
                    className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
                  >
                    Slett logo
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-3">
                Støttede formater: PNG, JPG, SVG, WEBP
              </p>
            </div>
          </div>
        </div>

        {/* Brand Colors */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Merkevarefarge</h3>

          <div className="space-y-4">
            {/* Primary Color */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Primærfarge
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={formData.brandColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-20 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
                />
                <input
                  type="text"
                  value={formData.brandColor}
                  onChange={(e) => {
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
                      handleColorChange(e.target.value);
                    }
                  }}
                  placeholder="#0066FF"
                  className="px-4 py-2 border border-gray-200 rounded-lg font-mono text-sm flex-1 max-w-xs"
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Denne fargen brukes for knapper, lenker, og aksenter på bookingsiden din.
              </p>
            </div>

            {/* Auto-generated Dark Color */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Mørk variant (genereres automatisk)
              </label>
              <div className="flex items-center gap-4">
                <div
                  className="w-20 h-12 rounded-lg border-2 border-gray-200"
                  style={{ backgroundColor: formData.brandColorDark }}
                ></div>
                <span className="font-mono text-sm text-gray-600">{formData.brandColorDark}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Brukes for hover-tilstander og kontrast.
              </p>
            </div>

            {/* Color Preview */}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-900 mb-3">Forhåndsvisning</p>
              <div className="flex gap-3">
                <button
                  style={{
                    backgroundColor: formData.brandColor,
                    color: 'white',
                  }}
                  className="px-6 py-3 rounded-lg font-medium shadow-sm"
                >
                  Book time nå
                </button>
                <button
                  style={{
                    backgroundColor: formData.brandColorDark,
                    color: 'white',
                  }}
                  className="px-6 py-3 rounded-lg font-medium shadow-sm"
                >
                  Hover-tilstand
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Branding */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Plattform-branding</h3>

          <div className="space-y-4">
            <label className="flex items-start cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.hideBranding}
                onChange={(e) => setFormData({ ...formData, hideBranding: e.target.checked })}
                disabled={settings?.plan === 'FREE'}
                className="mt-1 w-4 h-4 text-[#0066FF] border-gray-300 rounded focus:ring-[#0066FF] disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="ml-3">
                <span className="text-sm font-medium text-gray-900">
                  Skjul &quot;Powered by Booking Platform&quot;
                </span>
                {settings?.plan === 'FREE' && (
                  <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                    Pro
                  </span>
                )}
                <p className="text-xs text-gray-600 mt-1">
                  Fjern plattform-merkingen fra bookingsidene dine for et mer profesjonelt utseende.
                </p>
              </div>
            </label>

            {settings?.plan === 'FREE' && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-700">
                  Denne funksjonen er tilgjengelig på Pro-planen (15 EUR/måned).
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveColors}
            disabled={saving}
            className="px-6 py-3 bg-[#0066FF] text-white rounded-xl hover:bg-[#0052CC] transition-all shadow-sm hover:shadow font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Lagrer...' : 'Lagre endringer'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
