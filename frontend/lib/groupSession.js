import { API_URL, EMPTY_PERSON } from './constants'

export function buildJoinUrl(sessionId) {
  if (typeof window === 'undefined') return `?join=${sessionId}`
  return `${window.location.origin}${window.location.pathname}?join=${sessionId}`
}

export function buildResultsUrl(sessionId) {
  if (typeof window === 'undefined') return `?session=${sessionId}`
  return `${window.location.origin}${window.location.pathname}?session=${sessionId}`
}

export function getJoinSlotKey(sessionId) {
  return `tablefor_join_slot_${sessionId}`
}

export function getHostKey(sessionId) {
  return `tablefor_host_${sessionId}`
}

/** Normalize person objects loaded from the API for the wizard UI */
export function normalizePersonFromApi(person) {
  return {
    ...EMPTY_PERSON,
    ...person,
    dietary: person?.dietary || [],
    cuisine_loves: person?.cuisine_loves || [],
    must_have: person?.must_have || [],
    avoid: person?.avoid || [],
    notes: person?.notes || '',
  }
}

export function normalizePersonsFromApi(persons) {
  if (!persons?.length) {
    return [{ ...EMPTY_PERSON }, { ...EMPTY_PERSON }]
  }
  return persons.map(normalizePersonFromApi)
}

export async function createGroup(payload) {
  const res = await fetch(`${API_URL}/group/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Could not create group')
  }
  return res.json()
}

export async function fetchGroup(sessionId) {
  const res = await fetch(`${API_URL}/group/${sessionId}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Group not found')
  }
  return res.json()
}

export async function updateGroup(sessionId, payload) {
  const res = await fetch(`${API_URL}/group/${sessionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, session_id: sessionId }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Could not update group')
  }
  return res.json()
}

export async function joinGroup(sessionId, person, personIndex = null) {
  const res = await fetch(`${API_URL}/group/${sessionId}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ person, person_index: personIndex }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Could not join group')
  }
  return res.json()
}

export function isGroupSearchComplete(data) {
  return (
    data?.status === 'searched' &&
    Array.isArray(data?.restaurants) &&
    data.restaurants.length > 0
  )
}

export function pickJoinSlotIndex(persons, sessionId) {
  const saved = localStorage.getItem(getJoinSlotKey(sessionId))
  if (saved !== null && saved !== '') {
    const idx = Number(saved)
    if (!Number.isNaN(idx) && idx >= 0) return idx
  }

  const emptyIdx = (persons || []).findIndex(
    (p) => !p?.name?.trim() || !p?.location?.trim(),
  )
  if (emptyIdx >= 0) return emptyIdx
  return (persons || []).length
}
