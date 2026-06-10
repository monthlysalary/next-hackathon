'use client'

import RestaurantCard from './RestaurantCard'
import MapView from './MapView'
import { useState, useRef, useEffect } from 'react'

// Individual AI-recommended restaurant card (square, scrollable inline in chat)
function AIRestaurantCard({ restaurant: r, onAdd }) {
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    setAdded(true)
    onAdd && onAdd(r)
  }

  return (
    <div
      className="relative flex-shrink-0 snap-start rounded-[18px] bg-white border border-gray-200 overflow-hidden"
      style={{ width: 148, minWidth: 148 }}
    >
      <div className="p-3 pb-10">
        <p className="text-[13px] font-semibold text-gray-900 leading-tight mb-1 line-clamp-2">{r.name}</p>
        <p className="text-[11px] text-gray-500 line-clamp-1">{r.cuisine_type || r.cuisine}</p>
        {r.price_range && (
          <p className="text-[11px] text-orange-500 mt-0.5">{r.price_range}</p>
        )}
        {r.distance_note && (
          <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">{r.distance_note}</p>
        )}
      </div>
      <button
        onClick={handleAdd}
        className={`absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-base font-bold shadow-sm transition-all ${
          added ? 'bg-green-500 scale-90' : 'bg-orange-500 active:bg-orange-600'
        }`}
      >
        {added ? '✓' : '+'}
      </button>
    </div>
  )
}

