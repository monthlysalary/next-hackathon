'use client'

import TableForBrand from './TableForBrand'

function HomeCard({ title, description, onClick, accent = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-4 rounded-[20px] border transition-all shadow-card hover:shadow-md active:scale-[0.99] ${
        accent
          ? 'bg-accent border-accent text-white hover:bg-accent-hover'
          : 'bg-white border-border hover:border-accent'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className={`text-[15px] font-semibold ${accent ? 'text-white' : 'text-text-primary'}`}>
            {title}
          </p>
          <p
            className={`text-[12px] mt-1 leading-relaxed ${
              accent ? 'text-white/85' : 'text-text-secondary'
            }`}
          >
            {description}
          </p>
        </div>
        <span
          className={`text-2xl font-light leading-none shrink-0 ${
            accent ? 'text-white/90' : 'text-text-secondary'
          }`}
          aria-hidden="true"
        >
          →
        </span>
      </div>
    </button>
  )
}

export default function SessionHome({ onStartNewSession, onLoadPastSessions, onDemo }) {
  return (
    <div className="px-4 py-6 pb-10 md:px-6 lg:px-8 flex flex-col items-center">
      <div className="w-full max-w-md mb-8 text-center">
        <div className="flex justify-center mb-4">
          <TableForBrand
            size="lg"
            layout="stacked"
            showTagline
            titleClassName="text-xl font-bold text-accent"
          />
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">
          Find the perfect restaurant for your whole group — preferences, meetup spot, and all.
        </p>
      </div>

      <div className="w-full max-w-md space-y-3">
        <HomeCard
          title="Start new session"
          description="Set up a fresh group and invite friends to add their preferences."
          onClick={onStartNewSession}
          accent
        />
        <HomeCard
          title="Load past sessions"
          description="Pick up a saved group from your account or this device."
          onClick={onLoadPastSessions}
        />
        <HomeCard
          title="Try demo"
          description="See how it works with a sample group — no sign-in needed."
          onClick={onDemo}
        />
      </div>
    </div>
  )
}
