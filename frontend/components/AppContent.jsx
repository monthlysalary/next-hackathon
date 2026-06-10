'use client'

import { useState, useEffect } from 'react'
import GroupSetup from './GroupSetup'
import ResultsPanel from './ResultsPanel'
import AuthModal from './AuthModal'
import { useAuth } from './AuthProvider'
import {
  API_URL,
  EMPTY_PERSON,
  DEMO_PERSONS,
  DEMO_RESULT,
} from '@/lib/constants'
import { fetchUserSessions, saveUserSession, fetchUserSessionData, countUserSessionsToday, setUserPro, deleteUserSession } from '@/lib/userDb'
import {
  FREE_MAX_PERSONS,
  PRO_MAX_PERSONS,
  FREE_DAILY_SESSIONS,
  getAnonymousDailySearchCount,
  incrementAnonymousDailySearchCount,
} from '@/lib/planLimits'

const SESSION_KEY = 'tablefor_session_id'
const VOTER_KEY = 'tablefor_voter_name'
const PRO_KEY = 'tablefor_pro'
const SUBSCRIPTION_KEY = 'tablefor_subscription_id'

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
  const { user, profile, signOut, configured: authConfigured, refreshProfile } = useAuth()
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
  const [authOpen, setAuthOpen] = useState(false)
  const [userSessions, setUserSessions] = useState([])
  const [loadingSessionId, setLoadingSessionId] = useState(null)
  const [voterName, setVoterName] = useState('')
  const [votes, setVotes] = useState({})
  const [voters, setVoters] = useState([])
  const [aiSuggestions, setAiSuggestions] = useState([])

  const applySessionPayload = (data) => {
    setResult({
      session_id: data.session_id,
      suggested_area: data.suggested_area,
      area_reason: data.area_reason,
      travel_summary: data.travel_summary,
      restaurants: data.restaurants,
      warning: data.warning,
    })
    if (data.persons) setPersons(data.persons)
    if (data.group_name) setGroupName(data.group_name)
    if (data.meal_type) setMealType(data.meal_type)
    if (data.day) setDay(data.day)
    setSavedRestaurants(
      (data.saved_restaurants || []).map((r) => r.name || r),
    )
    setVotes(data.votes || {})
    setVoters(data.voters || [])
    localStorage.setItem(SESSION_KEY, data.session_id)
    setHasSavedSession(true)
    setView('results')
  }

  const loadSession = async (sessionId) => {
    setLoadingSessionId(sessionId)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/session/${sessionId}`)
      if (res.ok) {
        applySessionPayload(await res.json())
        return
      }

      if (user) {
        const cached = await fetchUserSessionData(user.id, sessionId)
        if (cached) {
          applySessionPayload(cached)
          return
        }
      }

      const cachedLocal = userSessions.find((s) => s.session_id === sessionId)
      if (cachedLocal?.session_data) {
        applySessionPayload(cachedLocal.session_data)
        return
      }

      throw new Error('Session expired or not found. Run a new search to save fresh results.')
    } catch (e) {
      setError(e.message || 'Could not load session')
    } finally {
      setLoadingSessionId(null)
    }
  }

  const handleDeleteSession = async (sessionId) => {
    if (!user) return
    const { error: err } = await deleteUserSession(user.id, sessionId)
    if (!err) {
      setUserSessions((prev) => prev.filter((s) => s.session_id !== sessionId))
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const checkoutSessionId = params.get('checkout_session_id')

    const activatePro = async (subscriptionId = null) => {
      setIsPro(true)
      localStorage.setItem(PRO_KEY, 'true')
      if (subscriptionId) {
        localStorage.setItem(SUBSCRIPTION_KEY, subscriptionId)
      }
      if (user) {
        await setUserPro(user.id, true, subscriptionId)
        refreshProfile()
      }
    }

    if (params.get('upgraded') === 'true') {
      ;(async () => {
        let subscriptionId = localStorage.getItem(SUBSCRIPTION_KEY)

        if (checkoutSessionId) {
          try {
            const res = await fetch(`${API_URL}/confirm-pro`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ checkout_session_id: checkoutSessionId }),
            })
            if (res.ok) {
              const data = await res.json()
              if (data.subscription_id) {
                subscriptionId = data.subscription_id
              }
            }
          } catch {
            /* still activate locally */
          }
        }

        await activatePro(subscriptionId)
        window.history.replaceState({}, '', window.location.pathname)
      })()
    } else if (localStorage.getItem(PRO_KEY) === 'true') {
      setIsPro(true)
    }
  }, [user, refreshProfile])

  useEffect(() => {
    const savedVoter = localStorage.getItem(VOTER_KEY)
    if (savedVoter) setVoterName(savedVoter)

    const params = new URLSearchParams(window.location.search)
    const sessionId =
      params.get('session') || localStorage.getItem(SESSION_KEY)
    if (sessionId) {
      setHasSavedSession(true)
      if (params.get('session')) {
        loadSession(sessionId)
      }
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setUserSessions([])
      return
    }
    fetchUserSessions(user.id).then(setUserSessions)
  }, [user])

  useEffect(() => {
    if (profile?.is_pro) {
      setIsPro(true)
      localStorage.setItem(PRO_KEY, 'true')
      if (profile.stripe_subscription_id) {
        localStorage.setItem(SUBSCRIPTION_KEY, profile.stripe_subscription_id)
      }
    }
  }, [profile])

  useEffect(() => {
    if (user && localStorage.getItem(PRO_KEY) === 'true' && !profile?.is_pro) {
      const subId = localStorage.getItem(SUBSCRIPTION_KEY)
      setUserPro(user.id, true, subId || null)
    }
  }, [user, profile?.is_pro])

  // Poll votes every 5 seconds when on results view
  // Poll votes every 15 seconds when on results view and session is shared
  useEffect(() => {
    if (view !== 'results' || !result?.session_id) return
    if (result.session_id === 'demo-session') return

    // Only start polling if the session was loaded via a share link
    const params = new URLSearchParams(window.location.search)
    const isSharedSession = params.get('session') === result.session_id

    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/votes/${result.session_id}`)
        if (res.ok) {
          const data = await res.json()
          setVotes(data.votes || {})
          setVoters(data.voters || [])
        }
      } catch {
        /* ignore */
      }
    }

    // Fetch once immediately, then poll only if shared
    poll()
    if (!isSharedSession) return
    const interval = setInterval(poll, 15000)
    return () => clearInterval(interval)
  }, [view, result?.session_id])

  const persistSessionForUser = async (data, personsPayload) => {
    if (!user || !data?.session_id) return
    const sessionData = {
      session_id: data.session_id,
      suggested_area: data.suggested_area,
      area_reason: data.area_reason,
      travel_summary: data.travel_summary,
      restaurants: data.restaurants,
      warning: data.warning,
      group_name: groupName,
      meal_type: mealType,
      day,
      persons: personsPayload,
      saved_restaurants: [],
      votes: {},
      voters: [],
    }
    await saveUserSession(user.id, {
      session_id: data.session_id,
      group_name: groupName,
      suggested_area: data.suggested_area,
      session_data: sessionData,
    })
    const sessions = await fetchUserSessions(user.id)
    setUserSessions(sessions)
  }

  const handleFind = async () => {
    setLoading(true)
    setError(null)
    try {
      if (!isPro) {
        const dailyCount = user
          ? await countUserSessionsToday(user.id)
          : getAnonymousDailySearchCount()
        if (dailyCount >= FREE_DAILY_SESSIONS) {
          throw new Error(
            'Free plan: 1 search per day. Go Pro for unlimited searches.',
          )
        }
        if (persons.length > FREE_MAX_PERSONS) {
          throw new Error(
            `Free plan: up to ${FREE_MAX_PERSONS} people. Go Pro for larger groups.`,
          )
        }
      }

      const personsPayload = persons.map((p) => ({
        ...p,
        dietary: p.dietary.map((d) => DIETARY_MAP[d] || d.toLowerCase()),
        cuisine_loves: p.cuisine_loves,
        must_have: p.must_have.map((m) => MUST_HAVE_MAP[m] || m.toLowerCase()),
        avoid: (p.avoid || []).map((a) => a.toLowerCase()),
      }))

      const res = await fetch(`${API_URL}/find`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_name: groupName,
          persons: personsPayload,
          meal_type: mealType,
          day: day,
          is_pro: isPro,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to find restaurants')
      }
      const data = await res.json()
      setResult(data)
      if (data.warning) {
        setError(data.warning)
      }
      localStorage.setItem(SESSION_KEY, data.session_id)
      setHasSavedSession(true)
      setSavedRestaurants([])
      if (!user) {
        incrementAnonymousDailySearchCount()
      }
      await persistSessionForUser(data, personsPayload)
      setVotes({})
      setVoters([])
      setView('results')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRefine = async (message) => {
    if (!result?.session_id) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: result.session_id,
          message,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to refine results')
      }
      const data = await res.json()
      // Store AI suggestions separately — don't override existing results
      setAiSuggestions(data.restaurants || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (restaurantName) => {
    if (!result?.session_id || !voterName.trim()) return

    // Optimistic update
    const newVotes = { ...votes }
    for (const key of Object.keys(newVotes)) {
      newVotes[key] = (newVotes[key] || []).filter((v) => v !== voterName)
      if (newVotes[key].length === 0) delete newVotes[key]
    }
    newVotes[restaurantName] = [...(newVotes[restaurantName] || []), voterName]
    setVotes(newVotes)

    if (!voters.includes(voterName)) {
      setVoters([...voters, voterName])
    }

    localStorage.setItem(VOTER_KEY, voterName)

    // For demo mode, just keep it local
    if (result.session_id === 'demo-session') return

    try {
      const res = await fetch(`${API_URL}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: result.session_id,
          voter_name: voterName,
          restaurant_name: restaurantName,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setVotes(data.votes || {})
        setVoters(data.voters || [])
      }
    } catch {
      /* ignore */
    }
  }

  const handleDemo = () => {
    setPersons(DEMO_PERSONS.map((p) => ({ ...p })))
    setGroupName('Demo Group')
    setMealType('dinner')
    setDay('today')
    setResult(DEMO_RESULT)
    setSavedRestaurants([])
    setVotes({})
    setVoters([])
    setView('results')
  }

  const handleStartOver = () => {
    setView('setup')
    setResult(null)
    setError(null)
  }

  const handleContinueSession = () => {
    const sessionId = localStorage.getItem(SESSION_KEY)
    if (sessionId) loadSession(sessionId)
  }

  const handleUpgrade = async () => {
    try {
      const res = await fetch(`${API_URL}/create-checkout`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Checkout failed')
      }
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
        return
      }
      throw new Error('No checkout URL returned')
    } catch (e) {
      setError(e.message || 'Could not start checkout. Is Stripe configured?')
    }
  }

  const handleCancelPro = async () => {
    if (!window.confirm('Cancel TableFor Pro? You will return to the free plan.')) {
      return
    }

    setLoading(true)
    setError(null)
    try {
      const subscriptionId =
        localStorage.getItem(SUBSCRIPTION_KEY) ||
        profile?.stripe_subscription_id ||
        null

      const res = await fetch(`${API_URL}/cancel-pro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_id: subscriptionId }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Could not cancel subscription')
      }

      setIsPro(false)
      localStorage.removeItem(PRO_KEY)
      localStorage.removeItem(SUBSCRIPTION_KEY)
      if (user) {
        await setUserPro(user.id, false)
        refreshProfile()
      }
    } catch (e) {
      setError(e.message || 'Could not cancel Pro')
    } finally {
      setLoading(false)
    }
  }

  const handleRestaurantSaved = (name) => {
    setSavedRestaurants((prev) => [...prev, name])
  }

  return (
    <div className="min-h-full bg-bg">
      {/* App header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-border px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-accent">TableFor</span>
            {isPro && (
              <span className="px-1.5 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-bold">
                PRO
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {authConfigured && (
              user ? (
                <button
                  type="button"
                  onClick={signOut}
                  className="px-2.5 py-1 text-[10px] font-medium border border-border rounded-full text-text-secondary hover:text-text-primary transition-colors"
                  title={profile?.email || user.email}
                >
                  {profile?.display_name || 'Account'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className="px-2.5 py-1 text-[10px] font-medium border border-border rounded-full text-text-secondary hover:text-text-primary transition-colors"
                >
                  Sign in
                </button>
              )
            )}
            {!isPro && (
              <button
                type="button"
                onClick={handleUpgrade}
                className="px-2.5 py-1 text-[10px] font-medium bg-accent hover:bg-accent-hover text-white rounded-full transition-colors"
              >
                Go Pro
              </button>
            )}
            {isPro && (
              <button
                type="button"
                onClick={handleCancelPro}
                disabled={loading}
                className="px-2.5 py-1 text-[10px] font-medium border border-border rounded-full text-text-secondary hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-50"
              >
                Cancel Pro
              </button>
            )}
          </div>
        </div>
      </header>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      {error && (
        <div className="px-4 pt-3">
          <div className={`border rounded-2xl px-3 py-2 text-xs ${
            result
              ? 'bg-amber-50 border-amber-200 text-amber-700'
              : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            <span className="font-medium">{result ? '⚠️ ' : '❌ '}</span>
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
          userSessions={userSessions}
          onLoadUserSession={loadSession}
          onDeleteUserSession={handleDeleteSession}
          loadingSessionId={loadingSessionId}
          isSignedIn={Boolean(user)}
          onSignIn={() => setAuthOpen(true)}
          isPro={isPro}
          onUpgrade={handleUpgrade}
          maxPersons={isPro ? PRO_MAX_PERSONS : FREE_MAX_PERSONS}
        />
      ) : (
        <ResultsPanel
          result={result}
          persons={persons}
          onStartOver={handleStartOver}
          savedRestaurants={savedRestaurants}
          onRestaurantSaved={handleRestaurantSaved}
          onRefine={handleRefine}
          loading={loading}
          aiSuggestions={aiSuggestions}
          votes={votes}
          voters={voters}
          voterName={voterName}
          setVoterName={setVoterName}
          onVote={handleVote}
        />
      )}
    </div>
  )
}
