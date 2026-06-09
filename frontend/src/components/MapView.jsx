import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''

export default function MapView({ persons, suggestedArea, restaurants, midpoint }) {
  const mapContainer = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return

    mapboxgl.accessToken = MAPBOX_TOKEN

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [103.8198, 1.3521],
      zoom: 11,
    })

    mapRef.current = map

    map.on('load', () => {
      const meetupLng = midpoint?.longitude ?? 103.848
      const meetupLat = midpoint?.latitude ?? 1.352

      persons.forEach((person, i) => {
        if (!person.latitude || !person.longitude) return

        const el = document.createElement('div')
        el.className =
          'w-4 h-4 rounded-full bg-purple-500 border-2 border-white shadow-lg'
        el.title = person.name

        new mapboxgl.Marker({ element: el })
          .setLngLat([person.longitude, person.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 12 }).setHTML(
              `<strong>${person.name}</strong><br/>${person.location}`,
            ),
          )
          .addTo(map)

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
            'line-width': 2,
            'line-dasharray': [2, 2],
            'line-opacity': 0.6,
          },
        })
      })

      const starEl = document.createElement('div')
      starEl.innerHTML = '⭐'
      starEl.style.fontSize = '24px'
      new mapboxgl.Marker({ element: starEl })
        .setLngLat([meetupLng, meetupLat])
        .setPopup(
          new mapboxgl.Popup({ offset: 12 }).setHTML(
            `<strong>Meet at ${suggestedArea}</strong>`,
          ),
        )
        .addTo(map)

      restaurants.forEach((r, i) => {
        const lng = r.longitude ?? meetupLng + (i - 1) * 0.01
        const lat = r.latitude ?? meetupLat + (i - 1) * 0.005

        const el = document.createElement('div')
        el.className =
          'w-7 h-7 rounded-full bg-accent border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold'
        el.textContent = String(i + 1)

        new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 12 }).setHTML(
              `<strong>${r.name}</strong><br/>${r.match_score}% match`,
            ),
          )
          .addTo(map)
      })
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [persons, suggestedArea, restaurants, midpoint])

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-full min-h-[400px] bg-surface-raised rounded-xl border border-border flex items-center justify-center text-text-secondary text-sm p-4 text-center">
        Add VITE_MAPBOX_TOKEN to enable the map
      </div>
    )
  }

  return (
    <div
      ref={mapContainer}
      className="w-full h-full min-h-[400px] rounded-xl overflow-hidden border border-border"
    />
  )
}
