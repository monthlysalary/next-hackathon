'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  getGeolocationBlockedReason,
  geolocationErrorMessage,
  resolveAreaFromCoordinates,
  getApproximateCoordinatesViaIp,
  requestGpsCoordinates,
  GPS_OPTIONS,
} from '@/lib/geolocation'
import { API_URL, SINGAPORE_AREAS } from '@/lib/constants'

export default function LocationField({ value, onChange }) {
  const [allAreas, setAllAreas] = useState(SINGAPORE_AREAS)
  const [localValue, setLocalValue] = useState(value)
  const [suggestions, setSuggestions] = useState([])
  const [locationError, setLocationError] = useState(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsStatus, setGpsStatus] = useState(null)
  const debounceRef = useRef(null)

  // Sync from parent only when value changes externally (e.g. GPS, area select)
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    fetch(`${API_URL}/areas`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.areas?.length) setAllAreas(data.areas)
      })
      .catch(() => {})
  }, [])

  const filterAreas = useCallback(
    (q, limit = 8) => {
      const query = (q || '').trim().toLowerCase()
      if (!query) return allAreas.slice(0, limit)
      return allAreas.filter((a) => a.toLowerCase().includes(query)).slice(0, limit)
    },
    [allAreas],
  )

  const validateLocation = useCallback(
    async (input) => {
      try {
        const res = await fetch(
          `${API_URL}/validate-location/${encodeURIComponent(input)}`,
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
            const filtered = filterAreas(input)
            setSuggestions(filtered)
            setLocationError(filtered.length === 0 ? data.message : null)
          }
          return
        }
      } catch {
        /* fallback */
      }
      setSuggestions(filterAreas(input))
      setLocationError(null)
    },
    [filterAreas],
  )

  const handleInput = (next) => {
    setLocalValue(next)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setLocationError(null)
    if (next.length >= 1) {
      setSuggestions(filterAreas(next))
      if (next.length >= 2) {
        debounceRef.current = setTimeout(() => {
          onChange(next)
          validateLocation(next)
        }, 400)
      }
    } else {
      setSuggestions(filterAreas(''))
      onChange(next)
    }
  }

  const selectArea = (area) => {
    onChange(area)
    setSuggestions([])
    setLocationError(null)
  }

  const applyCoordinates = (latitude, longitude, approximate = false) => {
    setGpsStatus(approximate ? 'Using network location…' : 'Finding nearest area…')
    return resolveAreaFromCoordinates(latitude, longitude)
      .then((result) => {
        onChange(result.area)
        const alts = [result.area, ...(result.alternatives || [])].filter(
          (name, i, arr) => arr.indexOf(name) === i,
        )
        if (approximate || alts.length > 1 || result.message) {
          setSuggestions(alts)
          setLocationError(
            result.message ||
              (approximate
                ? 'Network location is approximate — pick the closest area if this looks wrong.'
                : 'Pick the closest area if this looks wrong.'),
          )
        } else {
          setSuggestions([])
          setLocationError(null)
        }
      })
      .finally(() => setGpsStatus(null))
  }

  const runNetworkLocation = () => {
    setGpsLoading(true)
    setLocationError(null)
    setGpsStatus('Looking up network location…')
    getApproximateCoordinatesViaIp()
      .then(({ latitude, longitude }) => applyCoordinates(latitude, longitude, true))
      .catch((err) => {
        setLocationError(err.message || 'Network location failed.')
        setGpsStatus(null)
      })
      .finally(() => setGpsLoading(false))
  }

  const handleGps = () => {
    const blocked = getGeolocationBlockedReason()
    if (blocked || !navigator.geolocation || !window.isSecureContext) {
      if (blocked && !blocked.includes('network')) setLocationError(blocked)
      runNetworkLocation()
      return
    }

    setGpsLoading(true)
    setLocationError(null)
    setGpsStatus('Allow location when your browser prompts…')

    requestGpsCoordinates(
      (pos) => {
        applyCoordinates(pos.coords.latitude, pos.coords.longitude, false)
          .catch((err) => setLocationError(geolocationErrorMessage(err)))
          .finally(() => setGpsLoading(false))
      },
      (err) => {
        setGpsStatus('GPS unavailable, trying network location…')
        getApproximateCoordinatesViaIp()
          .then(({ latitude, longitude }) =>
            applyCoordinates(latitude, longitude, true),
          )
          .catch(() => setLocationError(geolocationErrorMessage(err)))
          .finally(() => setGpsLoading(false))
      },
      GPS_OPTIONS,
    )
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="flex-1 bg-surface-raised rounded-[14px] flex items-center px-3.5 h-[52px] border border-border focus-within:border-accent transition-colors">
          <input
            type="text"
            value={localValue}
            onChange={(e) => handleInput(e.target.value)}
            onBlur={() => onChange(localValue)}
            onFocus={() => setSuggestions(filterAreas(localValue))}
            placeholder="MRT station or area"
            className="w-full bg-transparent border-none outline-none text-[15px] text-text-primary placeholder:text-text-secondary/50"
          />
        </div>
        <button
          type="button"
          onClick={handleGps}
          disabled={gpsLoading}
          title="Use my current location"
          aria-label="Use my current location"
          className="px-3 h-[52px] bg-surface-raised rounded-[14px] border border-border text-text-secondary hover:text-accent text-sm disabled:opacity-50"
        >
          {gpsLoading ? '…' : '📍'}
        </button>
      </div>

      {suggestions.length > 0 && (
        <ul className="absolute z-20 w-full mt-1 bg-white border border-border rounded-[14px] shadow-card overflow-hidden max-h-[160px] overflow-y-auto">
          {suggestions.map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => selectArea(s)}
                className="w-full text-left px-3.5 py-2.5 text-sm text-text-primary hover:bg-surface-raised"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}

      {gpsStatus && (
        <p className="mt-1.5 text-[11px] text-accent">{gpsStatus}</p>
      )}
      {locationError && (
        <p className="mt-1.5 text-[11px] text-amber-600">{locationError}</p>
      )}
    </div>
  )
}
