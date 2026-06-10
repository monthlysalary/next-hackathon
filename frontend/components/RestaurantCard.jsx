'use client'

import { useState } from 'react'
import { API_URL } from '@/lib/constants'

// Large pool of curated Unsplash food images by cuisine type
const CUISINE_IMAGE_POOL = {
  chinese: [
    'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&h=200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&h=200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=200&fit=crop&q=80',
  ],
  malay: [
    'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=400&h=200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&h=200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400&h=200&fit=crop&q=80',
  ],
  indian: [
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=200&fit=crop&q=80',
  ],
  western: [
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400&h=200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=200&fit=crop&q=80',
  ],
  japanese: [
    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&h=200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400&h=200&fit=crop&q=80',
  ],
  korean: [
    'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&h=200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400&h=200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1583224994076-1b2e5980c014?w=400&h=200&fit=crop&q=80',
  ],
  thai: [
    'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&h=200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=400&h=200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=200&fit=crop&q=80',
  ],
  hawker: [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=200&fit=crop&q=80',
  ],
  vegetarian: [
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1540914124281-342587941389?w=400&h=200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=400&h=200&fit=crop&q=80',
  ],
  seafood: [
    'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=400&h=200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=400&h=200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1448043552756-e747b7a2b2b8?w=400&h=200&fit=crop&q=80',
  ],
  cafe: [
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=200&fit=crop&q=80',
  ],
  default: [
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=200&fit=crop&q=80',
    'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=400&h=200&fit=crop&q=80',
  ],
}

function getCuisineImage(cuisine, rank = 0) {
  const lower = (cuisine || '').toLowerCase()
  let pool = CUISINE_IMAGE_POOL.default

  for (const [key, images] of Object.entries(CUISINE_IMAGE_POOL)) {
    if (lower.includes(key)) {
      pool = images
      break
    }
  }

  if (lower.includes('nasi') || lower.includes('padang')) pool = CUISINE_IMAGE_POOL.malay
  else if (lower.includes('south indian') || lower.includes('north indian')) pool = CUISINE_IMAGE_POOL.indian
  else if (lower.includes('mixed') || lower.includes('food centre')) pool = CUISINE_IMAGE_POOL.hawker
  else if (lower.includes('cafe') || lower.includes('coffee') || lower.includes('brunch')) pool = CUISINE_IMAGE_POOL.cafe
  else if (lower.includes('bar') || lower.includes('pub')) pool = CUISINE_IMAGE_POOL.cafe

  return pool[rank % pool.length]
}

const DIETARY_KEYWORDS = [
  'halal', 'vegetarian', 'vegan', 'no pork', 'no beef', 'no shellfish', 'no nuts', 'no dairy',
]
const AMENITY_KEYWORDS = [
  'aircon', 'outdoor', 'big tables', 'quiet', 'lively', 'parking', 'wheelchair',
]
const PAYMENT_KEYWORDS = ['card', 'paynow', 'cash']

