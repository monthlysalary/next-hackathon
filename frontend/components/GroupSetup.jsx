'use client'

import { useState, useEffect } from 'react'
import PersonCard from './PersonCard'
import { EMPTY_PERSON } from '@/lib/constants'
import { FREE_MAX_PERSONS } from '@/lib/planLimits'

const FRIENDS_KEY = 'tablefor_saved_friends'

function getSavedFriends() {
  try {
    const data = localStorage.getItem(FRIENDS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveFriend(person) {
  if (!person.name.trim()) return
  const friends = getSavedFriends()
  // Update existing or add new
  const idx = friends.findIndex(
    (f) => f.name.toLowerCase() === person.name.toLowerCase(),
  )
  const entry = {
    name: person.name,
    location: person.location,
    budget: person.budget,
    dietary: person.dietary,
    cuisine_loves: person.cuisine_loves,
    must_have: person.must_have,
    avoid: person.avoid || [],
  }
  if (idx >= 0) {
    friends[idx] = entry
  } else {
    friends.push(entry)
  }
  localStorage.setItem(FRIENDS_KEY, JSON.stringify(friends))
}

function removeSavedFriend(name) {
  const friends = getSavedFriends()
  const filtered = friends.filter(
    (f) => f.name.toLowerCase() !== name.toLowerCase(),
  )
  localStorage.setItem(FRIENDS_KEY, JSON.stringify(filtered))
}

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
  onDeleteSession,
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

  const [savedFriends, setSavedFriends] = useState([])
  const [showFriendPicker, setShowFriendPicker] = useState(false)

  useEffect(() => {
    setSavedFriends(getSavedFriends())
  }, [])

  // Save all named persons as friends whenever a search is triggered
  const handleFind = () => {
    persons.forEach((p) => {
      if (p.name.trim()) saveFriend(p)
    })
    setSavedFriends(getSavedFriends())
    onFind()
  }

  const addFriend = (friend) => {
    if (persons.length >= maxPersons) return
    setPersons([...persons, { ...friend }])
    setShowFriendPicker(false)
  }

  const deleteFriend = (name) => {
    removeSavedFriend(name)
    setSavedFriends(getSavedFriends())
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
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteSession?.(session.session_id)
                  }}
                  className="px-2 py-2 text-text-secondary hover:text-red-500 text-xs transition-colors"
                  title="Delete session"
                >
                  ✕
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
              onSaveFriend={(p) => {
                saveFriend(p)
                setSavedFriends(getSavedFriends())
              }}
            />
          ))}
        </div>
        {persons.length < maxPersons ? (
          <div className="mt-3 relative">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={addPerson}
                className="flex-1 px-3 py-3 text-xs border border-dashed border-border rounded-[14px] text-text-secondary hover:text-accent hover:border-accent transition-colors"
              >
                + Add person
              </button>
              {savedFriends.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowFriendPicker(!showFriendPicker)}
                  className={`px-3 py-3 text-xs border rounded-[14px] transition-colors ${
                    showFriendPicker
                      ? 'border-accent text-accent bg-orange-50'
                      : 'border-border text-text-secondary hover:text-accent hover:border-accent'
                  }`}
                >
                  👥 Friends
                </button>
              )}
            </div>
            {showFriendPicker && savedFriends.length > 0 && (
              <div className="mt-2 bg-white border border-border rounded-[14px] shadow-card overflow-hidden">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">
                    Add a saved friend
                  </p>
                </div>
                <div className="max-h-[200px] overflow-y-auto">
                  {savedFriends
                    .filter(
                      (f) =>
                        !persons.some(
                          (p) => p.name.toLowerCase() === f.name.toLowerCase(),
                        ),
                    )
                    .map((friend) => (
                      <div
                        key={friend.name}
                        className="flex items-center justify-between px-3 py-2.5 hover:bg-surface-raised transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => addFriend(friend)}
                          className="flex-1 text-left"
                        >
                          <p className="text-xs font-medium text-text-primary">
                            {friend.name}
                          </p>
                          <p className="text-[10px] text-text-secondary">
                            {friend.location || 'No location'} · {friend.budget}
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteFriend(friend.name)}
                          className="text-[10px] text-text-secondary hover:text-red-500 px-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  {savedFriends.filter(
                    (f) =>
                      !persons.some(
                        (p) => p.name.toLowerCase() === f.name.toLowerCase(),
                      ),
                  ).length === 0 && (
                    <p className="px-3 py-2.5 text-[11px] text-text-secondary">
                      All saved friends are already in the group
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
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
        onClick={handleFind}
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
