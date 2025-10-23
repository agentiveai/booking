'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);

  useEffect(() => {
    setIsVisible(true);

    // Auto-rotate feature showcase
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % 3);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      title: 'Book på under 30 sekunder',
      description: 'Kunde velger tid → Betaler med Vipps → Får bekreftelse',
      image: '📱',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      title: 'Automatiske påminnelser',
      description: '24 timer før → E-post sendes → No-shows reduseres 50%',
      image: '⏰',
      color: 'from-purple-500 to-pink-600'
    },
    {
      title: 'Smart kalender',
      description: 'Aldri dobbeltbook → Synk med Google → Alt på ett sted',
      image: '📅',
      color: 'from-green-500 to-teal-600'
    }
  ];

  const stats = [
    { value: '50%', label: 'Færre no-shows', icon: '📈' },
    { value: '3 min', label: 'Oppsett-tid', icon: '⚡' },
    { value: '99.9%', label: 'Oppetid', icon: '🛡️' },
    { value: '24/7', label: 'Support', icon: '💬' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-white">
      {/* Floating Navigation */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-full z-50 shadow-lg shadow-black/5 px-6 py-3 transition-all">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Booking.no
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Funksjoner
            </a>
            <a href="#pricing" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Priser
            </a>
            <a href="#showcase" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Demo
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Logg inn
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-full transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5"
            >
              Start gratis →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - WOW Factor */}
      <div className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Animated background gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className={`max-w-7xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center mb-16">
            {/* Animated badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-full text-sm text-blue-700 font-medium mb-8 animate-bounce-slow shadow-lg shadow-blue-500/10">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
              Norges mest moderne bookingsystem
            </div>

            {/* Main headline with gradient */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-gray-900 tracking-tight mb-8 leading-[1.05]">
              Booking som
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent animate-gradient-x">
                faktisk virker
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Slutt med dobbeltbookinger, no-shows og manuell administrasjon.
              <br />
              <span className="font-semibold text-gray-900">Automatiser alt</span> med Vipps-betaling, påminnelser og kalendersynk.
            </p>

            {/* CTAs with stats */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link
                href="/register"
                className="group w-full sm:w-auto px-10 py-5 text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-2xl transition-all shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-1 relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start gratis i dag
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              </Link>
              <Link
                href="#showcase"
                className="w-full sm:w-auto px-10 py-5 text-lg font-bold text-gray-700 bg-white hover:bg-gray-50 rounded-2xl transition-all border-2 border-gray-200 hover:border-gray-300 shadow-lg hover:shadow-xl"
              >
                Se demo-video 🎥
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Ingen kredittkort
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Oppsett på 3 minutter
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Kanseller når som helst
              </div>
            </div>
          </div>

          {/* Interactive Feature Showcase - Calendly Style */}
          <div id="showcase" className="relative">
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-700/50 overflow-hidden">
              {/* Glow effect */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-blue-500/10 to-transparent blur-3xl"></div>

              <div className="relative z-10">
                {/* Feature tabs */}
                <div className="flex flex-wrap justify-center gap-3 mb-8">
                  {features.map((feature, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentFeature(index)}
                      className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                        currentFeature === index
                          ? 'bg-white text-gray-900 shadow-lg'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {feature.image} {feature.title}
                    </button>
                  ))}
                </div>

                {/* Feature display */}
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-12 min-h-[400px] flex flex-col items-center justify-center text-center">
                  <div className={`text-8xl mb-6 animate-bounce-slow`}>
                    {features[currentFeature].image}
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">
                    {features[currentFeature].title}
                  </h3>
                  <p className="text-xl text-gray-600 max-w-2xl">
                    {features[currentFeature].description}
                  </p>

                  {/* Progress indicator */}
                  <div className="flex gap-2 mt-8">
                    {features.map((_, index) => (
                      <div
                        key={index}
                        className={`h-2 rounded-full transition-all ${
                          index === currentFeature ? 'w-8 bg-blue-600' : 'w-2 bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20 px-6 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-5xl mb-3">{stat.icon}</div>
                <div className="text-4xl md:text-5xl font-black text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-blue-100 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-sm font-bold text-gray-500 mb-12 uppercase tracking-wider">
            Betrodd av ledende norske bedrifter
          </p>

          {/* Testimonials */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "Gikk fra 20% no-shows til under 5% på 2 uker. Vipps-integrasjonen er gull!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full flex items-center justify-center text-white font-bold">
                  MH
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Maria Hansen</div>
                  <div className="text-sm text-gray-600">Eier, Studio Glow</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "Sparer 10+ timer i uka på administrasjon. Alt er automatisk!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                  LA
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Lars Andersen</div>
                  <div className="text-sm text-gray-600">Fysioterapeut, Oslo</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-8 border border-green-100">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "Kundene elsker hvor enkelt det er. Økt bookinger med 40% på 3 måneder!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-teal-400 rounded-full flex items-center justify-center text-white font-bold">
                  SJ
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Sofia Johansen</div>
                  <div className="text-sm text-gray-600">Frisørsalong, Bergen</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid - Interactive */}
      <div id="features" className="py-24 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
              Alt du trenger.<br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Ingenting du ikke trenger.
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Kraftige funksjoner bygget for norske bedrifter. Enkelt nok for alle, kraftig nok for de kresne.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature cards with hover effects */}
            <div className="group bg-white rounded-3xl p-8 border-2 border-gray-100 hover:border-blue-200 transition-all hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <span className="text-3xl">📱</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Mobilvenlig
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                74% av bookinger skjer på mobil. Perfekt brukeropplevelse på alle enheter med moderne design.
              </p>
              <div className="text-sm font-semibold text-blue-600 flex items-center gap-2">
                Les mer
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            <div className="group bg-white rounded-3xl p-8 border-2 border-gray-100 hover:border-green-200 transition-all hover:shadow-2xl hover:shadow-green-500/10 hover:-translate-y-2">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <span className="text-3xl">💳</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Vipps + Stripe
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                78% av nordmenn bruker Vipps. Aksepter betalinger med Norges mest populære betalingsmetode + Stripe.
              </p>
              <div className="text-sm font-semibold text-green-600 flex items-center gap-2">
                Les mer
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            <div className="group bg-white rounded-3xl p-8 border-2 border-gray-100 hover:border-purple-200 transition-all hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <span className="text-3xl">⏰</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Smart påminnelser
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Reduser no-shows med 50% med automatiske e-post og SMS-påminnelser 24 timer før avtalen.
              </p>
              <div className="text-sm font-semibold text-purple-600 flex items-center gap-2">
                Les mer
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            <div className="group bg-white rounded-3xl p-8 border-2 border-gray-100 hover:border-orange-200 transition-all hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-2">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <span className="text-3xl">📅</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Kalendersynk
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Synkroniser automatisk med Google Calendar og Outlook. Ingen dobbeltbookinger, alltid oppdatert.
              </p>
              <div className="text-sm font-semibold text-orange-600 flex items-center gap-2">
                Les mer
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            <div className="group bg-white rounded-3xl p-8 border-2 border-gray-100 hover:border-indigo-200 transition-all hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Automatisering
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Automatiske bekreftelses-e-poster, påminnelser, fakturaer og oppfølginger. Sett det og glem det.
              </p>
              <div className="text-sm font-semibold text-indigo-600 flex items-center gap-2">
                Les mer
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            <div className="group bg-white rounded-3xl p-8 border-2 border-gray-100 hover:border-teal-200 transition-all hover:shadow-2xl hover:shadow-teal-500/10 hover:-translate-y-2">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-green-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <span className="text-3xl">📊</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Innsikt & analyse
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Se bookinger, inntekter, no-show rater og peak-timer. Alt du trenger for å drive smartere.
              </p>
              <div className="text-sm font-semibold text-teal-600 flex items-center gap-2">
                Les mer
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="py-24 px-6 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight">
              Transparent prising
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Ingen skjulte kostnader. Ingen langsiktige kontrakter. Kanseller når som helst.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free tier */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 text-white">
              <div className="text-sm font-bold text-blue-200 uppercase tracking-wider mb-2">Gratis</div>
              <div className="text-5xl font-black mb-2">0 kr</div>
              <div className="text-blue-200 mb-8">For alltid gratis</div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Opp til 50 bookinger/mnd</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>1 tjeneste</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>E-post påminnelser</span>
                </li>
              </ul>
              <Link
                href="/register"
                className="block w-full text-center px-6 py-4 bg-white text-indigo-600 font-bold rounded-xl hover:bg-blue-50 transition-all"
              >
                Kom i gang gratis
              </Link>
            </div>

            {/* Pro tier - HIGHLIGHTED */}
            <div className="bg-white rounded-3xl p-8 shadow-2xl transform scale-105 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                Mest populær
              </div>
              <div className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-2">Pro</div>
              <div className="text-5xl font-black text-gray-900 mb-2">499 kr</div>
              <div className="text-gray-600 mb-8">Per måned</div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">Ubegrensede bookinger</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">Ubegrensede tjenester</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Vipps + Stripe betaling</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>SMS påminnelser</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Kalendersynk</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Analyse & rapporter</span>
                </li>
              </ul>
              <Link
                href="/register"
                className="block w-full text-center px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
              >
                Start 14-dagers prøveperiode
              </Link>
            </div>

            {/* Enterprise tier */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-8 text-white">
              <div className="text-sm font-bold text-blue-200 uppercase tracking-wider mb-2">Enterprise</div>
              <div className="text-5xl font-black mb-2">Custom</div>
              <div className="text-blue-200 mb-8">For store bedrifter</div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">Alt i Pro</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Hvitemerking</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>API-tilgang</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Dedikert support</span>
                </li>
              </ul>
              <a
                href="mailto:sales@booking.no"
                className="block w-full text-center px-6 py-4 bg-white text-indigo-600 font-bold rounded-xl hover:bg-blue-50 transition-all"
              >
                Kontakt salg
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="py-32 px-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight">
            Klar til å automatisere bookinger?
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Bli med tusenvis av norske bedrifter som sparer tid, reduserer no-shows og øker inntektene.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/register"
              className="group w-full sm:w-auto px-12 py-6 text-lg font-black text-gray-900 bg-white hover:bg-gray-100 rounded-2xl transition-all shadow-2xl hover:shadow-white/20 hover:-translate-y-1 relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                Start gratis i dag
                <svg className="w-6 h-6 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            </Link>
          </div>
          <p className="text-sm text-gray-400 mt-8">
            ✓ Oppsett på 3 minutter  •  ✓ Ingen kredittkort  •  ✓ Kanseller når som helst
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-4">
                Booking.no
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Norges mest moderne bookingsystem. Bygget for norske bedrifter.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Produkt</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Funksjoner</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Priser</a></li>
                <li><a href="#showcase" className="hover:text-white transition-colors">Demo</a></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Kom i gang</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Bedrift</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Om oss</a></li>
                <li><a href="mailto:support@booking.no" className="hover:text-white transition-colors">Kontakt</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blogg</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Juridisk</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Personvern</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Vilkår</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GDPR</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <p>&copy; 2025 Booking.no. Alle rettigheter reservert.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
              <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-white transition-colors">Facebook</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }

        .animate-gradient-x {
          background-size: 200% auto;
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
