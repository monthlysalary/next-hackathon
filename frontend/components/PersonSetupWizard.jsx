'use client'

import { useState, useRef, useEffect, useImperativeHandle } from 'react'
import LocationField from './LocationField'
import {
  BUDGET_OPTIONS,
  DIETARY_OPTIONS,
  CUISINE_OPTIONS,
  MUST_HAVE_OPTIONS,
  AVOID_OPTIONS,
} from '@/lib/constants'
import { getPersonAvatarColor } from '@/lib/personAvatar'

const STEPS = [
  { id: 1, title: 'Where are you?' },
  { id: 2, title: 'Budget?' },
  { id: 3, title: 'Dietary needs?' },
  { id: 4, title: 'Cuisine preferences?' },
  { id: 5, title: 'What matters most?' },
  { id: 6, title: 'What should we avoid?' },
  { id: 7, title: 'Anything else?' },
]

const TOTAL_STEPS = STEPS.length

function StepIndicator({ current, completed }) {
  const filled = completed ? TOTAL_STEPS : current
  return (
    <div className="flex items-center gap-1.5 mb-5">
      {STEPS.map((step) => (
        <div
          key={step.id}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            step.id <= filled ? 'bg-accent' : 'bg-border'
          }`}
        />
      ))}
    </div>
  )
}

function ToggleChips({ options, selected, onChange }) {
  const toggle = (opt) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt))
    } else if (opt === 'None') {
      onChange(['None'])
    } else {
      onChange([...selected.filter((s) => s !== 'None'), opt])
    }
  }

  const custom = selected.filter((s) => !options.includes(s))

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${
              active
                ? 'bg-accent text-white'
                : 'bg-surface-raised text-text-secondary border border-border'
            }`}
          >
            {opt}
          </button>
        )
      })}
      {custom.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className="px-3 py-2 rounded-full text-xs font-medium bg-accent/15 text-accent border border-accent/30"
        >
          {opt} ×
        </button>
      ))}
    </div>
  )
}

function ChipInput({ selected, onChange, presets, addLabel, placeholder, inputRef }) {
  const [input, setInput] = useState('')
  const [expanded, setExpanded] = useState(false)
  const fieldRef = useRef(null)

  const commitPending = () => {
    const value = input.trim()
    if (!value || selected.includes(value)) {
      setInput('')
      setExpanded(false)
      return selected
    }
    const next =
      value.toLowerCase() === 'none'
        ? ['None']
        : [...selected.filter((s) => s !== 'None'), value]
    onChange(next)
    setInput('')
    setExpanded(false)
    return next
  }

  useImperativeHandle(inputRef, () => ({ commitPending }), [input, selected, onChange])

  const openInput = () => {
    setExpanded(true)
    setTimeout(() => fieldRef.current?.focus(), 0)
  }

  return (
    <div className="space-y-3">
      {presets.length > 0 && (
        <ToggleChips options={presets} selected={selected} onChange={onChange} />
      )}
      {expanded ? (
        <div className="flex items-center gap-2 bg-surface-raised rounded-[14px] border border-accent px-3 py-2.5">
          <input
            ref={fieldRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commitPending()
              }
              if (e.key === 'Escape') {
                setExpanded(false)
                setInput('')
              }
            }}
            onBlur={() => {
              if (input.trim()) {
                commitPending()
              } else {
                setExpanded(false)
              }
            }}
            placeholder={placeholder}
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-secondary/50"
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={commitPending}
            disabled={!input.trim()}
            aria-label="Add preference"
            className="shrink-0 w-8 h-8 rounded-full bg-accent hover:bg-accent-hover text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              className="w-4 h-4"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={openInput}
          className="text-xs font-medium text-accent hover:text-accent-hover"
        >
          {addLabel}
        </button>
      )}
    </div>
  )
}

function BudgetSlider({ value, onChange }) {
  const index = Math.max(0, BUDGET_OPTIONS.indexOf(value))
  const current = BUDGET_OPTIONS[index] ?? BUDGET_OPTIONS[1]

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-text-primary text-center">{current}</p>
      <input
        type="range"
        min={0}
        max={BUDGET_OPTIONS.length - 1}
        step={1}
        value={index}
        onChange={(e) => onChange(BUDGET_OPTIONS[Number(e.target.value)])}
        className="w-full h-2 rounded-full appearance-none bg-border accent-accent cursor-pointer"
      />
      <div className="grid grid-cols-4 gap-1 text-[10px] text-text-secondary text-center">
        {BUDGET_OPTIONS.map((opt) => (
          <span
            key={opt}
            className={opt === current ? 'text-accent font-semibold' : ''}
          >
            {opt.replace('S$', '$')}
          </span>
        ))}
      </div>
    </div>
  )
}

