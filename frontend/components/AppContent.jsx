'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import GroupSetup from './GroupSetup'
import ResultsPanel from './ResultsPanel'
import SessionHome from './SessionHome'
import PastSessionsPanel from './PastSessionsPanel'
import AuthModal from './AuthModal'
import TableForBrand from './TableForBrand'
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

function isPersonEmpty(p) {
  if (!p) return true
  return !p.name?.trim() && !p.location?.trim()
}

function mergePersonSlot(local, remote) {
  const l = { ...EMPTY_PERSON, ...local }
  const r = { ...EMPTY_PERSON, ...remote }

  if (isPersonEmpty(r) && !isPersonEmpty(l)) return l
  if (isPersonEmpty(l) && !isPersonEmpty(r)) return r

  return {
    ...r,
    name: l.name?.trim() ? l.name : r.name,
    location: l.location?.trim() ? l.location : r.location,
    latitude: l.latitude ?? r.latitude,
    longitude: l.longitude ?? r.longitude,
    budget: l.budget || r.budget,
    dietary: l.dietary?.length ? l.dietary : r.dietary,
    cuisine_loves: l.cuisine_loves?.length ? l.cuisine_loves : r.cuisine_loves,
    must_have: l.must_have?.length ? l.must_have : r.must_have,
    avoid: l.avoid?.length ? l.avoid : r.avoid,
    notes: l.notes?.trim() ? l.notes : r.notes,
  }
}

function mergePersonsFromServer(local, remote, preserveIndex, hostMode = false) {
  const normalized = normalizePersonsFromApi(remote)

  if (preserveIndex != null) {
    const merged = [...normalized]
    while (merged.length <= preserveIndex) {
      merged.push({ ...EMPTY_PERSON })
    }
    if (local[preserveIndex]) {
      merged[preserveIndex] = local[preserveIndex]
    }
    return merged
  }

  if (!hostMode) return normalized

  const maxLen = Math.max(local.length, normalized.length)
  return Array.from({ length: maxLen }, (_, i) =>
    mergePersonSlot(local[i], normalized[i]),
  )
}

