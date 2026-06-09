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
  voteCount = 0,
  isWinner = false,
}) {
  const [saving, setSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(saved)
  const [imgError, setImgError] = useState(false)

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
    } catch { /* ignore */ } finally {
      setSaving(false)
    }
  }

  const scoreColor =
    restaurant.match_score >= 85
      ? 'bg-green-50 text-green-700'
      : restaurant.match_score >= 75
        ? 'bg-orange-50 text-accent'
        : 'bg-surface-raised text-text-secondary'

  // Generate a placeholder gradient for restaurants without photos
  const placeholderGradients = [
    'from-orange-200 to-amber-100',
    'from-blue-200 to-indigo-100',
    'from-green-200 to-emerald-100',
    'from-purple-200 to-pink-100',
  ]
  const gradient = placeholderGradients[(rank - 1) % placeholderGradients.length]

  return (
    <div
      className={`bg-white border rounded-[20px] overflow-hidden shadow-card ${
        isWinner ? 'border-purple-300 ring-2 ring-purple-100' : 'border-border'
      }`}
    >
      {/* Photo / Header image */}
      <div className="relative h-[120px] overflow-hidden">
        {restaurant.photo_url && !imgError ? (
          <img
            src={restaurant.photo_url}
            alt={restaurant.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
          >
            <span className="text-3xl opacity-50">🍽️</span>
          </div>
        )}
        {/* Rank badge */}
        <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-accent text-white text-sm font-bold flex items-center justify-center shadow-lg">
          {rank}
        </div>
        {/* Score badge */}
        <div
          className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold ${scoreColor} shadow-sm`}
        >
          {restaurant.match_score}%
        </div>
        {/* Vote winner badge */}
        {isWinner && voteCount > 0 && (
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded-full bg-purple-600 text-white text-[10px] font-bold shadow-lg">
            👑 {voteCount} votes
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Name */}
        <h3 className="text-sm font-semibold text-text-primary mb-1">
          {restaurant.name}
        </h3>

        {/* Meta */}
        <p className="text-[12px] text-text-secondary mb-2">
          {restaurant.cuisine} · {restaurant.price_range}
        </p>

        {/* Opening hours */}
        {restaurant.opening_hours && (
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[11px]">🕐</span>
            <span className="text-[11px] text-text-secondary">
              {restaurant.opening_hours}
            </span>
          </div>
        )}

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
    </div>
  )
}
