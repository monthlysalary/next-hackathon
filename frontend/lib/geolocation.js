import { API_URL } from './constants'

export function getGeolocationBlockedReason() {
  if (typeof window === 'undefined') return 'Location unavailable.'
  if (!navigator.geolocation) {
    return 'GPS is not available in this browser. Using network location instead.'
  }
  if (!window.isSecureContext) {
    const { hostname, port } = window.location
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      const localUrl = `http://localhost:${port || '5173'}`
      return `GPS needs localhost. Open ${localUrl} in Chrome/Safari for the Allow prompt.`
    }
    return 'Location requires HTTPS or localhost.'
  }
  return null
}

export function geolocationErrorMessage(err) {
  if (err?.code === 1) {
    return (
      'Location is blocked for this site. In Chrome: click the lock icon in the address bar → ' +
      'Site settings → Location → Allow, then reload and try again.'
    )
  }
  if (err?.code === 2) {
    return 'Location unavailable on this device.'
  }
  if (err?.code === 3) {
    return 'Location timed out.'
  }
  return err?.message || 'Could not get your location.'
}

async function getMapboxIpCoordinates() {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token) return null

  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/ip.json?access_token=${token}&country=SG`,
  )
  if (!res.ok) return null

  const data = await res.json()
  const feature = data.features?.[0]
  if (!feature?.center) return null

  return {
    latitude: feature.center[1],
    longitude: feature.center[0],
  }
}

async function getIpApiCoordinates() {
  const res = await fetch('https://ipapi.co/json/')
  if (!res.ok) return null

  const data = await res.json()
  if (data.error || data.latitude == null || data.longitude == null) return null

  return {
    latitude: data.latitude,
    longitude: data.longitude,
  }
}

export async function getApproximateCoordinatesViaIp() {
  const mapbox = await getMapboxIpCoordinates().catch(() => null)
  if (mapbox) return mapbox

  const ipapi = await getIpApiCoordinates().catch(() => null)
  if (ipapi) return ipapi

  throw new Error('Network location lookup failed.')
}

export async function resolveAreaFromCoordinates(latitude, longitude) {
  const res = await fetch(`${API_URL}/gps-area`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ latitude, longitude }),
  })

  if (!res.ok) {
    throw new Error(
      'Could not resolve your location. Make sure the backend is running on port 8000.',
    )
  }

  const data = await res.json()
  if (!data.area) {
    throw new Error(data.message || 'Could not find a nearby area.')
  }

  return {
    area: data.area,
    alternatives: data.alternatives || [],
    source: data.source,
    inSingapore: data.in_singapore !== false,
    message: data.message || null,
  }
}

/**
 * Call getCurrentPosition synchronously from a user click handler.
 * Browsers only show the Allow prompt when this runs in the same event turn.
 */
export function requestGpsCoordinates(onSuccess, onError, options) {
  if (!navigator.geolocation) {
    onError(new Error('Geolocation not supported'))
    return
  }
  navigator.geolocation.getCurrentPosition(onSuccess, onError, options)
}

export const GPS_OPTIONS = {
  enableHighAccuracy: false,
  timeout: 12000,
  maximumAge: 300000,
}
