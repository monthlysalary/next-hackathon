'use client'

import { useState } from 'react'
import { API_URL } from '@/lib/constants'

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
    <div className="bg-surface border border-border rounded-2xl p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
            {rank}
          </span>
          <h3 className="text-sm font-semibold text-text-primary truncate">
            {restaurant.name}
          </h3>
        </div>
        <span
          className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${scoreColor}`}
        >
          {restaurant.match_score}%
        </span>
      </div>

      {/* Meta */}
      <p className="text-[11px] text-text-secondary mb-2">
        {restaurant.cuisine} · {restaurant.price_range}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-2.5">
        {restaurant.tags?.slice(0, 5).map((tag) => (
          <span
            key={tag}
            className={`px-1.5 py-0.5 rounded-full text-[9px] border ${tagColor(tag)}`}
          >
            {tag}
          </span>
        ))}
        {restaurant.tags?.length > 5 && (
          <span className="px-1.5 py-0.5 rounded-full text-[9px] text-text-secondary">
            +{restaurant.tags.length - 5}
          </span>
        )}
      </div>

      {/* Summary */}
      <p className="text-[11px] text-text-primary leading-relaxed mb-2">
        {restaurant.summary}
      </p>

      {/* Why this group */}
      <div className="bg-surface-raised border border-border rounded-xl p-2.5 mb-2.5">
        <p className="text-[9px] text-text-secondary mb-0.5 font-medium uppercase tracking-wider">
          Why your group
        </p>
        <p className="text-[11px] text-text-primary leading-relaxed">
          {restaurant.why_this_group}
        </p>
      </div>

      {/* Deal */}
      {restaurant.deal && (
        <div className="bg-accent/10 border border-accent/30 rounded-xl px-2.5 py-1.5 mb-2.5 text-[11px] text-accent">
          🏷️ {restaurant.deal}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <a
          href={restaurant.maps_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center py-2 rounded-xl border border-border text-[11px] text-text-primary hover:border-accent hover:text-accent transition-colors"
        >
          Maps
        </a>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaved || saving}
          className={`flex-1 py-2 rounded-xl text-[11px] font-medium transition-colors ${
            isSaved
              ? 'bg-success/20 text-success border border-success/30'
              : 'bg-accent hover:bg-accent-hover text-white'
          }`}
        >
          {isSaved ? 'Saved ✓' : saving ? '...' : 'Save'}
        </button>
      </div>
    </div>
  )
}
