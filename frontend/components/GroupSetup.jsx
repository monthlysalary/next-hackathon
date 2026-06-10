'use client'

import { useState, useEffect } from 'react'
import PersonSetupWizard from './PersonSetupWizard'
import { EMPTY_PERSON, MEAL_OPTIONS, todayDateString, formatDisplayDate } from '@/lib/constants'
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
  loadingSessionId,
  isSignedIn = false,
  onSignIn,
  isPro = false,
  onUpgrade,
  maxPersons = FREE_MAX_PERSONS,
  groupSessionId = null,
  joinMode = false,
  isHost = true,
  joinSlotIndex = null,
  onCopyInvite,
  inviteCopied = false,
  onGuestPersonComplete,
}) {
  const [sessionsExpanded, setSessionsExpanded] = useState(false)
  const [activePersonIndex, setActivePersonIndex] = useState(
    joinMode && joinSlotIndex != null ? joinSlotIndex : 0,
  )
  const [personSteps, setPersonSteps] = useState(() => persons.map(() => 1))
  const [personCompleted, setPersonCompleted] = useState(() => persons.map(() => false))

  const updatePerson = (index, person) => {
    const next = [...persons]
    next[index] = person
    setPersons(next)
  }

  const setPersonStep = (index, step) => {
    setPersonSteps((prev) => {
      const next = [...prev]
      while (next.length <= index) next.push(1)
      next[index] = step
      return next
    })
  }

  const addPerson = () => {
    if (persons.length >= maxPersons) {
      if (!isPro) onUpgrade?.()
      return
    }
    setPersons([...persons, { ...EMPTY_PERSON }])
    setPersonSteps((prev) => [...prev, 1])
    setPersonCompleted((prev) => [...prev, false])
    setActivePersonIndex(persons.length)
  }

  const removePerson = (index) => {
    setPersons(persons.filter((_, i) => i !== index))
    setPersonSteps((prev) => prev.filter((_, i) => i !== index))
    setPersonCompleted((prev) => prev.filter((_, i) => i !== index))
    setActivePersonIndex((prev) => Math.max(0, Math.min(prev, persons.length - 2)))
  }

  const canFind =
    isHost &&
    persons.length >= 2 &&
    persons.every((p) => p.name.trim() && p.location.trim())

  useEffect(() => {
    if (joinMode && joinSlotIndex != null) {
      setActivePersonIndex(joinSlotIndex)
    }
  }, [joinMode, joinSlotIndex])

  const wizardIndex =
    joinMode && joinSlotIndex != null ? joinSlotIndex : activePersonIndex

  return (
    <div className="px-4 py-4 pb-8">
      {joinMode && (
        <div className="mb-4 px-3.5 py-3 bg-accent/10 border border-accent/30 rounded-[16px] text-[12px] text-text-primary">
          <p className="font-semibold">You&apos;re joining {groupName}</p>
          <p className="text-text-secondary mt-1">
            Add your preferences below. The host will run the search when everyone is ready.
          </p>
        </div>
      )}

      {isHost && groupSessionId && (
        <div className="mb-4 px-3.5 py-3 bg-white border border-border rounded-[16px] shadow-card">
          <p className="text-[13px] font-medium text-text-primary">Invite your group</p>
          <p className="text-[11px] text-text-secondary mt-1 mb-2">
            Share this link so others can add their preferences from any device.
          </p>
          <button
            type="button"
            onClick={onCopyInvite}
            className="w-full py-2.5 rounded-[12px] bg-accent hover:bg-accent-hover text-white text-xs font-semibold transition-colors"
          >
            {inviteCopied ? 'Link copied!' : 'Copy invite link'}
          </button>
        </div>
      )}

      {/* Top actions */}
      {!joinMode && (
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
      )}

      {/* Occasion */}
      <div className="mb-4">
        <label className="block text-[14px] font-medium text-text-primary mb-2">
          Occasion
        </label>
        <div className={`bg-surface-raised rounded-[14px] flex items-center px-3.5 h-[52px] ${joinMode ? 'opacity-80' : ''}`}>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Friday dinner"
            readOnly={joinMode}
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
          {MEAL_OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              disabled={joinMode}
              onClick={() => setMealType(m.toLowerCase())}
              className={`px-3 py-2.5 rounded-[14px] text-xs font-medium transition-colors ${
                mealType === m.toLowerCase()
                  ? 'bg-accent text-white'
                  : 'bg-surface-raised text-text-secondary border border-border'
              } ${joinMode ? 'opacity-80 cursor-default' : ''}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Date */}
      <div className="mb-5">
        <label className="block text-[14px] font-medium text-text-primary mb-2">
          When
        </label>
        <div className="bg-surface-raised rounded-[14px] flex items-center px-3.5 h-[52px] border border-border focus-within:border-accent transition-colors">
          <input
            type="date"
            value={day}
            min={todayDateString()}
            onChange={(e) => setDay(e.target.value)}
            readOnly={joinMode}
            className="w-full bg-transparent border-none outline-none text-[15px] text-text-primary [color-scheme:light]"
          />
        </div>
        {day && (
          <p className="text-[11px] text-text-secondary mt-1.5">
            {formatDisplayDate(day)}
          </p>
        )}
      </div>

      {!isPro && !joinMode && (
        <div className="mb-5 px-3.5 py-3 bg-orange-50 border border-orange-200 rounded-[14px] text-[11px] text-orange-800">
          <span className="font-semibold">Free plan:</span> up to {FREE_MAX_PERSONS} people · 1 search/day.
          {' '}
          <button type="button" onClick={onUpgrade} className="underline font-medium">
            Go Pro
          </button>
          {' '}for unlimited.
        </div>
      )}

      {isSignedIn && userSessions.length > 0 && !joinMode && (
        <div className="mb-5">
          <button
            type="button"
            onClick={() => setSessionsExpanded((open) => !open)}
            className="w-full flex items-center justify-between px-3.5 py-3 bg-white border border-border rounded-[16px] shadow-card hover:border-accent transition-colors"
          >
            <div className="text-left">
              <p className="text-[14px] font-medium text-text-primary">
                Your saved sessions
              </p>
              <p className="text-[11px] text-text-secondary mt-0.5">
                {userSessions.length} session{userSessions.length !== 1 ? 's' : ''} · tap to browse
              </p>
            </div>
            <span className="text-text-secondary text-sm ml-2 shrink-0">
              {sessionsExpanded ? '▲' : '▼'}
            </span>
          </button>

          {sessionsExpanded && (
            <div className="mt-2 space-y-2">
              {userSessions.map((session) => {
                const isLoading = loadingSessionId === session.session_id
                const meal = session.session_data?.meal_type
                const dateLabel = session.created_at
                  ? new Date(session.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })
                  : null

                return (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => onLoadUserSession?.(session.session_id)}
                    disabled={Boolean(loadingSessionId)}
                    className={`w-full text-left px-3.5 py-3 rounded-[16px] border transition-all ${
                      isLoading
                        ? 'bg-accent/5 border-accent ring-1 ring-accent/20'
                        : 'bg-surface-raised border-border hover:border-accent hover:shadow-card'
                    } disabled:opacity-60`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-text-primary truncate">
                          {session.group_name || 'Dining session'}
                        </p>
                        <p className="text-[11px] text-text-secondary mt-1">
                          📍 {session.suggested_area || 'Area TBD'}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {meal && (
                            <span className="px-2 py-0.5 rounded-full bg-white border border-border text-[10px] text-text-secondary capitalize">
                              {meal}
                            </span>
                          )}
                          {dateLabel && (
                            <span className="px-2 py-0.5 rounded-full bg-white border border-border text-[10px] text-text-secondary">
                              {dateLabel}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-accent shrink-0 pt-0.5">
                        {isLoading ? 'Loading…' : 'Open →'}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {!isSignedIn && onSignIn && !joinMode && (
        <button
          type="button"
          onClick={onSignIn}
          className="w-full mb-5 px-3 py-3 text-xs bg-surface border border-border rounded-[14px] text-text-secondary hover:border-accent hover:text-text-primary transition-colors"
        >
          Sign in to save sessions to your account
        </button>
      )}

      {/* People section — step-by-step wizard */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-semibold text-text-primary">
            Group ({persons.length}/{maxPersons})
          </h2>
        </div>

        {/* Person tabs */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          {persons.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (joinMode && joinSlotIndex != null && i !== joinSlotIndex) return
                setActivePersonIndex(i)
              }}
              className={`shrink-0 px-3 py-2 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
                wizardIndex === i
                  ? 'bg-accent text-white'
                  : personCompleted[i]
                    ? 'bg-success/10 text-success border border-success/30'
                    : 'bg-surface-raised text-text-secondary border border-border'
              } ${joinMode && joinSlotIndex != null && i !== joinSlotIndex ? 'opacity-50' : ''}`}
            >
              {personCompleted[i] && wizardIndex !== i && (
                <span className="text-[10px]">✓</span>
              )}
              {p.name.trim() || `Person ${i + 1}`}
            </button>
          ))}
        </div>

        {persons[wizardIndex] && (
          <PersonSetupWizard
            person={persons[wizardIndex]}
            index={wizardIndex}
            onChange={updatePerson}
            step={personSteps[wizardIndex] ?? 1}
            onStepChange={(s) => setPersonStep(wizardIndex, s)}
            onRemove={removePerson}
            canRemove={!joinMode && persons.length > 2}
            completed={personCompleted[wizardIndex]}
            onComplete={(finalPerson) => {
              updatePerson(wizardIndex, finalPerson)
              setPersonCompleted((prev) => {
                const next = [...prev]
                while (next.length <= wizardIndex) next.push(false)
                next[wizardIndex] = true
                return next
              })
              if (joinMode && onGuestPersonComplete) {
                onGuestPersonComplete(finalPerson, wizardIndex)
                return
              }
              if (wizardIndex < persons.length - 1) {
                setActivePersonIndex(wizardIndex + 1)
              }
            }}
            onModify={() => {
              setPersonCompleted((prev) => {
                const next = [...prev]
                next[wizardIndex] = false
                return next
              })
              setPersonStep(wizardIndex, 1)
            }}
          />
        )}

        {isHost && persons.length < maxPersons ? (
          <button
            type="button"
            onClick={addPerson}
            className="mt-3 w-full px-3 py-3 text-xs border border-dashed border-border rounded-[14px] text-text-secondary hover:text-accent hover:border-accent transition-colors"
          >
            + Add person
          </button>
        ) : isHost && !isPro ? (
          <button
            type="button"
            onClick={onUpgrade}
            className="mt-3 w-full px-3 py-3 text-xs border border-dashed border-accent rounded-[14px] text-accent hover:bg-orange-50 transition-colors"
          >
            🔒 Go Pro to add more than {FREE_MAX_PERSONS} people
          </button>
        ) : null}
      </div>

      {joinMode && personCompleted[joinSlotIndex] && (
        <p className="mb-3 text-xs text-text-secondary text-center">
          You&apos;re all set! Waiting for the host to find restaurants.
        </p>
      )}

      {isHost && canFind && (
        <p className="mb-3 text-xs text-text-secondary text-center">
          Ready to find restaurants
        </p>
      )}

      {isHost && (
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
          <>
            Find Matches
            <svg
              className="w-5 h-5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
                d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
              />
            </svg>
          </>
        )}
      </button>
      )}
    </div>
  )
}
