'use client'

import { useState } from 'react'
import { API_URL } from '@/lib/constants'

// Curated Unsplash food images by cuisine type (direct CDN links, no API key needed)
const CUISINE_IMAGES = {
  chinese: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&h=200&fit=crop&q=80',
  malay: 'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=400&h=200&fit=crop&q=80',
  indian: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=200&fit=crop&q=80',
  western: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=200&fit=crop&q=80',
  japanese: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=200&fit=crop&q=80',
  korean: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&h=200&fit=crop&q=80',
  thai: 'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=400&h=200&fit=crop&q=80',
  hawker: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=200&fit=crop&q=80',
  vegetarian: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=200&fit=crop&q=80',
  seafood: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=400&h=200&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=200&fit=crop&q=80',
}

function getCuisineImage(cuisine) {
  if (!cuisine) return CUISINE_IMAGES.default
  const lower = cuisine.toLowerCase()
  for (const [key, url] of Object.entries(CUISINE_IMAGES)) {
    if (lower.includes(key)) return url
  }
  // Check for nasi padang / malay variants
  if (lower.includes('nasi') || lower.includes('padang')) return CUISINE_IMAGES.malay
  if (lower.includes('south indian') || lower.includes('north indian')) return CUISINE_IMAGES.indian
  if (lower.includes('mixed') || lower.includes('food centre')) return CUISINE_IMAGES.hawker
  return CUISINE_IMAGES.default
}

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
  isPro = false,
  onUpgrade,
}) {
  const [saving, setSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(saved)
  const [imgError, setImgError] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuData, setMenuData] = useState(null)
  const [menuLoading, setMenuLoading] = useState(false)

  // Determine best image: use photo_url if provided, otherwise cuisine-based Unsplash image
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
    if (!isPro) {
      onUpgrade?.()
      return
    }
    if (menuData) {
      setMenuOpen(!menuOpen)
      return
    }

    // Hardcoded menus for demo restaurants (works offline)
    const DEMO_MENUS = {
      'Hjh Maimunah Restaurant': {
        restaurant_name: 'Hjh Maimunah Restaurant',
        menu_items: [
          'Nasi Padang (rice + 2 dishes) — S$6.50',
          'Beef Rendang — S$6.00',
          'Ayam Goreng Berempah — S$5.50',
          'Sambal Goreng Pengantin — S$5.00',
          'Sayur Lodeh (vegetable curry) — S$3.50',
          'Ikan Bakar (grilled fish) — S$7.00',
          'Lontong — S$5.50',
          'Tahu Goreng — S$3.00',
          'Mee Rebus — S$5.00',
          'Kueh Lapis — S$2.50',
        ],
        source_url: 'https://www.google.com/maps/place/Hjh+Maimunah',
        note: 'Prices as of 2025. Subject to change.',
      },
      'Komala Vilas': {
        restaurant_name: 'Komala Vilas',
        menu_items: [
          'Masala Thosai — S$5.50',
          'Plain Thosai — S$3.50',
          'Banana Leaf Rice (weekday lunch) — S$8.90',
          'Vegetable Biryani — S$7.50',
          'Idli (3 pcs) — S$4.00',
          'Vadai (2 pcs) — S$3.50',
          'Puri Set — S$5.50',
          'Chappathi Set — S$6.00',
          'Mango Lassi — S$3.50',
          'Filter Coffee — S$2.00',
        ],
        source_url: 'https://www.google.com/maps/place/Komala+Vilas',
        note: 'Prices as of 2025. 10% off with student ID.',
      },
      'Bishan North Food Centre': {
        restaurant_name: 'Bishan North Food Centre',
        menu_items: [
          'Chicken Rice — S$3.50–4.50',
          'Nasi Lemak — S$3.00–5.00',
          'Wanton Mee — S$4.00',
          'Roti Prata (plain) — S$1.50',
          'Fish Soup Bee Hoon — S$5.00',
          'Yong Tau Foo (5 pcs) — S$4.50',
          'Mee Goreng — S$4.00',
          'Ice Kachang — S$2.50',
          'Teh Tarik — S$1.50',
          'Bandung — S$1.50',
        ],
        source_url: 'https://www.google.com/maps/place/Bishan+North+Food+Centre',
        note: 'Prices vary by stall. Hawker centre with 40+ stalls.',
      },
    }

    const demoMenu = DEMO_MENUS[restaurant.name]
    if (demoMenu) {
      setMenuData(demoMenu)
      setMenuOpen(true)
      return
    }

    // Real API call for non-demo restaurants
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
        setMenuData({ menu_items: ['Menu not available for this restaurant.'], note: '' })
      }
    } catch {
      setMenuData({ menu_items: ['Failed to load menu. Try again later.'], note: '' })
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
            onClick={handleViewMenu}
            className={`flex-1 py-2.5 rounded-[14px] text-[12px] font-medium transition-colors border ${
              isPro
                ? 'border-purple-200 text-purple-700 hover:bg-purple-50'
                : 'border-purple-200 text-purple-400 bg-purple-50/50'
            }`}
          >
            {!isPro && '🔒 '}
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

        {/* Menu panel (Pro feature) */}
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
      </div>
    </div>
  )
}
