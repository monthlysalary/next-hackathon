'use client'

import { useEffect, useRef } from 'react'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

export default function MapView({ persons, suggestedArea, restaurants, midpoint }) {
  const mapContainer = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return

    let map
    import('mapbox-gl').then((mapboxgl) => {
      mapboxgl.default.accessToken = MAPBOX_TOKEN

      map = new mapboxgl.default.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [midpoint?.longitude ?? 103.8198, midpoint?.latitude ?? 1.3521],
        zoom: 11,
      })

      mapRef.current = map

      map.on('load', () => {
        const meetupLng = midpoint?.longitude ?? 103.848
        const meetupLat = midpoint?.latitude ?? 1.352

        // Person markers
        persons.forEach((person, i) => {
          if (!person.latitude || !person.longitude) return

          const el = document.createElement('div')
          el.style.cssText =
            'width:14px;height:14px;border-radius:50%;background:#a855f7;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);'
          el.title = person.name

          new mapboxgl.default.Marker({ element: el })
            .setLngLat([person.longitude, person.latitude])
            .setPopup(
              new mapboxgl.default.Popup({ offset: 12 }).setHTML(
                `<strong>${person.name}</strong><br/>${person.location}`,
              ),
            )
            .addTo(map)

          // Dashed line to meetup
          map.addSource(`line-${i}`, {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: [
                  [person.longitude, person.latitude],
                  [meetupLng, meetupLat],
                ],
              },
            },
          })

          map.addLayer({
            id: `line-${i}`,
            type: 'line',
            source: `line-${i}`,
            paint: {
              'line-color': '#a855f7',
              'line-width': 1.5,
              'line-dasharray': [2, 2],
              'line-opacity': 0.5,
            },
          })
        })

        // Star meetup marker
        const starEl = document.createElement('div')
        starEl.innerHTML = '⭐'
        starEl.style.fontSize = '20px'
        new mapboxgl.default.Marker({ element: starEl })
          .setLngLat([meetupLng, meetupLat])
          .setPopup(
            new mapboxgl.default.Popup({ offset: 12 }).setHTML(
              `<strong>Meet at ${suggestedArea}</strong>`,
            ),
          )
          .addTo(map)

        // Restaurant markers
        restaurants.forEach((r, i) => {
          const lng = r.longitude ?? meetupLng + (i - 1) * 0.008
          const lat = r.latitude ?? meetupLat + (i - 1) * 0.004

          const el = document.createElement('div')
          el.style.cssText =
            'width:24px;height:24px;border-radius:50%;background:#f97316;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:bold;'
          el.textContent = String(i + 1)

          new mapboxgl.default.Marker({ element: el })
            .setLngLat([lng, lat])
            .setPopup(
              new mapboxgl.default.Popup({ offset: 12 }).setHTML(
                `<strong>${r.name}</strong><br/>${r.match_score}% match`,
              ),
            )
            .addTo(map)
        })
      })
    })

    return () => {
      if (map) map.remove()
      mapRef.current = null
    }
  }, [persons, suggestedArea, restaurants, midpoint])

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-full min-h-[300px] bg-surface-raised flex items-center justify-center text-text-secondary text-xs p-4 text-center">
        Set NEXT_PUBLIC_MAPBOX_TOKEN to enable map
      </div>
    )
  }

  return (
    <div
      ref={mapContainer}
      className="w-full h-full min-h-[300px]"
    />
  )
}
