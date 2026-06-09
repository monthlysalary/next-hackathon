'use client'

import { useState } from 'react'
import {
  API_URL,
  SINGAPORE_AREAS,
  BUDGET_OPTIONS,
  DIETARY_OPTIONS,
  CUISINE_OPTIONS,
  MUST_HAVE_OPTIONS,
  CARD_ACCENTS,
} from '@/lib/constants'

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
    <div className="flex flex-wrap gap-1">
      {options.map((opt) => {
        const active = selected.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
              active
                ? 'bg-accent text-white'
                : 'bg-surface-raised text-text-secondary border border-border'
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
  const [expanded, setExpanded] = useState(index < 2)

  const update = (field, value) => {
    onChange(index, { ...person, [field]: value })
  }

  const handleLocationInput = (value) => {
    update('location', value)
    if (value.length > 0) {
      const filtered = SINGAPORE_AREAS.filter((a) =>
        a.toLowerCase().includes(value.toLowerCase()),
      )
      setSuggestions(filtered.slice(0, 4))
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
    <div className={`bg-surface border border-border rounded-2xl p-3 border-l-4 ${accent}`}>
      {/* Header - always visible */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-left flex-1"
        >
          <span className="w-6 h-6 rounded-full bg-surface-raised border border-border flex items-center justify-center text-[10px] font-bold text-text-secondary">
            {index + 1}
          </span>
          <span className="text-xs font-medium text-text-primary truncate">
            {person.name || `Person ${index + 1}`}
          </span>
          {person.location && (
            <span className="text-[10px] text-text-secondary">· {person.location}</span>
          )}
        </button>
        <div className="flex items-center gap-1">
          {canRemove && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="text-text-secondary hover:text-red-400 text-[10px] px-1"
            >
              ✕
            </button>
          )}
          <span className="text-text-secondary text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expandable content */}
      {expanded && (
        <div className="mt-3 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-text-secondary mb-0.5">Name</label>
              <input
                type="text"
                value={person.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Name"
                className="w-full bg-surface-raised border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent"
              />
            </div>
            <div className="relative">
              <label className="block text-[10px] text-text-secondary mb-0.5">Location</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={person.location}
                  onChange={(e) => handleLocationInput(e.target.value)}
                  placeholder="Area"
                  className="flex-1 bg-surface-raised border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={handleGps}
                  disabled={gpsLoading}
                  className="px-2 py-1.5 bg-surface-raised border border-border rounded-lg text-text-secondary hover:text-accent text-xs"
                >
                  {gpsLoading ? '…' : '📍'}
                </button>
              </div>
              {suggestions.length > 0 && (
                <ul className="absolute z-20 w-full mt-0.5 bg-surface-raised border border-border rounded-lg shadow-lg overflow-hidden">
                  {suggestions.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        onClick={() => selectArea(s)}
                        className="w-full text-left px-2.5 py-1.5 text-xs text-text-primary hover:bg-border"
                      >
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-text-secondary mb-0.5">Budget</label>
            <PillGroup
              options={BUDGET_OPTIONS}
              selected={[person.budget]}
              onChange={(v) => update('budget', v[0])}
              multi={false}
            />
          </div>

          <div>
            <label className="block text-[10px] text-text-secondary mb-0.5">Dietary</label>
            <PillGroup
              options={DIETARY_OPTIONS}
              selected={person.dietary}
              onChange={(v) => update('dietary', v)}
            />
          </div>

          <div>
            <label className="block text-[10px] text-text-secondary mb-0.5">Cuisine</label>
            <PillGroup
              options={CUISINE_OPTIONS}
              selected={person.cuisine_loves}
              onChange={(v) => update('cuisine_loves', v)}
            />
          </div>

          <div>
            <label className="block text-[10px] text-text-secondary mb-0.5">Must-have</label>
            <PillGroup
              options={MUST_HAVE_OPTIONS}
              selected={person.must_have}
              onChange={(v) => update('must_have', v)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
