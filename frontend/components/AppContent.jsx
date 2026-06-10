'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import WelcomeScreen from './WelcomeScreen'
import GroupSetup from './GroupSetup'
import ResultsPanel from './ResultsPanel'
import AuthModal from './AuthModal'
import { useAuth } from './AuthProvider'
import {
  API_URL,
  EMPTY_PERSON,
  DEMO_PERSONS,
  DEMO_RESULT,
  todayDateString,
  normalizeDay,
} from '@/lib/constants'
import { fetchUserSessions, saveUserSession, fetchUserSessionData, countUserSessionsToday, setUserPro } from '@/lib/userDb'
import {
  FREE_MAX_PERSONS,
  PRO_MAX_PERSONS,
  FREE_DAILY_SESSIONS,
  getAnonymousDailySearchCount,
  incrementAnonymousDailySearchCount,
} from '@/lib/planLimits'
import {
  buildJoinUrl,
  createGroup,
  fetchGroup,
  updateGroup,
  joinGroup,
  isGroupSearchComplete,
  normalizePersonsFromApi,
  pickJoinSlotIndex,
  getJoinSlotKey,
  getHostKey,
} from '@/lib/groupSession'

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
  Quiet: 'quiet',
  Aircon: 'aircon',
  'Air-conditioned': 'aircon',
  'Big tables': 'big tables',
  'Large group seating': 'big tables',
  Parking: 'parking',
  'Halal-cert': 'halal-certified',
}

function mergePersonsFromServer(local, remote, preserveIndex) {
  const normalized = normalizePersonsFromApi(remote)
  if (preserveIndex == null) return normalized
  const merged = [...normalized]
  while (merged.length <= preserveIndex) {
    merged.push({ ...EMPTY_PERSON })
  }
  if (local[preserveIndex]) {
    merged[preserveIndex] = local[preserveIndex]
  }
  return merged
}

