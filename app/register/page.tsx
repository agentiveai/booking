'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    businessName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passordene matcher ikke');
      return;
    }

    if (formData.password.length < 8) {
      setError('Passordet må være minst 8 tegn');
      return;
    }

    if (!formData.businessName) {
      setError('Bedriftsnavn er påkrevd');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          role: 'PROVIDER',
          businessName: formData.businessName,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        router.push('/dashboard');
      } else {
        setError(data.error || 'Kunne ikke opprette konto');
      }
    } catch (err) {
      setError('Noe gikk galt. Prøv igjen senere.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="inline-block mb-8">
            <div className="text-2xl font-semibold text-gray-900 tracking-tight">
              Booking
            </div>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
              Kom i gang gratis
            </h1>
            <p className="text-gray-600">
              Opprett konto og start bookin på under 5 minutter.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Business name */}
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-900 mb-2">
                Bedriftsnavn
              </label>
              <input
                id="businessName"
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                placeholder="Min Bedrift AS"
              />
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                Fullt navn
              </label>
              <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                placeholder="Ola Nordmann"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                E-postadresse
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                placeholder="ola@bedrift.no"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-900 mb-2">
                Telefon <span className="text-gray-500 font-normal">(valgfritt)</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                placeholder="+47 123 45 678"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                Passord
              </label>
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                placeholder="Minst 8 tegn"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900 mb-2">
                Bekreft passord
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                placeholder="Samme som over"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3.5 text-base font-semibold text-white bg-[#0066FF] hover:bg-[#0052CC] rounded-xl transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Oppretter konto...' : 'Opprett konto'}
            </button>
          </form>

          {/* Terms */}
          <p className="mt-6 text-sm text-gray-600 text-center">
            Ved å registrere deg godtar du våre{' '}
            <a href="#" className="text-[#0066FF] hover:underline">
              vilkår
            </a>{' '}
            og{' '}
            <a href="#" className="text-[#0066FF] hover:underline">
              personvern
            </a>
          </p>

          {/* Sign in link */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              Har du allerede en konto?{' '}
              <Link href="/login" className="font-medium text-[#0066FF] hover:underline">
                Logg inn
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Image/Feature */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-50 to-indigo-50 items-center justify-center p-12">
        <div className="max-w-md">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full text-sm font-medium text-gray-700 shadow-sm mb-6">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Enkelt oppsett
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              Start booking på under 5 minutter
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Sett opp tjenester, åpningstider og betalingsmetoder.
              Del din bookinglenke og begynn å ta imot kunder - ingen konto nødvendig for kundene dine.
            </p>
          </div>

          {/* Features list */}
          <ul className="space-y-4">
            <li className="flex items-start">
              <svg className="w-6 h-6 text-green-600 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <div className="font-semibold text-gray-900">Ingen kredittkort</div>
                <div className="text-sm text-gray-600">Gratis for alltid. Oppgrader når du vil.</div>
              </div>
            </li>
            <li className="flex items-start">
              <svg className="w-6 h-6 text-green-600 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <div className="font-semibold text-gray-900">Vipps-betaling</div>
                <div className="text-sm text-gray-600">Aksepter betalinger direkte i bookingflyten.</div>
              </div>
            </li>
            <li className="flex items-start">
              <svg className="w-6 h-6 text-green-600 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <div className="font-semibold text-gray-900">Automatiske påminnelser</div>
                <div className="text-sm text-gray-600">Reduser no-shows med 50% automatisk.</div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