function CheckboxGroup({ options, selected, onChange }) {
  const toggle = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div className="space-y-2.5">
      {options.map(({ label, value }) => (
        <label
          key={value}
          className="flex items-center gap-3 px-3.5 py-3 bg-surface-raised rounded-[14px] border border-border cursor-pointer hover:border-accent/40 transition-colors"
        >
          <input
            type="checkbox"
            checked={selected.includes(value)}
            onChange={() => toggle(value)}
            className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
          />
          <span className="text-sm text-text-primary">{label}</span>
        </label>
      ))}
    </div>
  )
}

export function buildPersonSummaryLines(person) {
  const dietaryDisplay = {
    Veg: 'Vegetarian',
    Halal: 'Halal',
    Vegan: 'Vegan',
  }
  const mustHaveLabels = Object.fromEntries(
    MUST_HAVE_OPTIONS.map(({ label, value }) => [value, label]),
  )
  const avoidLabels = Object.fromEntries(
    AVOID_OPTIONS.map(({ label, value }) => [value, label]),
  )

  const lines = []
  if (person.location) lines.push(person.location)
  if (person.budget) lines.push(`Budget: ${person.budget.replace('S$', '$')}`)
  const dietary = (person.dietary || []).filter((d) => d !== 'None')
  if (dietary.length) {
    lines.push(dietary.map((d) => dietaryDisplay[d] || d).join(', '))
  }
  const cuisines = (person.cuisine_loves || []).filter((c) => c !== 'Any')
  if (cuisines.length) lines.push(cuisines.join(', '))
  const mustHave = (person.must_have || []).map((m) => mustHaveLabels[m] || m)
  if (mustHave.length) lines.push(`Prefers: ${mustHave.join(', ')}`)
  const avoid = (person.avoid || []).map((a) => avoidLabels[a] || a)
  if (avoid.length) lines.push(`Avoids: ${avoid.join(', ')}`)
  if (person.notes?.trim()) lines.push(`Also: ${person.notes.trim()}`)
  return lines
}

function SummaryList({ lines }) {
  if (!lines.length) return null
  return (
    <ul className="space-y-1.5">
      {lines.map((line) => (
        <li key={line} className="text-sm text-text-primary flex items-start gap-2">
          <span className="text-success shrink-0">✓</span>
          {line}
        </li>
      ))}
    </ul>
  )
}

