import { useState } from 'react'
import {
  API_URL,
  SINGAPORE_AREAS,
  BUDGET_OPTIONS,
  DIETARY_OPTIONS,
  CUISINE_OPTIONS,
  MUST_HAVE_OPTIONS,
  CARD_ACCENTS,
} from '../constants'

function PillGroup({ options, selected, onChange, multi = true }) {
  const toggle = (opt) => {
    if (multi) {
      const next = selected.includes(opt)
        ? selected.filter((s) => s !== opt)
        : [...selected, opt]
      onChange(next)
    } else {
      onChange([opt])
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = selected.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              active
                ? 'bg-accent text-white'
                : 'bg-surface-raised text-text-secondary hover:text-text-primary border border-border'
            }`}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

export default function PersonCard({ person, index, onChange, onRemove, canRemove }) {
  const [suggestions, setSuggestions] = useState([])
  const [gpsLoading, setGpsLoading] = useState(false)

  const update = (field, value) => {
    onChange(index, { ...person, [field]: value })
  }

  const handleLocationInput = (value) => {
    update('location', value)
    if (value.length > 0) {
      const filtered = SINGAPORE_AREAS.filter((a) =>
        a.toLowerCase().includes(value.toLowerCase()),
      )
      setSuggestions(filtered.slice(0, 5))
    } else {
      setSuggestions([])
    }
  }

  const selectArea = (area) => {
    update('location', area)
    setSuggestions([])
  }

  const handleGps = () => {
    if (!navigator.geolocation) return
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`${API_URL}/gps-area`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            }),
          })
          const data = await res.json()
          update('location', data.area)
        } catch {
          /* ignore */
        } finally {
          setGpsLoading(false)
        }
      },
      () => setGpsLoading(false),
    )
  }

  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length]

  return (
    <div
      className={`bg-surface border border-border rounded-xl p-4 border-l-4 ${accent}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-text-secondary">
          Person {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-text-secondary hover:text-red-400 text-xs"
          >
            Remove
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-text-secondary mb-1">Name</label>
          <input
            type="text"
            value={person.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Your name"
            className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent"
          />
        </div>

        <div className="relative">
          <label className="block text-xs text-text-secondary mb-1">Location</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={person.location}
              onChange={(e) => handleLocationInput(e.target.value)}
              placeholder="e.g. Tampines"
              className="flex-1 bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={handleGps}
              disabled={gpsLoading}
              title="Use my location"
              className="px-3 py-2 bg-surface-raised border border-border rounded-lg text-text-secondary hover:text-accent hover:border-accent transition-colors text-sm"
            >
              {gpsLoading ? '...' : '📍'}
            </button>
          </div>
          {suggestions.length > 0 && (
            <ul className="absolute z-10 w-full mt-1 bg-surface-raised border border-border rounded-lg shadow-lg overflow-hidden">
              {suggestions.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => selectArea(s)}
                    className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-border"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className="block text-xs text-text-secondary mb-1">Budget</label>
          <PillGroup
            options={BUDGET_OPTIONS}
            selected={[person.budget]}
            onChange={(v) => update('budget', v[0])}
            multi={false}
          />
        </div>

        <div>
          <label className="block text-xs text-text-secondary mb-1">Dietary</label>
          <PillGroup
            options={DIETARY_OPTIONS}
            selected={person.dietary}
            onChange={(v) => update('dietary', v)}
          />
        </div>

        <div>
          <label className="block text-xs text-text-secondary mb-1">Cuisine loves</label>
          <PillGroup
            options={CUISINE_OPTIONS}
            selected={person.cuisine_loves}
            onChange={(v) => update('cuisine_loves', v)}
          />
        </div>

        <div>
          <label className="block text-xs text-text-secondary mb-1">Must-have</label>
          <PillGroup
            options={MUST_HAVE_OPTIONS}
            selected={person.must_have}
            onChange={(v) => update('must_have', v)}
          />
        </div>
      </div>
    </div>
  )
}
