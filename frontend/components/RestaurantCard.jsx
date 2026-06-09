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
    return 'bg-green-50 text-green-700 border-green-200'
  }
  if (AMENITY_KEYWORDS.some((k) => t.includes(k))) {
    return 'bg-blue-50 text-blue-700 border-blue-200'
  }
  if (PAYMENT_KEYWORDS.some((k) => t.includes(k))) {
    return 'bg-surface-raised text-tag-text border-border'
  }
  if (t.includes('deal') || t.includes('student')) {
    return 'bg-orange-50 text-orange-700 border-orange-200'
  }
  return 'bg-surface-raised text-tag-text border-border'
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
      ? 'bg-green-50 text-green-700'
      : restaurant.match_score >= 75
        ? 'bg-orange-50 text-accent'
        : 'bg-surface-raised text-text-secondary'

  return (
    <div className="bg-white border border-border rounded-[20px] p-4 shadow-card">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-accent text-white text-[11px] font-bold flex items-center justify-center">
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
      <p className="text-[12px] text-text-secondary mb-2">
        {restaurant.cuisine} · {restaurant.price_range}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        {restaurant.tags?.slice(0, 5).map((tag) => (
          <span
            key={tag}
            className={`px-2 py-0.5 rounded-full text-[10px] border ${tagColor(tag)}`}
          >
            {tag}
          </span>
        ))}
        {restaurant.tags?.length > 5 && (
          <span className="px-2 py-0.5 rounded-full text-[10px] text-text-secondary">
            +{restaurant.tags.length - 5}
          </span>
        )}
      </div>

      {/* Summary */}
      <p className="text-[12px] text-text-primary leading-relaxed mb-2.5">
        {restaurant.summary}
      </p>

      {/* Why this group */}
      <div className="bg-surface-raised rounded-[14px] p-3 mb-3">
        <p className="text-[10px] text-text-secondary mb-0.5 font-medium uppercase tracking-wider">
          Why your group
        </p>
        <p className="text-[12px] text-text-primary leading-relaxed">
          {restaurant.why_this_group}
        </p>
      </div>

      {/* Deal */}
      {restaurant.deal && (
        <div className="bg-orange-50 border border-orange-200 rounded-[14px] px-3 py-2 mb-3 text-[12px] text-accent">
          🏷️ {restaurant.deal}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <a
          href={restaurant.maps_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center py-2.5 rounded-[14px] border border-border text-[12px] text-text-primary hover:border-accent hover:text-accent transition-colors"
        >
          Maps
        </a>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaved || saving}
          className={`flex-1 py-2.5 rounded-[14px] text-[12px] font-medium transition-colors ${
            isSaved
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-accent hover:bg-accent-hover text-white'
          }`}
        >
          {isSaved ? 'Saved ✓' : saving ? '...' : 'Save'}
        </button>
      </div>
    </div>
  )
}
