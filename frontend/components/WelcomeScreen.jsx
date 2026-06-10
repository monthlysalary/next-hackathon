'use client'

const HERO_IMAGE = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=500&fit=crop&q=80'

export default function WelcomeScreen({ onGetStarted, onDemo, hasSavedSession, onContinueSession, onClearHistory }) {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Hero with logo overlay */}
      <div className="relative h-[280px] overflow-hidden rounded-b-[28px]">
        <img
          src={HERO_IMAGE}
          alt="Restaurant"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Logo */}
        <div className="absolute top-5 left-5">
          <img
            src="/logo.jpg"
            alt="TableFor"
            className="h-10 w-auto rounded-lg shadow-lg"
          />
        </div>

        {/* Hero text */}
        <div className="absolute bottom-6 left-5 right-5">
          <h1 className="text-[24px] font-bold text-white leading-tight">
            Your Next Meal Is Just A Click Away
          </h1>
          <p className="text-[13px] text-white/80 mt-1">
            Find restaurants that work for your whole group.
          </p>
        </div>
      </div>

      {/* Feature icons - clean card style like v0 template */}
      <div className="px-5 pt-5 flex-1">
        <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-3">
          How it works
        </p>

        <div className="space-y-2.5 mb-5">
          <div className="flex items-center gap-3.5 bg-surface-raised rounded-[16px] px-4 py-3 border border-border">
            <div className="w-10 h-10 rounded-full bg-accent-light flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-medium text-text-primary">Add your group</p>
              <p className="text-[11px] text-text-secondary">Preferences, dietary needs & locations</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 bg-surface-raised rounded-[16px] px-4 py-3 border border-border">
            <div className="w-10 h-10 rounded-full bg-accent-light flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-medium text-text-primary">AI finds the best spot</p>
              <p className="text-[11px] text-text-secondary">Central meetup, MRT-accessible</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 bg-surface-raised rounded-[16px] px-4 py-3 border border-border">
            <div className="w-10 h-10 rounded-full bg-accent-light flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-medium text-text-primary">Vote & decide together</p>
              <p className="text-[11px] text-text-secondary">Share the link, everyone picks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-5 pb-5 space-y-2.5">
        <button
          type="button"
          onClick={onGetStarted}
          className="w-full py-3.5 rounded-full bg-accent hover:bg-accent-hover text-white font-semibold text-[15px] transition-colors shadow-card"
        >
          Get Started
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onDemo}
            className="flex-1 py-3 rounded-full border border-border text-[12px] font-medium text-text-primary hover:bg-surface-raised transition-colors"
          >
            Try Demo
          </button>
          {hasSavedSession && (
            <button
              type="button"
              onClick={onContinueSession}
              className="flex-1 py-3 rounded-full border border-border text-[12px] font-medium text-text-primary hover:bg-surface-raised transition-colors"
            >
              Continue Session
            </button>
          )}
        </div>
        {hasSavedSession && (
          <button
            type="button"
            onClick={onClearHistory}
            className="w-full py-2 text-[11px] text-text-secondary hover:text-red-500 transition-colors"
          >
            Clear previous sessions
          </button>
        )}
      </div>
    </div>
  )
}
