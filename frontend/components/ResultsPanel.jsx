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
  onRefine,
  loading,
  votes,
  voters,
  voterName,
  setVoterName,
  onVote,
}) {
  const [showMap, setShowMap] = useState(false)
  const [refineInput, setRefineInput] = useState('')
  const [showVoterInput, setShowVoterInput] = useState(!voterName)
  const [copied, setCopied] = useState(false)

  const handleShare = () => {
    const url = new URL(window.location.origin)
    url.searchParams.set('session', result.session_id)
    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleRefineSubmit = (e) => {
    e.preventDefault()
    if (!refineInput.trim() || loading) return
    onRefine(refineInput.trim())
    setRefineInput('')
  }

  const handleSetVoter = (e) => {
    e.preventDefault()
    if (voterName.trim()) {
      setShowVoterInput(false)
    }
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

  // Calculate vote winner
  const voteEntries = Object.entries(votes || {})
  const maxVotes = voteEntries.reduce(
    (max, [, v]) => Math.max(max, (v || []).length),
    0,
  )

  return (
    <div className="px-4 py-4 pb-8 md:px-6 lg:px-8">
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
            <span
              key={name}
              className="px-2 py-0.5 rounded-full bg-white text-[10px] text-text-secondary border border-border"
            >
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
            <button
              type="button"
              onClick={() => setShowVoterInput(true)}
              className="text-[10px] text-purple-600 hover:text-purple-800"
            >
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
            <button
              type="submit"
              disabled={!voterName.trim()}
              className="px-3 py-2 rounded-[12px] text-xs font-medium bg-purple-600 text-white disabled:opacity-40"
            >
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
                <div
                  key={r.name}
                  className={`flex items-center gap-2 p-2 rounded-[12px] transition-colors ${
                    myVote
                      ? 'bg-purple-100 border border-purple-300'
                      : 'bg-white border border-purple-100'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onVote(r.name)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      myVote
                        ? 'border-purple-600 bg-purple-600'
                        : 'border-purple-300'
                    }`}
                  >
                    {myVote && (
                      <span className="text-white text-[10px]">✓</span>
                    )}
                  </button>
                  <span className="text-[11px] text-text-primary flex-1 truncate">
                    {r.name}
                  </span>
                  <div className="flex items-center gap-1">
                    {isWinner && <span className="text-[10px]">👑</span>}
                    <span className="text-[10px] font-medium text-purple-700">
                      {rVotes.length}
                    </span>
                  </div>
                </div>
              )
            })}
            {voters.length > 0 && (
              <p className="text-[10px] text-purple-500 pt-1">
                Voters: {voters.join(', ')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Map or cards */}
      {showMap ? (
        <div className="mb-4 h-[400px] overflow-hidden rounded-[20px] border border-border shadow-card lg:h-[520px]">
          <MapView
            persons={persons}
            suggestedArea={result.suggested_area}
            restaurants={result.restaurants}
            midpoint={midpoint}
          />
        </div>
      ) : (
        <div className="mb-4 space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {result.restaurants.map((r, i) => (
            <RestaurantCard
              key={r.name}
              restaurant={r}
              rank={i + 1}
              sessionId={result.session_id}
              saved={savedRestaurants?.includes(r.name)}
              onSaved={onRestaurantSaved}
              voteCount={(votes[r.name] || []).length}
              isWinner={
                (votes[r.name] || []).length === maxVotes && maxVotes > 0
              }
            />
          ))}
        </div>
      )}

      {/* Refine / Chat input */}
      <div className="sticky bottom-0 bg-white/90 backdrop-blur pt-2 pb-1">
        <form onSubmit={handleRefineSubmit} className="flex gap-2">
          <input
            type="text"
            value={refineInput}
            onChange={(e) => setRefineInput(e.target.value)}
            placeholder="Quieter options? Cheaper? Tell me..."
            disabled={loading}
            className="flex-1 px-3.5 py-3 rounded-[16px] text-xs bg-white border border-border outline-none focus:border-accent shadow-card placeholder:text-text-secondary/60"
          />
          <button
            type="submit"
            disabled={!refineInput.trim() || loading}
            className="px-4 py-3 rounded-[16px] bg-accent hover:bg-accent-hover text-white text-xs font-medium disabled:opacity-40 transition-colors shadow-card"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
            ) : (
              '→'
            )}
          </button>
        </form>
        <p className="text-[10px] text-text-secondary text-center mt-1.5">
          Type adjustments to get new recommendations
        </p>
      </div>
    </div>
  )
}
