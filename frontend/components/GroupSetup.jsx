'use client'

import PersonCard from './PersonCard'
import { EMPTY_PERSON } from '@/lib/constants'

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
}) {
  const updatePerson = (index, person) => {
    const next = [...persons]
    next[index] = person
    setPersons(next)
  }

  const addPerson = () => {
    if (persons.length < 6) {
      setPersons([...persons, { ...EMPTY_PERSON }])
    }
  }

  const removePerson = (index) => {
    setPersons(persons.filter((_, i) => i !== index))
  }

  const canFind =
    persons.length >= 2 &&
    persons.every((p) => p.name.trim() && p.location.trim())

  const mealOptions = ['Lunch', 'Dinner', 'Supper', 'Any']
  const dayOptions = ['Today', 'Tomorrow', 'Weekend']

  return (
    <div className="px-4 py-4 pb-8">
      {/* Top actions */}
      <div className="flex items-center gap-2 mb-5">
        {hasSavedSession && (
          <button
            type="button"
            onClick={onContinueSession}
            className="flex-1 px-3 py-2 text-xs border border-border rounded-xl text-text-secondary hover:text-text-primary hover:border-accent transition-colors"
          >
            Continue session
          </button>
        )}
        <button
          type="button"
          onClick={onDemo}
          className="flex-1 px-3 py-2 text-xs bg-surface-raised border border-border rounded-xl text-accent hover:bg-border transition-colors"
        >
          Try demo
        </button>
      </div>

      {/* Occasion */}
      <div className="mb-4">
        <label className="block text-[11px] uppercase tracking-wider text-text-secondary mb-1.5 font-medium">
          Occasion
        </label>
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Friday dinner"
          className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      {/* Meal type */}
      <div className="mb-4">
        <label className="block text-[11px] uppercase tracking-wider text-text-secondary mb-1.5 font-medium">
          Meal
        </label>
        <div className="flex gap-1.5">
          {mealOptions.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMealType(m.toLowerCase())}
              className={`flex-1 px-2 py-2 rounded-xl text-xs font-medium transition-colors ${
                mealType === m.toLowerCase()
                  ? 'bg-accent text-white'
                  : 'bg-surface border border-border text-text-secondary'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Day */}
      <div className="mb-5">
        <label className="block text-[11px] uppercase tracking-wider text-text-secondary mb-1.5 font-medium">
          When
        </label>
        <div className="flex gap-1.5">
          {dayOptions.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDay(d.toLowerCase())}
              className={`flex-1 px-2 py-2 rounded-xl text-xs font-medium transition-colors ${
                day === d.toLowerCase()
                  ? 'bg-accent text-white'
                  : 'bg-surface border border-border text-text-secondary'
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
          <h2 className="text-sm font-semibold text-text-primary">
            Group ({persons.length}/6)
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
        {persons.length < 6 && (
          <button
            type="button"
            onClick={addPerson}
            className="mt-3 w-full px-3 py-2.5 text-xs border border-dashed border-border rounded-xl text-text-secondary hover:text-accent hover:border-accent transition-colors"
          >
            + Add person
          </button>
        )}
      </div>

      {/* Find button */}
      <button
        type="button"
        onClick={onFind}
        disabled={!canFind || loading}
        className="w-full py-3.5 rounded-2xl bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-accent/20"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Finding...
          </span>
        ) : (
          'Find restaurants'
        )}
      </button>
    </div>
  )
}