// ── AI Chat Drawer ────────────────────────────────────────────────
// Uses absolute positioning so it stays within the phone frame,
// not fixed to the browser viewport.
function AIChatDrawer({ open, onClose, onRefine, loading, onAddRestaurant, newRestaurants }) {
  const [input, setInput] = useState('')
  // messages: { role: 'user'|'assistant'|'cards', text?, cards? }
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "What's on your mind? Tell me what you're craving and I'll find something that hits." }
  ])
  const touchStartY = useRef(null)
  const messagesEndRef = useRef(null)
  const prevLoadingRef = useRef(false)

  // When loading finishes and we have new restaurants, append them as a 'cards' message
  useEffect(() => {
    if (prevLoadingRef.current && !loading && newRestaurants && newRestaurants.length > 0) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: "Here's what I found for you:" },
        { role: 'cards', cards: newRestaurants }
      ])
    }
    prevLoadingRef.current = loading
  }, [loading, newRestaurants])

  // Scroll to bottom when messages update
  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const handleSend = () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    onRefine(userMsg)
  }

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY
  }
  const handleTouchEnd = (e) => {
    if (touchStartY.current === null) return
    const delta = e.changedTouches[0].clientY - touchStartY.current
    if (delta > 60) onClose()
    touchStartY.current = null
  }

  return (
    <>
      {/* Backdrop — absolute, fills the phone inner area */}
      {open && (
        <div
          className="absolute inset-0 bg-black/30 z-40"
          onClick={onClose}
        />
      )}

      {/* Drawer — absolute, slides up from bottom of phone frame */}
      <div
        className="absolute bottom-0 left-0 right-0 z-50 bg-white rounded-t-[24px] shadow-2xl flex flex-col transition-transform duration-300 ease-out"
        style={{
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          maxHeight: '78%',
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-9 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="px-4 pb-2 flex-shrink-0">
          <h3 className="text-[13px] font-semibold text-gray-800">
            Chat with your food guide ✨
          </h3>
        </div>

        {/* Conversation */}
        <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-2">
          {messages.map((msg, i) => {
            if (msg.role === 'cards') {
              return (
                <div key={i} className="py-1">
                  <p className="text-[10px] text-gray-400 mb-2">Tap + to add to your list</p>
                  <div
                    className="flex gap-2.5 overflow-x-auto pb-1 snap-x snap-mandatory"
                    style={{ scrollbarWidth: 'none' }}
                  >
                    {msg.cards.map((r) => (
                      <AIRestaurantCard
                        key={r.name}
                        restaurant={r}
                        onAdd={onAddRestaurant}
                      />
                    ))}
                  </div>
                </div>
              )
            }
            return (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-[18px] text-[12px] leading-snug ${
                    msg.role === 'user'
                      ? 'bg-orange-500 text-white rounded-br-[4px]'
                      : 'bg-gray-100 text-gray-700 rounded-bl-[4px]'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            )
          })}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-2.5 rounded-[18px] rounded-bl-[4px]">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="e.g. something quieter, under $30…"
            disabled={loading}
            className="flex-1 px-3.5 py-2.5 rounded-[14px] text-[12px] bg-gray-100 border-0 outline-none placeholder:text-gray-400"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 rounded-[14px] bg-orange-500 text-white text-sm font-medium disabled:opacity-40 transition-opacity"
          >
            →
          </button>
        </div>
      </div>
    </>
  )
}

// ── Main ResultsPanel ─────────────────────────────────────────────
export default function ResultsPanel({
  result,
  persons,
  onStartOver,
  savedRestaurants,
  onRestaurantSaved,
  onRefine,
  loading,
  aiSuggestions = [],
  votes,
  voters,
  voterName,
  setVoterName,
  onVote,
}) {
  const [showMap, setShowMap] = useState(false)
  const [showVoterInput, setShowVoterInput] = useState(!voterName)
  const [copied, setCopied] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  // Track extra restaurants added via the AI drawer's + button
  const [extraRestaurants, setExtraRestaurants] = useState([])

  const handleShare = () => {
    const url = new URL(window.location.origin)
    url.searchParams.set('session', result.session_id)
    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleSetVoter = (e) => {
    e.preventDefault()
    if (voterName.trim()) setShowVoterInput(false)
  }

  // When user taps + on an AI card, add to the main list (no duplicates)
  const handleAddRestaurant = (r) => {
    setExtraRestaurants(prev =>
      prev.find(x => x.name === r.name) ? prev : [...prev, r]
    )
  }

  const withCoords = persons.filter((p) => p.latitude && p.longitude)
  const midpoint =
    withCoords.length > 0
      ? {
          latitude: withCoords.reduce((s, p) => s + p.latitude, 0) / withCoords.length,
          longitude: withCoords.reduce((s, p) => s + p.longitude, 0) / withCoords.length,
        }
      : { latitude: 1.352, longitude: 103.848 }

  const voteEntries = Object.entries(votes || {})
  const maxVotes = voteEntries.reduce((max, [, v]) => Math.max(max, (v || []).length), 0)

  // All restaurants shown in main list = original + user-added extras
  const allRestaurants = [...result.restaurants, ...extraRestaurants]

  return (
    // relative so the absolute-positioned drawer is contained here
    <div className="relative h-full flex flex-col overflow-hidden">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-16">
        {/* Top actions */}
        <div className="flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={onStartOver}
            className="px-3 py-1.5 text-[11px] bg-white border border-border rounded-[14px] text-text-secondary hover:text-text-primary transition-colors shadow-card"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className="px-3 py-1.5 text-[11px] border border-border rounded-[14px] text-text-secondary hover:text-accent hover:border-accent transition-colors bg-white shadow-card"
          >
            {showMap ? '📋 List' : '🗺️ Map'}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className={`ml-auto px-3 py-1.5 text-[11px] border rounded-[14px] transition-colors bg-white shadow-card ${
              copied
                ? 'border-green-400 text-green-600'
                : 'border-border text-text-secondary hover:text-accent hover:border-accent'
            }`}
          >
            {copied ? '✓ Link copied!' : '📤 Share & Vote'}
          </button>
        </div>

        {/* Meetup banner */}
        <div className="bg-orange-50 border border-orange-200 rounded-[20px] p-3.5 mb-4">
          <h2 className="text-sm font-semibold text-accent mb-0.5">
            Meet at {result.suggested_area}
          </h2>
          <p className="text-[12px] text-text-primary leading-relaxed mb-2">
            {result.area_reason}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(result.travel_summary || {}).map(([name, time]) => (
              <span key={name} className="px-2 py-0.5 rounded-full bg-white text-[10px] text-text-secondary border border-border">
                <span className="text-text-primary font-medium">{name}</span> · {time}
              </span>
            ))}
          </div>
        </div>

        {/* Voting section */}
        <div className="bg-purple-50 border border-purple-200 rounded-[20px] p-3.5 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-purple-700">
              🗳️ Group Vote {voters.length > 0 && `(${voters.length} voted)`}
            </h3>
            {!showVoterInput && voterName && (
              <button type="button" onClick={() => setShowVoterInput(true)} className="text-[10px] text-purple-600 hover:text-purple-800">
                Voting as: {voterName} ✎
              </button>
            )}
          </div>
          {showVoterInput ? (
            <form onSubmit={handleSetVoter} className="flex gap-2">
              <input
                type="text"
                value={voterName}
                onChange={(e) => setVoterName(e.target.value)}
                placeholder="Enter your name to vote"
                className="flex-1 px-3 py-2 rounded-[12px] text-xs bg-white border border-purple-200 outline-none focus:border-purple-400"
              />
              <button type="submit" disabled={!voterName.trim()} className="px-3 py-2 rounded-[12px] text-xs font-medium bg-purple-600 text-white disabled:opacity-40">
                Set
              </button>
            </form>
          ) : (
            <div className="space-y-1.5">
              {result.restaurants.map((r) => {
                const rVotes = votes[r.name] || []
                const isWinner = rVotes.length === maxVotes && maxVotes > 0
                const myVote = rVotes.includes(voterName)
                return (
                  <div key={r.name} className={`flex items-center gap-2 p-2 rounded-[12px] transition-colors ${myVote ? 'bg-purple-100 border border-purple-300' : 'bg-white border border-purple-100'}`}>
                    <button type="button" onClick={() => onVote(r.name)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${myVote ? 'border-purple-600 bg-purple-600' : 'border-purple-300'}`}>
                      {myVote && <span className="text-white text-[10px]">✓</span>}
                    </button>
                    <span className="text-[11px] text-text-primary flex-1 truncate">{r.name}</span>
                    <div className="flex items-center gap-1">
                      {isWinner && <span className="text-[10px]">👑</span>}
                      <span className="text-[10px] font-medium text-purple-700">{rVotes.length}</span>
                    </div>
                  </div>
                )
              })}
              {voters.length > 0 && <p className="text-[10px] text-purple-500 pt-1">Voters: {voters.join(', ')}</p>}
            </div>
          )}
        </div>

        {/* Map or cards */}
        {showMap ? (
          <div className="h-[340px] rounded-[20px] overflow-hidden border border-border shadow-card mb-4">
            <MapView persons={persons} suggestedArea={result.suggested_area} restaurants={result.restaurants} midpoint={midpoint} />
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            {allRestaurants.map((r, i) => (
              <RestaurantCard
                key={r.name}
                restaurant={r}
                rank={i + 1}
                sessionId={result.session_id}
                saved={savedRestaurants?.includes(r.name)}
                onSaved={onRestaurantSaved}
                voteCount={(votes[r.name] || []).length}
                isWinner={(votes[r.name] || []).length === maxVotes && maxVotes > 0}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Swipe-up hint bar (fixed at bottom, only opens on tap) ── */}
      {!drawerOpen && (
        <div
          className="absolute bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] cursor-pointer select-none"
          onClick={() => setDrawerOpen(true)}
        >
          <div className="flex justify-center pt-2 pb-0.5">
            <div className="w-8 h-1 rounded-full bg-gray-300" />
          </div>
          <div className="flex items-center justify-center gap-1.5 pb-3 pt-1">
            <span className="text-[12px] text-gray-400">↑</span>
            <p className="text-[11px] text-gray-400 font-medium">Swipe up for more tailored picks</p>
            <span className="text-[12px] text-gray-400">↑</span>
          </div>
        </div>
      )}

      {/* ── AI Chat Drawer ── */}
      <AIChatDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onRefine={onRefine}
        loading={loading}
        newRestaurants={aiSuggestions}
        onAddRestaurant={handleAddRestaurant}
      />
    </div>
  )
}