export default function PersonSetupWizard({
  person,
  index,
  onChange,
  step,
  onStepChange,
  onRemove,
  canRemove,
  completed,
  onComplete,
  onModify,
  onSaveFriend,
}) {
  const dietaryRef = useRef(null)
  const cuisineRef = useRef(null)
  const notesRef = useRef(person.notes || '')
  const [localName, setLocalName] = useState(person.name)
  const [friendSaved, setFriendSaved] = useState(false)

  // Sync localName when person changes externally
  useEffect(() => {
    setLocalName(person.name)
  }, [person.name])

  const update = (field, value) => {
    onChange(index, { ...person, [field]: value })
  }

  const canProceed = () => {
    if (step === 1) return localName.trim() && person.location.trim()
    return true
  }

  const goNext = () => {
    if (step === 3) {
      const next = dietaryRef.current?.commitPending()
      if (next) update('dietary', next)
    }
    if (step === 4) {
      const next = cuisineRef.current?.commitPending()
      if (next) update('cuisine_loves', next)
    }
    if (step < TOTAL_STEPS && canProceed()) onStepChange(step + 1)
  }

  const goBack = () => {
    if (step > 1) onStepChange(step - 1)
  }

  const handleDone = () => {
    const finalPerson = {
      ...person,
      notes: notesRef.current.trim(),
    }
    onChange(index, finalPerson)
    onComplete(finalPerson)
  }

  const summaryLines = buildPersonSummaryLines(person)
  const displayName = person.name.trim() || `Person ${index + 1}`
  const initial = person.name.trim().charAt(0).toUpperCase() || String(index + 1)
  const avatarColor = getPersonAvatarColor(index)

  if (completed) {
    return (
      <div className="bg-white border border-border rounded-[20px] p-4 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: avatarColor.bg }}
            >
              {initial}
            </span>
            <span className="text-sm font-semibold text-text-primary">{displayName}</span>
          </div>
          {canRemove && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="text-xs text-text-secondary hover:text-red-500"
            >
              Remove
            </button>
          )}
        </div>

        <StepIndicator current={TOTAL_STEPS} completed />

        <div className="text-center mb-4">
          <p className="text-[17px] font-semibold text-text-primary">All set!</p>
          <p className="text-xs text-text-secondary mt-1">
            Preferences saved for {displayName}
          </p>
        </div>

        <div className="p-3.5 bg-surface-raised rounded-[16px] border border-border mb-4">
          <SummaryList lines={summaryLines} />
        </div>

        <button
          type="button"
          onClick={onModify}
          className="w-full py-3 rounded-[14px] border border-border text-sm font-medium text-text-secondary hover:text-text-primary hover:border-accent transition-colors"
        >
          Modify preferences
        </button>

        {onSaveFriend && person.name.trim() && (
          <button
            type="button"
            onClick={() => {
              onSaveFriend(person)
              setFriendSaved(true)
              setTimeout(() => setFriendSaved(false), 2000)
            }}
            className={`w-full mt-2 py-3 rounded-[14px] text-sm font-medium transition-colors ${
              friendSaved
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-surface-raised text-text-secondary border border-border hover:border-accent hover:text-accent'
            }`}
          >
            {friendSaved ? '✓ Remembered!' : '💾 Remember this friend'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white border border-border rounded-[20px] p-4 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: avatarColor.bg }}
          >
            {initial}
          </span>
          <span className="text-sm font-semibold text-text-primary">{displayName}</span>
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-xs text-text-secondary hover:text-red-500"
          >
            Remove
          </button>
        )}
      </div>

      <StepIndicator current={step} completed={false} />

      <h3 className="text-[17px] font-semibold text-text-primary mb-4">
        Step {step}: {STEPS[step - 1].title}
      </h3>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Your name
            </label>
            <div className="bg-surface-raised rounded-[14px] flex items-center px-3.5 h-[52px] border border-border focus-within:border-accent">
              <input
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                onBlur={() => update('name', localName)}
                placeholder="How should we call you?"
                className="w-full bg-transparent border-none outline-none text-[15px] text-text-primary placeholder:text-text-secondary/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Location
            </label>
            <LocationField
              value={person.location}
              onChange={(v) => update('location', v)}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-4">
            Per person budget
          </label>
          <BudgetSlider value={person.budget} onChange={(v) => update('budget', v)} />
        </div>
      )}

      {step === 3 && (
        <ChipInput
          inputRef={dietaryRef}
          selected={person.dietary}
          onChange={(v) => update('dietary', v)}
          presets={DIETARY_OPTIONS.filter((d) => d !== 'None')}
          addLabel="+ Add dietary restriction"
          placeholder="Type a restriction and press Enter"
        />
      )}

      {step === 4 && (
        <ChipInput
          inputRef={cuisineRef}
          selected={person.cuisine_loves}
          onChange={(v) => update('cuisine_loves', v)}
          presets={CUISINE_OPTIONS.filter((c) => c !== 'Any')}
          addLabel="+ Add cuisine preference"
          placeholder="Type a cuisine and press Enter"
        />
      )}

      {step === 5 && (
        <CheckboxGroup
          options={MUST_HAVE_OPTIONS}
          selected={person.must_have}
          onChange={(v) => update('must_have', v)}
        />
      )}

      {step === 6 && (
        <CheckboxGroup
          options={AVOID_OPTIONS}
          selected={person.avoid || []}
          onChange={(v) => update('avoid', v)}
        />
      )}

      {step === 7 && (
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">
            Optional — any other preferences or requests for the group?
          </p>
          <div className="bg-surface-raised rounded-[14px] border border-border focus-within:border-accent px-3.5 py-3">
            <textarea
              value={person.notes || ''}
              onChange={(e) => {
                notesRef.current = e.target.value
                update('notes', e.target.value)
              }}
              placeholder="e.g. Prefer outdoor seating, celebrating a birthday…"
              rows={4}
              className="w-full bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-secondary/50 resize-none"
            />
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-6">
        {step > 1 && (
          <button
            type="button"
            onClick={goBack}
            className="flex-1 py-3 rounded-[14px] border border-border text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Back
          </button>
        )}
        {step < TOTAL_STEPS && (
          <button
            type="button"
            onClick={goNext}
            disabled={!canProceed()}
            className="flex-1 py-3 rounded-[14px] bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-colors disabled:opacity-40"
          >
            Next
          </button>
        )}
        {step === TOTAL_STEPS && (
          <button
            type="button"
            onClick={handleDone}
            className="flex-1 py-3 rounded-[14px] bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-colors"
          >
            Done
          </button>
        )}
      </div>
    </div>
  )
}
