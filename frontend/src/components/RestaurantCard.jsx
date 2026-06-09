import { useState } from 'react'
import { API_URL } from '../constants'

const DIETARY_KEYWORDS = [
  'halal',
  'vegetarian',
  'vegan',
  'no pork',
  'no beef',
  'no shellfish',
  'no nuts',
  'no dairy',
]

const AMENITY_KEYWORDS = [
  'aircon',
  'outdoor',
  'big tables',
  'quiet',
  'lively',
  'parking',
  'wheelchair',
]

const PAYMENT_KEYWORDS = ['card', 'paynow', 'cash']

function tagColor(tag) {
  const t = tag.toLowerCase()
  if (DIETARY_KEYWORDS.some((k) => t.includes(k))) {
    return 'bg-green-900/50 text-green-300 border-green-700'
  }
  if (AMENITY_KEYWORDS.some((k) => t.includes(k))) {
    return 'bg-blue-900/50 text-blue-300 border-blue-700'
  }
  if (PAYMENT_KEYWORDS.some((k) => t.includes(k))) {
    return 'bg-tag-bg text-tag-text border-border'
  }
  if (t.includes('deal') || t.includes('student')) {
    return 'bg-orange-900/50 text-orange-300 border-orange-700'
  }
  return 'bg-tag-bg text-tag-text border-border'
}

export default function RestaurantCard({
  restaurant,
  rank,
  sessionId,
  saved,
  onSaved,
}) {
  const [saving, setSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(saved)

  const handleSave = async () => {
    if (isSaved || saving) return
    setSaving(true)
    try {
      await fetch(
        `${API_URL}/save/${sessionId}/${encodeURIComponent(restaurant.name)}`,
        { method: 'POST' },
      )
      setIsSaved(true)
      onSaved?.(restaurant.name)
    } catch {
      /* ignore */
    } finally {
      setSaving(false)
    }
  }

  const scoreColor =
    restaurant.match_score >= 85
      ? 'bg-success/20 text-success'
      : restaurant.match_score >= 75
        ? 'bg-accent/20 text-accent'
        : 'bg-surface-raised text-text-secondary'

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-accent text-white text-sm font-bold">
            {rank}
          </span>
          <h3 className="text-lg font-semibold text-text-primary">
            {restaurant.name}
          </h3>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${scoreColor}`}
        >
          {restaurant.match_score}% match
        </span>
      </div>

      <p className="text-sm text-text-secondary mb-3">
        {restaurant.cuisine} · {restaurant.price_range} · {restaurant.area}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {restaurant.tags?.map((tag) => (
          <span
            key={tag}
            className={`px-2 py-0.5 rounded-full text-xs border ${tagColor(tag)}`}
          >
            {tag}
          </span>
        ))}
      </div>

      <p className="text-sm text-text-primary leading-relaxed mb-3">
        {restaurant.summary}
      </p>

      <div className="bg-surface-raised border border-border rounded-lg p-3 mb-3">
        <p className="text-xs text-text-secondary mb-1 font-medium">
          Why your group
        </p>
        <p className="text-sm text-text-primary">{restaurant.why_this_group}</p>
      </div>

      {restaurant.deal && (
        <div className="bg-accent/10 border border-accent/30 rounded-lg px-3 py-2 mb-3 text-sm text-accent">
          🏷️ {restaurant.deal}
        </div>
      )}

      <div className="flex gap-2">
        <a
          href={restaurant.maps_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center py-2 rounded-lg border border-border text-sm text-text-primary hover:border-accent hover:text-accent transition-colors"
        >
          View on Maps
        </a>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaved || saving}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            isSaved
              ? 'bg-success/20 text-success border border-success/30'
              : 'bg-accent hover:bg-accent-hover text-white'
          }`}
        >
          {isSaved ? 'Saved ✓' : saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}
