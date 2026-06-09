'use client'

import { useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'

export default function AuthModal({ open, onClose }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  if (!open) return null

  const resetForm = () => {
    setError(null)
    setMessage(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    resetForm()

    const supabase = createSupabaseClient()
    if (!supabase) {
      setError('Supabase is not configured. Add keys to frontend/.env')
      setLoading(false)
      return
    }

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || email.split('@')[0] },
          },
        })
        if (signUpError) throw signUpError
        setMessage('Account created. Check your email if confirmation is required.')
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
        onClose()
      }
    } catch (err) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-surface rounded-3xl border border-border shadow-card p-5">
        <h2 className="text-lg font-bold text-text-primary mb-1">
          {mode === 'signup' ? 'Create account' : 'Sign in'}
        </h2>
        <p className="text-xs text-text-secondary mb-4">
          Save your dining sessions and pick up where you left off.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1.5">
                Display name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Yuexin"
                className="w-full bg-surface-raised border border-border rounded-[14px] px-3.5 h-11 text-sm outline-none focus:border-accent"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-text-primary mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-surface-raised border border-border rounded-[14px] px-3.5 h-11 text-sm outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-primary mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full bg-surface-raised border border-border rounded-[14px] px-3.5 h-11 text-sm outline-none focus:border-accent"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
          {message && (
            <p className="text-xs text-success bg-green-50 border border-green-200 rounded-xl px-3 py-2">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-[14px] bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {loading ? 'Please wait…' : mode === 'signup' ? 'Sign up' : 'Sign in'}
          </button>
        </form>

        <p className="text-xs text-text-secondary text-center mt-4">
          {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            className="text-accent font-medium"
            onClick={() => {
              setMode(mode === 'signup' ? 'signin' : 'signup')
              resetForm()
            }}
          >
            {mode === 'signup' ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  )
}
