'use client'

import PersonCard from './PersonCard'
import { EMPTY_PERSON } from '@/lib/constants'
import { FREE_MAX_PERSONS } from '@/lib/planLimits'

export default function GroupSetup({
  groupName,
  setGroupName,
  mealType,
  setMealType,
  day,
  setDay,
  persons,
  setPersons,
  onFind,
  onDemo,
  loading,
  onContinueSession,
  hasSavedSession,
  userSessions = [],
  onLoadUserSession,
  onDeleteUserSession,
  loadingSessionId,
  isSignedIn = false,
  onSignIn,
  isPro = false,
  onUpgrade,
  maxPersons = FREE_MAX_PERSONS,
}) {
  const updatePerson = (index, person) => {
    const next = [...persons]
    next[index] = person
    setPersons(next)
  }

  const addPerson = () => {
    if (persons.length >= maxPersons) {
      if (!isPro) {
        onUpgrade?.()
      }
      return
    }
    setPersons([...persons, { ...EMPTY_PERSON }])
  }

  const removePerson = (index) => {
    setPersons(persons.filter((_, i) => i !== index))
  }

  const canFind =
    persons.length >= 2 &&
    persons.every((p) => p.name.trim() && p.location.trim())

  const mealOptions = ['Lunch', 'Dinner', 'Dessert', 'Supper', 'Any']
  const dayOptions = ['Today', 'Tomorrow', 'Weekend']

  return (
    <div className="px-4 py-4 pb-8">
      {/* Top actions */}
      <div className="flex items-center gap-2 mb-5">
        {hasSavedSession && (
          <button
            type="button"
            onClick={onContinueSession}
            disabled={Boolean(loadingSessionId)}
            className="flex-1 px-3 py-2 text-xs border border-border rounded-[14px] text-text-secondary hover:text-text-primary hover:border-accent transition-colors disabled:opacity-50"
          >
            Continue session
          </button>
        )}
        <button
          type="button"
          onClick={onDemo}
          className="flex-1 px-3 py-2 text-xs bg-surface-raised border border-border rounded-[14px] text-accent hover:bg-border transition-colors"
        >
          Try demo
        </button>
      </div>

      {!isPro && (
        <div className="mb-5 px-3.5 py-3 bg-orange-50 border border-orange-200 rounded-[14px] text-[11px] text-orange-800">
          <span className="font-semibold">Free plan:</span> up to {FREE_MAX_PERSONS} people · 1 search/day.
          {' '}
          <button type="button" onClick={onUpgrade} className="underline font-medium">
            Go Pro
          </button>
          {' '}for unlimited.
        </div>
      )}

      {isSignedIn && userSessions.length > 0 && (
        <div className="mb-5">
          <label className="block text-[14px] font-medium text-text-primary mb-2">
            Your saved sessions
          </label>
          <div className="space-y-2">
            {userSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={() => onLoadUserSession?.(session.session_id)}
                  disabled={loadingSessionId === session.session_id}
                  className="flex-1 text-left px-3.5 py-3 bg-surface-raised border border-border rounded-[14px] hover:border-accent transition-colors disabled:opacity-60"
                >
                  <p className="text-sm font-medium text-text-primary truncate">
                    {session.group_name || 'Dining session'}
                  </p>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    {session.suggested_area || 'Area TBD'}
                    {session.created_at
                      ? ` · ${new Date(session.created_at).toLocaleDateString()}`
                      : ''}
                    {loadingSessionId === session.session_id ? ' · Loading…' : ''}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteUserSession?.(session.session_id)}
                  className="p-2 rounded-full hover:bg-red-50 text-text-secondary hover:text-red-500 transition-colors"
                  title="Delete session"
                  aria-label={`Delete session ${session.group_name || 'Dining session'}`}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isSignedIn && onSignIn && (
        <button
          type="button"
          onClick={onSignIn}
          className="w-full mb-5 px-3 py-3 text-xs bg-surface border border-border rounded-[14px] text-text-secondary hover:border-accent hover:text-text-primary transition-colors"
        >
          Sign in to save sessions to your account
        </button>
      )}

      {/* Occasion */}
      <div className="mb-4">
        <label className="block text-[14px] font-medium text-text-primary mb-2">
          Occasion
        </label>
        <div className="bg-surface-raised rounded-[14px] flex items-center px-3.5 h-[52px]">
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Friday dinner"
            className="w-full bg-transparent border-none outline-none text-[15px] text-text-primary placeholder:text-text-secondary/60"
          />
        </div>
      </div>

      {/* Meal type */}
      <div className="mb-4">
        <label className="block text-[14px] font-medium text-text-primary mb-2">
          Meal
        </label>
        <div className="flex flex-wrap gap-2">
          {mealOptions.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMealType(m.toLowerCase())}
              className={`px-3 py-2.5 rounded-[14px] text-xs font-medium transition-colors ${
                mealType === m.toLowerCase()
                  ? 'bg-accent text-white'
                  : 'bg-surface-raised text-text-secondary border border-border'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Day */}
      <div className="mb-5">
        <label className="block text-[14px] font-medium text-text-primary mb-2">
          When
        </label>
        <div className="flex gap-2">
          {dayOptions.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDay(d.toLowerCase())}
              className={`flex-1 px-2 py-2.5 rounded-[14px] text-xs font-medium transition-colors ${
                day === d.toLowerCase()
                  ? 'bg-accent text-white'
                  : 'bg-surface-raised text-text-secondary border border-border'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* People section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-semibold text-text-primary">
            Group ({persons.length}/{maxPersons})
          </h2>
        </div>
        <div className="space-y-3">
          {persons.map((person, i) => (
            <PersonCard
              key={i}
              person={person}
              index={i}
              onChange={updatePerson}
              onRemove={removePerson}
              canRemove={persons.length > 2}
            />
          ))}
        </div>
        {persons.length < maxPersons ? (
          <button
            type="button"
            onClick={addPerson}
            className="mt-3 w-full px-3 py-3 text-xs border border-dashed border-border rounded-[14px] text-text-secondary hover:text-accent hover:border-accent transition-colors"
          >
            + Add person
          </button>
        ) : !isPro ? (
          <button
            type="button"
            onClick={onUpgrade}
            className="mt-3 w-full px-3 py-3 text-xs border border-dashed border-accent rounded-[14px] text-accent hover:bg-orange-50 transition-colors"
          >
            🔒 Go Pro to add more than {FREE_MAX_PERSONS} people
          </button>
        ) : null}
      </div>

      {/* Find button */}
      <button
        type="button"
        onClick={onFind}
        disabled={!canFind || loading}
        className="w-full py-4 rounded-[16px] bg-accent hover:bg-accent-hover text-white font-semibold text-[17px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Finding...
          </span>
        ) : (
          <>Find restaurants →</>
        )}
      </button>
    </div>
  )
}
