'use client'

import RestaurantCard from './RestaurantCard'
import MapView from './MapView'
import { useState } from 'react'

export default function ResultsPanel({
  result,
  persons,
  onStartOver,
  savedRestaurants,
  onRestaurantSaved,
}) {
  const [showMap, setShowMap] = useState(false)

  const handleShare = () => {
    const url = new URL(window.location.href)
    url.searchParams.set('session', result.session_id)
    navigator.clipboard.writeText(url.toString())
  }

  const withCoords = persons.filter((p) => p.latitude && p.longitude)
  const midpoint =
    withCoords.length > 0
      ? {
          latitude:
            withCoords.reduce((s, p) => s + p.latitude, 0) / withCoords.length,
          longitude:
            withCoords.reduce((s, p) => s + p.longitude, 0) / withCoords.length,
        }
      : { latitude: 1.352, longitude: 103.848 }

  return (
    <div className="px-4 py-4 pb-8">
      {/* Top actions */}
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={onStartOver}
          className="px-3 py-1.5 text-[10px] bg-surface-raised border border-border rounded-xl text-text-secondary hover:text-text-primary transition-colors"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={() => setShowMap(!showMap)}
          className="px-3 py-1.5 text-[10px] border border-border rounded-xl text-text-secondary hover:text-accent hover:border-accent transition-colors"
        >
          {showMap ? '📋 List' : '🗺️ Map'}
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="ml-auto px-3 py-1.5 text-[10px] border border-border rounded-xl text-text-secondary hover:text-accent hover:border-accent transition-colors"
        >
          Share
        </button>
      </div>

      {/* Meetup banner */}
      <div className="bg-accent/10 border border-accent/30 rounded-2xl p-3 mb-4">
        <h2 className="text-sm font-semibold text-accent mb-0.5">
          Meet at {result.suggested_area}
        </h2>
        <p className="text-[11px] text-text-primary leading-relaxed mb-2">
          {result.area_reason}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(result.travel_summary || {}).map(([name, time]) => (
            <span
              key={name}
              className="px-2 py-0.5 rounded-full bg-surface text-[10px] text-text-secondary border border-border"
            >
              <span className="text-text-primary font-medium">{name}</span> · {time}
            </span>
          ))}
        </div>
      </div>

      {/* Map or cards */}
      {showMap ? (
        <div className="h-[400px] rounded-2xl overflow-hidden border border-border">
          <MapView
            persons={persons}
            suggestedArea={result.suggested_area}
            restaurants={result.restaurants}
            midpoint={midpoint}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {result.restaurants.map((r, i) => (
            <RestaurantCard
              key={r.name}
              restaurant={r}
              rank={i + 1}
              sessionId={result.session_id}
              saved={savedRestaurants?.includes(r.name)}
              onSaved={onRestaurantSaved}
            />
          ))}
        </div>
      )}
    </div>
  )
}
