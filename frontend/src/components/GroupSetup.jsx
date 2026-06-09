import PersonCard from './PersonCard'
import { EMPTY_PERSON, DEMO_PERSONS } from '../constants'

export default function GroupSetup({
  groupName,
  setGroupName,
  mealType,
  setMealType,
  day,
  setDay,
  persons,
  setPersons,
  onFind,
  onDemo,
  loading,
  onContinueSession,
  hasSavedSession,
}) {
  const updatePerson = (index, person) => {
    const next = [...persons]
    next[index] = person
    setPersons(next)
  }

  const addPerson = () => {
    if (persons.length < 6) {
      setPersons([...persons, { ...EMPTY_PERSON }])
    }
  }

  const removePerson = (index) => {
    setPersons(persons.filter((_, i) => i !== index))
  }

  const canFind =
    persons.length >= 2 &&
    persons.every((p) => p.name.trim() && p.location.trim())

  const mealOptions = ['Lunch', 'Dinner', 'Supper', 'Any']
  const dayOptions = ['Today', 'Tomorrow', 'This Weekend']

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-text-primary tracking-tight">
            TableFor
          </h1>
          <p className="text-text-secondary mt-1">
            Find the perfect restaurant for your whole group
          </p>
        </div>
        <div className="flex gap-2">
          {hasSavedSession && (
            <button
              type="button"
              onClick={onContinueSession}
              className="px-4 py-2 text-sm border border-border rounded-lg text-text-secondary hover:text-text-primary hover:border-accent transition-colors"
            >
              Continue last session
            </button>
          )}
          <button
            type="button"
            onClick={onDemo}
            className="px-4 py-2 text-sm bg-surface-raised border border-border rounded-lg text-accent hover:bg-border transition-colors"
          >
            Try demo
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm text-text-secondary mb-2">
            Occasion name
          </label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Our Group"
            className="w-full max-w-md bg-surface border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-2">Meal type</label>
          <div className="flex flex-wrap gap-2">
            {mealOptions.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMealType(m.toLowerCase())}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mealType === m.toLowerCase()
                    ? 'bg-accent text-white'
                    : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-2">Day</label>
          <div className="flex flex-wrap gap-2">
            {dayOptions.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDay(d.toLowerCase())}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  day === d.toLowerCase()
                    ? 'bg-accent text-white'
                    : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-3">
            Your group ({persons.length}/6)
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {persons.map((person, i) => (
              <PersonCard
                key={i}
                person={person}
                index={i}
                onChange={updatePerson}
                onRemove={removePerson}
                canRemove={persons.length > 2}
              />
            ))}
          </div>
          {persons.length < 6 && (
            <button
              type="button"
              onClick={addPerson}
              className="mt-4 px-4 py-2 text-sm border border-dashed border-border rounded-lg text-text-secondary hover:text-accent hover:border-accent transition-colors w-full"
            >
              + Add another person
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onFind}
          disabled={!canFind || loading}
          className="w-full py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold text-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Finding restaurants...' : 'Find restaurants'}
        </button>
      </div>
    </div>
  )
}

export { DEMO_PERSONS }