export default function AppContent() {
  const { user, profile, signOut, configured: authConfigured, refreshProfile } = useAuth()
  const [view, setView] = useState('welcome')
  const [groupName, setGroupName] = useState('Our Group')
  const [mealType, setMealType] = useState('dinner')
  const [day, setDay] = useState(todayDateString())
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
  const [groupSessionId, setGroupSessionId] = useState(null)
  const [joinMode, setJoinMode] = useState(false)
  const [isHost, setIsHost] = useState(true)
  const [joinSlotIndex, setJoinSlotIndex] = useState(null)
  const [inviteCopied, setInviteCopied] = useState(false)
  const groupCreatedRef = useRef(false)

  const applyGroupData = useCallback((data) => {
    if (data.persons) setPersons(normalizePersonsFromApi(data.persons))
    if (data.group_name) setGroupName(data.group_name)
    if (data.meal_type) setMealType(data.meal_type)
    if (data.day) setDay(normalizeDay(data.day))
    const sid = data.session_id
    if (sid) {
      setGroupSessionId(sid)
      localStorage.setItem(SESSION_KEY, sid)
      setHasSavedSession(true)
    }
  }, [])

  const applySearchResults = useCallback((data) => {
    applyGroupData(data)
    setResult({
      session_id: data.session_id,
      suggested_area: data.suggested_area,
      area_reason: data.area_reason,
      travel_summary: data.travel_summary,
      restaurants: data.restaurants,
      warning: data.warning,
    })
    setSavedRestaurants(
      (data.saved_restaurants || []).map((r) => r.name || r),
    )
    setVotes(data.votes || {})
    setVoters(data.voters || [])
    setView('results')
  }, [applyGroupData])

  const loadSession = async (sessionId, { join = false } = {}) => {
    setLoadingSessionId(sessionId)
    setError(null)
    try {
      let data = null
      // Try session endpoint first
      const sessionRes = await fetch(`${API_URL}/session/${sessionId}`)
      if (sessionRes.ok) {
        data = await sessionRes.json()
      }

      // Try group endpoint as fallback
      if (!data) {
        try {
          const groupRes = await fetch(`${API_URL}/group/${sessionId}`)
          if (groupRes.ok) data = await groupRes.json()
        } catch { /* group endpoint may not exist */ }
      }

      if (!data && user) {
        data = await fetchUserSessionData(user.id, sessionId)
      }
      if (!data) {
        const cachedLocal = userSessions.find((s) => s.session_id === sessionId)
        data = cachedLocal?.session_data
      }
      if (!data) {
        // Session doesn't exist — just go to setup instead of showing error
        setView('setup')
        return
      }

      if (isGroupSearchComplete(data)) {
        applySearchResults(data)
        return
      }

      applyGroupData(data)
      setView('setup')

      if (join) {
        setJoinMode(true)
        setIsHost(false)
        const slot = pickJoinSlotIndex(data.persons, sessionId)
        let normalized = normalizePersonsFromApi(data.persons)
        while (normalized.length <= slot) {
          normalized.push({ ...EMPTY_PERSON })
        }
        setPersons(normalized)
        setJoinSlotIndex(slot)
        localStorage.setItem(getJoinSlotKey(sessionId), String(slot))
        window.history.replaceState({}, '', `?join=${sessionId}`)
      } else {
        const isGroupHost = localStorage.getItem(getHostKey(sessionId)) === 'true'
        setJoinMode(false)
        setIsHost(isGroupHost || !join)
      }
    } catch (e) {
      setError(e.message || 'Could not load group')
    } finally {
      setLoadingSessionId(null)
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
    const joinId = params.get('join')
    const sessionId = params.get('session') || localStorage.getItem(SESSION_KEY)

    if (joinId) {
      loadSession(joinId, { join: true })
    } else if (sessionId) {
      setHasSavedSession(true)
      if (params.get('session')) {
        loadSession(sessionId)
      } else if (localStorage.getItem(getHostKey(sessionId)) === 'true') {
        setGroupSessionId(sessionId)
        setIsHost(true)
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

  // Host: create shareable group session once
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('join')) return
    if (joinMode || groupSessionId || view !== 'setup' || groupCreatedRef.current) return

    groupCreatedRef.current = true
    ;(async () => {
      try {
        const data = await createGroup({
          group_name: groupName,
          meal_type: mealType,
          day,
          persons,
        })
        setGroupSessionId(data.session_id)
        localStorage.setItem(getHostKey(data.session_id), 'true')
        setIsHost(true)
      } catch {
        // Don't reset the ref — avoid infinite retry loops when backend is down.
        // The group will be created lazily when the user hits "Find Matches".
      }
    })()
  }, [joinMode, groupSessionId, view])

  // Host: sync setup to backend
  useEffect(() => {
    if (!groupSessionId || !isHost || view !== 'setup' || joinMode) return

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        await updateGroup(groupSessionId, {
          group_name: groupName,
          meal_type: mealType,
          day,
          persons,
        })
      } catch {
        /* ignore sync errors — backend may be unavailable */
      }
    }, 800)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [groupSessionId, isHost, joinMode, view, groupName, mealType, day, persons])

  // Poll group for joiners (setup) or redirect when search completes
  useEffect(() => {
    if (!groupSessionId || view !== 'setup') return
    // Only poll when in join mode (waiting for host) or when host has shared the link.
    // Skip polling entirely when user is a solo host with no joiners — avoids
    // noisy failed fetches when backend is unavailable.
    if (!joinMode && !new URLSearchParams(window.location.search).get('join')) return

    let cancelled = false

    const poll = async () => {
      if (cancelled) return
      try {
        const data = await fetchGroup(groupSessionId)
        if (cancelled) return
        if (isGroupSearchComplete(data)) {
          applySearchResults(data)
          return
        }
        setPersons((prev) =>
          mergePersonsFromServer(
            prev,
            data.persons,
            joinMode ? joinSlotIndex : null,
          ),
        )
        if (data.group_name) setGroupName(data.group_name)
        if (data.meal_type) setMealType(data.meal_type)
        if (data.day) setDay(normalizeDay(data.day))
      } catch {
        /* ignore — backend might be unreachable */
      }
    }

    poll()
    const interval = setInterval(poll, 5000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [groupSessionId, view, joinMode, joinSlotIndex, applySearchResults])

  useEffect(() => {
    if (view !== 'results' || !result?.session_id) return
    if (result.session_id === 'demo-session') return

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
      status: 'searched',
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

  const handleCopyInvite = async () => {
    if (!groupSessionId) return
    const url = buildJoinUrl(groupSessionId)
    try {
      await navigator.clipboard.writeText(url)
      setInviteCopied(true)
      setTimeout(() => setInviteCopied(false), 2000)
    } catch {
      setError(`Copy this link: ${url}`)
    }
  }

  const handleGuestPersonComplete = async (finalPerson, personIndex) => {
    if (!groupSessionId) return
    try {
      const data = await joinGroup(groupSessionId, finalPerson, personIndex)
      setPersons(normalizePersonsFromApi(data.persons))
      setJoinSlotIndex(data.person_index)
      localStorage.setItem(getJoinSlotKey(groupSessionId), String(data.person_index))
    } catch (e) {
      setError(e.message || 'Could not save your preferences')
    }
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
        cuisine_loves: p.cuisine_loves.map((c) => c.toLowerCase()),
        must_have: p.must_have.map((m) => MUST_HAVE_MAP[m] || m.toLowerCase()),
        avoid: (p.avoid || []).map((a) => a.toLowerCase()),
      }))

      if (groupSessionId && isHost) {
        try {
          await updateGroup(groupSessionId, {
            group_name: groupName,
            meal_type: mealType,
            day,
            persons,
          })
        } catch {
          // Group sync not available — proceed with search anyway
        }
      }

      const res = await fetch(`${API_URL}/find`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: groupSessionId,
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
      setGroupSessionId(data.session_id)
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
          // Send context so refine works even if backend lost the session
          persons: persons.map((p) => ({
            ...p,
            dietary: (p.dietary || []).map((d) => DIETARY_MAP[d] || (d || '').toLowerCase()),
            cuisine_loves: p.cuisine_loves || [],
            must_have: (p.must_have || []).map((m) => MUST_HAVE_MAP[m] || (m || '').toLowerCase()),
            avoid: (p.avoid || []).map((a) => (a || '').toLowerCase()),
          })),
          meal_type: mealType,
          day: day,
          suggested_area: result.suggested_area,
          group_name: groupName,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to refine results')
      }
      const data = await res.json()
      setResult(data)
      setVotes({})
      setVoters([])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (restaurantName) => {
    if (!result?.session_id || !voterName.trim()) return

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
    setDay(todayDateString())
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
    setJoinMode(false)
    setIsHost(true)
    setJoinSlotIndex(null)
    setGroupSessionId(null)
    groupCreatedRef.current = false
  }

  const handleClearHistory = () => {
    if (!window.confirm('Clear all saved sessions and history? This cannot be undone.')) {
      return
    }
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(VOTER_KEY)
    localStorage.removeItem(PRO_KEY)
    localStorage.removeItem(SUBSCRIPTION_KEY)
    // Clear any daily search counts
    const today = new Date().toISOString().slice(0, 10)
    localStorage.removeItem(`tablefor_daily_${today}`)
    setHasSavedSession(false)
    setUserSessions([])
    setResult(null)
    setGroupSessionId(null)
    setVotes({})
    setVoters([])
    setSavedRestaurants([])
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
      {view !== 'welcome' && (
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-border px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="TableFor" className="h-7 w-auto rounded-md" />
            {isPro && (
              <span className="px-1.5 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-bold">
                PRO
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {authConfigured && (
              user ? (
                <>
                  <span
                    className="text-[10px] text-text-secondary truncate max-w-[88px]"
                    title={profile?.email || user.email}
                  >
                    {profile?.display_name || user.email?.split('@')[0] || 'Account'}
                  </span>
                  <button
                    type="button"
                    onClick={signOut}
                    className="px-2.5 py-1 text-[10px] font-medium border border-border rounded-full text-text-secondary hover:text-red-600 hover:border-red-200 transition-colors"
                  >
                    Sign out
                  </button>
                </>
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
      )}

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

      {view === 'welcome' ? (
        <WelcomeScreen
          onGetStarted={() => setView('setup')}
          onDemo={handleDemo}
          hasSavedSession={hasSavedSession}
          onContinueSession={handleContinueSession}
          onClearHistory={handleClearHistory}
        />
      ) : view === 'setup' ? (
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
          loadingSessionId={loadingSessionId}
          isSignedIn={Boolean(user)}
          onSignIn={() => setAuthOpen(true)}
          isPro={isPro}
          onUpgrade={handleUpgrade}
          maxPersons={isPro ? PRO_MAX_PERSONS : FREE_MAX_PERSONS}
          groupSessionId={groupSessionId}
          joinMode={joinMode}
          isHost={isHost}
          joinSlotIndex={joinSlotIndex}
          onCopyInvite={handleCopyInvite}
          inviteCopied={inviteCopied}
          onGuestPersonComplete={handleGuestPersonComplete}
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
