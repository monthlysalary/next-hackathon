'use client'

import { useState, useRef, useCallback } from 'react'
import {
  API_URL,
  SINGAPORE_AREAS,
  BUDGET_OPTIONS,
  DIETARY_OPTIONS,
  CUISINE_OPTIONS,
  MUST_HAVE_OPTIONS,
  AVOID_OPTIONS,
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
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = selected.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
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

export default function PersonCard({ person, index, onChange, onRemove, canRemove, onSaveFriend }) {
  const [suggestions, setSuggestions] = useState([])
  const [locationError, setLocationError] = useState(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [expanded, setExpanded] = useState(index < 2)
  const [saved, setSaved] = useState(false)
  const debounceRef = useRef(null)

  const update = (field, value) => {
    onChange(index, { ...person, [field]: value })
  }

  const validateLocation = useCallback(async (value) => {
    try {
      const res = await fetch(
        `${API_URL}/validate-location/${encodeURIComponent(value)}`,
      )
      if (res.ok) {
        const data = await res.json()
        if (data.valid) {
          setSuggestions([data.area])
          setLocationError(null)
        } else if (data.suggestions.length > 0) {
          setSuggestions(data.suggestions)
          setLocationError(data.message)
        } else {
          const filtered = SINGAPORE_AREAS.filter((a) =>
            a.toLowerCase().includes(value.toLowerCase()),
          )
          setSuggestions(filtered.slice(0, 4))
          setLocationError(filtered.length === 0 ? data.message : null)
        }
        return
      }
    } catch {
      // Backend unavailable — fall back to local filter
    }
    const filtered = SINGAPORE_AREAS.filter((a) =>
      a.toLowerCase().includes(value.toLowerCase()),
    )
    setSuggestions(filtered.slice(0, 4))
    setLocationError(null)
  }, [])

  const handleLocationInput = (value) => {
    update('location', value)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (value.length >= 2) {
      // Local filter immediately for snappy UX
      const filtered = SINGAPORE_AREAS.filter((a) =>
        a.toLowerCase().includes(value.toLowerCase()),
      )
      setSuggestions(filtered.slice(0, 4))
      setLocationError(null)

      // Debounced backend call for fuzzy matching
      debounceRef.current = setTimeout(() => {
        validateLocation(value)
      }, 300)
    } else {
      setSuggestions([])
    }
  }

  const selectArea = (area) => {
    update('location', area)
    setSuggestions([])
    setLocationError(null)
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
        } catch { /* ignore */ } finally {
          setGpsLoading(false)
        }
      },
      () => setGpsLoading(false),
    )
  }

  const accentColors = [
    'border-l-[#F28155]',
    'border-l-[#3B3BD4]',
    'border-l-[#34A853]',
    'border-l-[#FFD166]',
    'border-l-purple-500',
    'border-l-teal-500',
  ]
  const accent = accentColors[index % accentColors.length]

  return (
    <div className={`bg-white border border-border rounded-[20px] p-3.5 border-l-4 ${accent} shadow-card`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-left flex-1"
        >
          <span className="w-6 h-6 rounded-full bg-surface-raised flex items-center justify-center text-[10px] font-bold text-text-secondary">
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
              className="text-text-secondary hover:text-red-500 text-[10px] px-1"
            >
              ✕
            </button>
          )}
          <span className="text-text-secondary text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expandable content */}
      {expanded && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-text-secondary mb-1">Name</label>
              <div className="bg-surface-raised rounded-[12px] flex items-center px-3 h-[40px]">
                <input
                  type="text"
                  value={person.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="Name"
                  className="w-full bg-transparent border-none outline-none text-xs text-text-primary placeholder:text-text-secondary/50"
                />
              </div>
            </div>
            <div className="relative">
              <label className="block text-[11px] text-text-secondary mb-1">Location</label>
              <div className="flex gap-1">
                <div className="flex-1 bg-surface-raised rounded-[12px] flex items-center px-3 h-[40px]">
                  <input
                    type="text"
                    value={person.location}
                    onChange={(e) => handleLocationInput(e.target.value)}
                    placeholder="Area"
                    className="w-full bg-transparent border-none outline-none text-xs text-text-primary placeholder:text-text-secondary/50"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleGps}
                  disabled={gpsLoading}
                  className="px-2.5 h-[40px] bg-surface-raised rounded-[12px] text-text-secondary hover:text-accent text-xs"
                >
                  {gpsLoading ? '…' : '📍'}
                </button>
              </div>
              {suggestions.length > 0 && (
                <ul className="absolute z-20 w-full mt-1 bg-white border border-border rounded-[12px] shadow-card overflow-hidden">
                  {suggestions.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        onClick={() => selectArea(s)}
                        className="w-full text-left px-3 py-2 text-xs text-text-primary hover:bg-surface-raised"
                      >
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {locationError && suggestions.length === 0 && (
                <p className="mt-1 text-[10px] text-amber-600">{locationError}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-text-secondary mb-1">Budget</label>
            <PillGroup
              options={BUDGET_OPTIONS}
              selected={[person.budget]}
              onChange={(v) => update('budget', v[0])}
              multi={false}
            />
          </div>

          <div>
            <label className="block text-[11px] text-text-secondary mb-1">Dietary</label>
            <PillGroup
              options={DIETARY_OPTIONS}
              selected={person.dietary}
              onChange={(v) => update('dietary', v)}
            />
          </div>

          <div>
            <label className="block text-[11px] text-text-secondary mb-1">Cuisine</label>
            <PillGroup
              options={CUISINE_OPTIONS}
              selected={person.cuisine_loves}
              onChange={(v) => update('cuisine_loves', v)}
            />
          </div>

          <div>
            <label className="block text-[11px] text-text-secondary mb-1">Must-have</label>
            <PillGroup
              options={MUST_HAVE_OPTIONS}
              selected={person.must_have}
              onChange={(v) => update('must_have', v)}
            />
          </div>

          <div>
            <label className="block text-[11px] text-text-secondary mb-1">Avoid</label>
            <PillGroup
              options={AVOID_OPTIONS}
              selected={person.avoid || []}
              onChange={(v) => update('avoid', v)}
            />
          </div>

          {person.name.trim() && (
            <button
              type="button"
              onClick={() => {
                onSaveFriend?.(person)
                setSaved(true)
                setTimeout(() => setSaved(false), 2000)
              }}
              className={`w-full px-3 py-2 text-[11px] font-medium rounded-[12px] transition-colors ${
                saved
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-surface-raised text-text-secondary border border-border hover:border-accent hover:text-accent'
              }`}
            >
              {saved ? '✓ Remembered!' : 'Remember this friend'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
