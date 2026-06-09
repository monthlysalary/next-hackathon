'use client'

import { useState, useEffect } from 'react'
import GroupSetup from './GroupSetup'
import ResultsPanel from './ResultsPanel'
import {
  API_URL,
  EMPTY_PERSON,
  DEMO_PERSONS,
  DEMO_RESULT,
} from '@/lib/constants'

const SESSION_KEY = 'tablefor_session_id'

const DIETARY_MAP = {
  Halal: 'halal',
  Veg: 'vegetarian',
  Vegan: 'vegan',
  'No Pork': 'no pork',
  'No Beef': 'no beef',
  'No Shellfish': 'no shellfish',
  'No Nuts': 'no nuts',
  'No Dairy': 'no dairy',
  None: 'none',
}

const MUST_HAVE_MAP = {
  Aircon: 'aircon',
  'Big tables': 'big tables',
  Quiet: 'quiet',
  'Halal-cert': 'halal-certified',
  Parking: 'parking',
}

export default function AppContent() {
  const [view, setView] = useState('setup')
  const [groupName, setGroupName] = useState('Our Group')
  const [mealType, setMealType] = useState('dinner')
  const [day, setDay] = useState('today')
  const [persons, setPersons] = useState([
    { ...EMPTY_PERSON },
    { ...EMPTY_PERSON },
  ])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [savedRestaurants, setSavedRestaurants] = useState([])
  const [isPro, setIsPro] = useState(false)
  const [hasSavedSession, setHasSavedSession] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('upgraded') === 'true') {
      setIsPro(true)
      localStorage.setItem('tablefor_pro', 'true')
    } else if (localStorage.getItem('tablefor_pro') === 'true') {
      setIsPro(true)
    }

    const sessionId =
      params.get('session') || localStorage.getItem(SESSION_KEY)
    if (sessionId) {
      setHasSavedSession(true)
      if (params.get('session')) {
        loadSession(sessionId)
      }
    }
  }, [])

  const loadSession = async (sessionId) => {
    try {
      const res = await fetch(`${API_URL}/session/${sessionId}`)
      if (!res.ok) return
      const data = await res.json()
      setResult({
        session_id: data.session_id,
        suggested_area: data.suggested_area,
        area_reason: data.area_reason,
        travel_summary: data.travel_summary,
        restaurants: data.restaurants,
      })
      if (data.persons) setPersons(data.persons)
      if (data.group_name) setGroupName(data.group_name)
      if (data.meal_type) setMealType(data.meal_type)
      if (data.day) setDay(data.day)
      setSavedRestaurants(
        (data.saved_restaurants || []).map((r) => r.name || r),
      )
      localStorage.setItem(SESSION_KEY, sessionId)
      setView('results')
    } catch {
      /* ignore */
    }
  }

  const handleContinueSession = () => {
    const sessionId = localStorage.getItem(SESSION_KEY)
    if (sessionId) loadSession(sessionId)
  }

  const handleFind = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/find`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_name: groupName,
          persons: persons.map((p) => ({
            ...p,
            dietary: p.dietary.map((d) => DIETARY_MAP[d] || d.toLowerCase()),
            cuisine_loves: p.cuisine_loves,
            must_have: p.must_have.map((m) => MUST_HAVE_MAP[m] || m.toLowerCase()),
            avoid: (p.avoid || []).map((a) => a.toLowerCase()),
          })),
          meal_type: mealType,
          day: day,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to find restaurants')
      }
      const data = await res.json()
      setResult(data)
      localStorage.setItem(SESSION_KEY, data.session_id)
      setHasSavedSession(true)
      setSavedRestaurants([])
      setView('results')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDemo = () => {
    setPersons(DEMO_PERSONS.map((p) => ({ ...p })))
    setGroupName('Demo Group')
    setMealType('dinner')
    setDay('today')
    setResult(DEMO_RESULT)
    setSavedRestaurants([])
    setView('results')
  }

  const handleStartOver = () => {
    setView('setup')
    setResult(null)
    setError(null)
  }

  const handleUpgrade = async () => {
    try {
      const res = await fetch(`${API_URL}/create-checkout`, { method: 'POST' })
      if (!res.ok) return
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      /* ignore */
    }
  }

  const handleRestaurantSaved = (name) => {
    setSavedRestaurants((prev) => [...prev, name])
  }

  return (
    <div className="min-h-full bg-bg">
      {/* App header inside the phone */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-border px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-accent">TableFor</span>
            {isPro && (
              <span className="px-1.5 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-bold">
                PRO
              </span>
            )}
          </div>
          {!isPro && (
            <button
              type="button"
              onClick={handleUpgrade}
              className="px-2.5 py-1 text-[10px] font-medium bg-accent hover:bg-accent-hover text-white rounded-full transition-colors"
            >
              Go Pro
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="px-4 pt-3">
          <div className="bg-red-900/30 border border-red-700 rounded-lg px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        </div>
      )}

      {view === 'setup' ? (
        <GroupSetup
          groupName={groupName}
          setGroupName={setGroupName}
          mealType={mealType}
          setMealType={setMealType}
          day={day}
          setDay={setDay}
          persons={persons}
          setPersons={setPersons}
          onFind={handleFind}
          onDemo={handleDemo}
          loading={loading}
          onContinueSession={handleContinueSession}
          hasSavedSession={hasSavedSession}
        />
      ) : (
        <ResultsPanel
          result={result}
          persons={persons}
          onStartOver={handleStartOver}
          savedRestaurants={savedRestaurants}
          onRestaurantSaved={handleRestaurantSaved}
        />
      )}
    </div>
  )
}