export default function AppContent() {
  const {
    user,
    profile,
    signOut,
    configured: authConfigured,
    refreshProfile,
    loading: authLoading,
  } = useAuth()
  const [view, setView] = useState('home')
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
  const [needsSignIn, setNeedsSignIn] = useState(false)
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
  const [sessionReady, setSessionReady] = useState(false)
  const [pendingJoinId, setPendingJoinId] = useState(null)
  const [setupKey, setSetupKey] = useState(0)
  const groupCreatedRef = useRef(false)
  const skipResultsRedirectRef = useRef(false)
  const findInProgressRef = useRef(false)
  const prevUserRef = useRef(null)

  const clearStoredGroupSession = useCallback((sessionId) => {
    if (sessionId) {
      localStorage.removeItem(getHostKey(sessionId))
      localStorage.removeItem(getJoinSlotKey(sessionId))
    }
    const stored = localStorage.getItem(SESSION_KEY)
    if (!sessionId || stored === sessionId) {
      localStorage.removeItem(SESSION_KEY)
    }
  }, [])

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
      const res = await fetch(`${API_URL}/group/${sessionId}`)
      if (res.ok) {
        data = await res.json()
      } else {
        const sessionRes = await fetch(`${API_URL}/session/${sessionId}`)
        if (sessionRes.ok) {
          data = await sessionRes.json()
        }
      }

      if (!data && user) {
        data = await fetchUserSessionData(user.id, sessionId)
      }
      if (!data) {
        const cachedLocal = userSessions.find((s) => s.session_id === sessionId)
        data = cachedLocal?.session_data
      }
      if (!data) {
        if (join) {
          throw new Error('Group not found or expired. Ask the host for a new link.')
        }
        clearStoredGroupSession(sessionId)
        setGroupSessionId(null)
        groupCreatedRef.current = false
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

    const finishInit = () => setSessionReady(true)

    if (joinId) {
      setPendingJoinId(joinId)
      finishInit()
    } else if (params.get('session') && sessionId) {
      setHasSavedSession(true)
      loadSession(sessionId).finally(finishInit)
    } else {
      if (localStorage.getItem(SESSION_KEY)) {
        setHasSavedSession(true)
      }
      setView('home')
      finishInit()
    }
  }, [])

  // After sign-in, load the invited group session
  useEffect(() => {
    if (!pendingJoinId || authLoading || joinMode) return

    if (!authConfigured) {
      loadSession(pendingJoinId, { join: true })
      setPendingJoinId(null)
      return
    }

    if (user) {
      loadSession(pendingJoinId, { join: true })
      setPendingJoinId(null)
    }
  }, [pendingJoinId, user, authLoading, authConfigured, joinMode])

  useEffect(() => {
    if (!user) {
      setUserSessions([])
      return
    }
    fetchUserSessions(user.id).then(setUserSessions)
  }, [user])

  useEffect(() => {
    if (authLoading) return

    const params = new URLSearchParams(window.location.search)
    if (params.get('session') || params.get('join') || pendingJoinId) {
      prevUserRef.current = user
      return
    }

    const hadUser = prevUserRef.current
    if (!hadUser && user && !joinMode && view === 'setup') {
      setView('home')
    }
    prevUserRef.current = user
  }, [user, authLoading, pendingJoinId, joinMode, view])

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
    if (!sessionReady) return
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
        localStorage.setItem(SESSION_KEY, data.session_id)
        localStorage.setItem(getHostKey(data.session_id), 'true')
        setIsHost(true)
        setHasSavedSession(true)
      } catch {
        groupCreatedRef.current = false
      }
    })()
  }, [sessionReady, joinMode, groupSessionId, view, groupName, mealType, day, persons])

  // Host: sync setup to backend
  useEffect(() => {
    if (!groupSessionId || !isHost || view !== 'setup' || joinMode) return

    const timer = setTimeout(async () => {
      try {
        await updateGroup(groupSessionId, {
          group_name: groupName,
          meal_type: mealType,
          day,
          persons,
        })
      } catch {
        /* ignore sync errors */
      }
    }, 800)

    return () => clearTimeout(timer)
  }, [groupSessionId, isHost, joinMode, view, groupName, mealType, day, persons])

  // Poll group for joiners (setup) or redirect when search completes
  useEffect(() => {
    if (!groupSessionId || view !== 'setup') return

    const poll = async () => {
      try {
        const data = await fetchGroup(groupSessionId)
        if (isGroupSearchComplete(data)) {
          if (findInProgressRef.current) return
          if (joinMode || !skipResultsRedirectRef.current) {
            applySearchResults(data)
          }
          return
        }
        setPersons((prev) =>
          mergePersonsFromServer(
            prev,
            data.persons,
            joinMode ? joinSlotIndex : null,
            isHost && !joinMode,
          ),
        )
        if (data.group_name) setGroupName(data.group_name)
        if (data.meal_type) setMealType(data.meal_type)
        if (data.day) setDay(normalizeDay(data.day))
      } catch (e) {
        if (!joinMode && isHost) {
          clearStoredGroupSession(groupSessionId)
          setGroupSessionId(null)
          groupCreatedRef.current = false
        }
      }
    }

    poll()
    const interval = setInterval(poll, 5000)
    return () => clearInterval(interval)
  }, [groupSessionId, view, joinMode, joinSlotIndex, isHost, applySearchResults, clearStoredGroupSession])

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
    setResult(null)
    skipResultsRedirectRef.current = true
    findInProgressRef.current = true
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
        } catch (syncErr) {
          const msg = syncErr?.message || ''
          if (!msg.includes('already has results')) {
            throw syncErr
          }
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
      skipResultsRedirectRef.current = false
      setView('results')
    } catch (e) {
      setError(e.message)
    } finally {
      findInProgressRef.current = false
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
    skipResultsRedirectRef.current = true
    setView('setup')
    setResult(null)
    setError(null)
    setJoinMode(false)
    setIsHost(true)
    setJoinSlotIndex(null)
    groupCreatedRef.current = false

    const params = new URLSearchParams(window.location.search)
    const joinId = params.get('join')
    const nextUrl = joinId ? `?join=${joinId}` : window.location.pathname
    window.history.replaceState({}, '', nextUrl)
  }

  const resetSessionState = useCallback(() => {
    skipResultsRedirectRef.current = true
    const oldSessionId = groupSessionId || localStorage.getItem(SESSION_KEY)
    clearStoredGroupSession(oldSessionId)

    setResult(null)
    setError(null)
    setGroupSessionId(null)
    setGroupName('Our Group')
    setMealType('dinner')
    setDay(todayDateString())
    setPersons([{ ...EMPTY_PERSON }, { ...EMPTY_PERSON }])
    setSavedRestaurants([])
    setVotes({})
    setVoters([])
    setJoinMode(false)
    setIsHost(true)
    setJoinSlotIndex(null)
    setHasSavedSession(false)
    setInviteCopied(false)
    groupCreatedRef.current = false
    setSetupKey((k) => k + 1)

    window.history.replaceState({}, '', window.location.pathname)
  }, [groupSessionId, clearStoredGroupSession])

  const handleGoHome = () => {
    resetSessionState()
    setView('home')
  }

  const handleStartNewSession = () => {
    resetSessionState()
    setView('setup')
  }

  const handleLoadPastSessions = () => {
    setView('past-sessions')
  }

  const handleLoadSessionFromList = (sessionId) => {
    loadSession(sessionId)
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

  const handleSignOut = async () => {
    await signOut()
    handleGoHome()
    if (authConfigured) {
      setNeedsSignIn(true)
    }
  }

  const needsJoinSignIn =
    Boolean(pendingJoinId) && authConfigured && !authLoading && !user
  const needsAuthGate =
    authConfigured && !authLoading && !user && (needsJoinSignIn || needsSignIn)
  const showNavHome = view !== 'home' && !joinMode && !needsAuthGate

  return (
    <div className="flex h-full min-h-0 flex-col bg-transparent">
      {!needsAuthGate && (
      <header className="app-header-safe sticky top-0 z-30 shrink-0 bg-white/90 backdrop-blur border-b border-border px-4 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <TableForBrand titleClassName="text-base font-bold text-accent" />
            {isPro && (
              <span className="px-1.5 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-bold">
                PRO
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {authConfigured && user && (
              <span
                className="text-[10px] text-text-secondary truncate max-w-[88px] md:max-w-[140px] lg:max-w-none lg:text-xs"
                title={profile?.email || user.email}
              >
                {profile?.display_name || user.email?.split('@')[0] || 'Account'}
              </span>
            )}
            {showNavHome && (
              <button
                type="button"
                onClick={handleGoHome}
                className="px-2.5 py-1 text-[10px] font-medium border border-border rounded-full text-text-secondary hover:text-text-primary transition-colors shrink-0"
              >
                Home
              </button>
            )}
            {authConfigured && (
              user ? (
                <>
                  <button
                    type="button"
                    onClick={handleSignOut}
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

      {needsAuthGate ? (
        <AuthModal
          open
          required
          fullPage
          fullPageHeroTitle={needsJoinSignIn ? undefined : 'Sign in to TableFor'}
          fullPageHeroSubtitle={
            needsJoinSignIn
              ? undefined
              : 'Sign in or create an account to save sessions and pick up where you left off.'
          }
          onAuthenticated={() => setNeedsSignIn(false)}
        />
      ) : authLoading && pendingJoinId ? (
        <div className="flex flex-1 items-center justify-center py-20 text-sm text-text-secondary">
          Loading…
        </div>
      ) : (
        <>
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

      {view === 'home' && (
        <SessionHome
          onStartNewSession={handleStartNewSession}
          onLoadPastSessions={handleLoadPastSessions}
          onDemo={handleDemo}
        />
      )}

      {view === 'past-sessions' && (
        <PastSessionsPanel
          userSessions={userSessions}
          loadingSessionId={loadingSessionId}
          onLoadSession={handleLoadSessionFromList}
          onSignIn={() => setAuthOpen(true)}
          isSignedIn={Boolean(user)}
          hasLocalSession={hasSavedSession}
        />
      )}

      {view === 'setup' && (
        <GroupSetup
          key={setupKey}
          groupName={groupName}
          setGroupName={setGroupName}
          mealType={mealType}
          setMealType={setMealType}
          day={day}
          setDay={setDay}
          persons={persons}
          setPersons={setPersons}
          onFind={handleFind}
          loading={loading}
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
      )}

      {view === 'results' && (
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
        </>
      )}
    </div>
  )
}
