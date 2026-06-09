import RestaurantCard from './RestaurantCard'
import MapView from './MapView'

export default function ResultsPanel({
  result,
  persons,
  onStartOver,
  savedRestaurants,
  onRestaurantSaved,
}) {
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-text-primary">TableFor</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:text-accent hover:border-accent transition-colors"
          >
            Share session
          </button>
          <button
            type="button"
            onClick={onStartOver}
            className="px-4 py-2 text-sm bg-surface-raised border border-border rounded-lg text-text-secondary hover:text-text-primary transition-colors"
          >
            Start over
          </button>
        </div>
      </div>

      <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 mb-6">
        <h2 className="text-lg font-semibold text-accent mb-1">
          Meet at {result.suggested_area}
        </h2>
        <p className="text-sm text-text-primary mb-3">{result.area_reason}</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(result.travel_summary || {}).map(([name, time]) => (
            <span
              key={name}
              className="px-3 py-1 rounded-full bg-surface text-xs text-text-secondary border border-border"
            >
              <span className="text-text-primary font-medium">{name}</span> · {time}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
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
        <div className="lg:col-span-2 lg:sticky lg:top-4 lg:self-start">
          <MapView
            persons={persons}
            suggestedArea={result.suggested_area}
            restaurants={result.restaurants}
            midpoint={midpoint}
          />
        </div>
      </div>
    </div>
  )
}