function tagColor(tag) {
  const t = tag.toLowerCase()
  if (DIETARY_KEYWORDS.some((k) => t.includes(k))) return 'bg-green-50 text-green-700 border-green-200'
  if (AMENITY_KEYWORDS.some((k) => t.includes(k))) return 'bg-blue-50 text-blue-700 border-blue-200'
  if (PAYMENT_KEYWORDS.some((k) => t.includes(k))) return 'bg-surface-raised text-tag-text border-border'
  if (t.includes('deal') || t.includes('student')) return 'bg-orange-50 text-orange-700 border-orange-200'
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
  groupSize = 2,
}) {
  const [saving, setSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(saved)
  const [imgError, setImgError] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuData, setMenuData] = useState(null)
  const [menuLoading, setMenuLoading] = useState(false)

  const imageUrl = (restaurant.photo_url && !imgError)
    ? restaurant.photo_url
    : getCuisineImage(restaurant.cuisine)

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

  const handleViewMenu = async () => {
    if (menuData) {
      setMenuOpen(!menuOpen)
      return
    }

    setMenuLoading(true)
    setMenuOpen(true)
    try {
      const res = await fetch(
        `${API_URL}/menu/${encodeURIComponent(restaurant.name)}`,
      )
      if (res.ok) {
        const data = await res.json()
        setMenuData(data)
      } else {
        setMenuData({ menu_items: ['No menu found for this restaurant.'], note: '' })
      }
    } catch {
      setMenuData({ menu_items: ['No menu found for this restaurant.'], note: '' })
    } finally {
      setMenuLoading(false)
    }
  }

  const scoreColor =
    restaurant.match_score >= 85
      ? 'bg-green-50 text-green-700'
      : restaurant.match_score >= 75
        ? 'bg-orange-50 text-accent'
        : 'bg-surface-raised text-text-secondary'

  return (
    <div
      className={`bg-white border rounded-[20px] overflow-hidden shadow-card ${
        isWinner ? 'border-purple-300 ring-2 ring-purple-100' : 'border-border'
      }`}
    >
      {/* Photo / Header image */}
      <div className="relative h-[120px] overflow-hidden">
        <img
          src={imageUrl}
          alt={restaurant.name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
        <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-accent text-white text-sm font-bold flex items-center justify-center shadow-lg">
          {rank}
        </div>
        <div
          className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold ${scoreColor} shadow-sm`}
        >
          {restaurant.match_score}%
        </div>
        {isWinner && voteCount > 0 && (
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded-full bg-purple-600 text-white text-[10px] font-bold shadow-lg">
            👑 {voteCount} votes
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-1">
          {restaurant.name}
        </h3>
        <p className="text-[12px] text-text-secondary mb-2">
          {restaurant.cuisine} · {restaurant.price_range}
        </p>

        {restaurant.opening_hours && (
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[11px]">🕐</span>
            <span className="text-[11px] text-text-secondary">
              {restaurant.opening_hours}
            </span>
          </div>
        )}

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

        <p className="text-[12px] text-text-primary leading-relaxed mb-2.5">
          {restaurant.summary}
        </p>

        <div className="bg-surface-raised rounded-[14px] p-3 mb-3">
          <p className="text-[10px] text-text-secondary mb-0.5 font-medium uppercase tracking-wider">
            Why your group
          </p>
          <p className="text-[12px] text-text-primary leading-relaxed">
            {restaurant.why_this_group}
          </p>
        </div>

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
          {restaurant.reservation_url && (
            <a
              href={restaurant.reservation_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center py-2.5 rounded-[14px] border border-accent/30 bg-accent-light text-[12px] font-medium text-accent hover:bg-accent/10 transition-colors"
            >
              Reserve
            </a>
          )}
          <button
            type="button"
            onClick={handleViewMenu}
            className="flex-1 py-2.5 rounded-[14px] text-[12px] font-medium transition-colors border border-border text-text-secondary hover:text-accent hover:border-accent"
          >
            {menuLoading ? '...' : 'Menu'}
          </button>
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

        {/* Menu panel */}
        {menuOpen && (
          <div className="mt-3 bg-purple-50 border border-purple-200 rounded-[14px] p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">
                📋 Menu
              </h4>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="text-[10px] text-purple-400 hover:text-purple-600"
              >
                ✕
              </button>
            </div>
            {menuLoading ? (
              <p className="text-[11px] text-purple-500 animate-pulse">Loading menu...</p>
            ) : menuData ? (
              <>
                <ul className="space-y-1 mb-2">
                  {menuData.menu_items.map((item, i) => (
                    <li key={i} className="text-[11px] text-text-primary leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
                {menuData.note && (
                  <p className="text-[10px] text-purple-500 italic">{menuData.note}</p>
                )}
                {menuData.source_url && (
                  <a
                    href={menuData.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-purple-600 hover:underline mt-1 inline-block"
                  >
                    View full menu →
                  </a>
                )}
              </>
            ) : null}
          </div>
        )}

        {/* Cost splitting estimate */}
        {restaurant.price_range && groupSize > 1 && (
          <div className="mt-3 bg-green-50 border border-green-200 rounded-[14px] px-3 py-2.5">
            <p className="text-[10px] text-green-700 font-medium mb-1">💰 Estimated cost split</p>
            <p className="text-[11px] text-green-800">
              {(() => {
                // Parse price range like "S$8–14 per pax" or "S$10-20"
                const match = restaurant.price_range.match(/\$(\d+)[–\-](\d+)/)
                if (match) {
                  const low = parseInt(match[1])
                  const high = parseInt(match[2])
                  const avgPerPax = (low + high) / 2
                  const totalLow = low * groupSize
                  const totalHigh = high * groupSize
                  return `~S$${totalLow}–${totalHigh} total for ${groupSize} people (~S$${avgPerPax.toFixed(0)}/person)`
                }
                return `${restaurant.price_range} × ${groupSize} people`
              })()}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
