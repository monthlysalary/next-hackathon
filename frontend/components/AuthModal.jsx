'use client'

import { useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'

function AuthFormCard({
  mode,
  setMode,
  email,
  setEmail,
  password,
  setPassword,
  displayName,
  setDisplayName,
  loading,
  error,
  message,
  onSubmit,
  resetForm,
  title,
  subtitle,
  submitLabel,
}) {
  return (
    <div className="relative w-full max-w-sm bg-white/95 backdrop-blur-sm rounded-3xl border border-border shadow-card p-5">
      <h2 className="text-lg font-bold text-text-primary mb-1">{title}</h2>
      <p className="text-xs text-text-secondary mb-4">{subtitle}</p>

      <form onSubmit={onSubmit} className="space-y-3">
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
          {loading ? 'Please wait…' : submitLabel}
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
  )
}

export default function AuthModal({
  open,
  onClose,
  required = false,
  fullPage = false,
  fullPageHeroTitle,
  fullPageHeroSubtitle,
  title,
  subtitle,
  onAuthenticated,
}) {
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

  const defaultTitle = mode === 'signup' ? 'Create account' : 'Sign in'
  const defaultSubtitle = fullPage
    ? 'Sign in or create an account to add your preferences to this group.'
    : 'Save your dining sessions and pick up where you left off.'
  const submitLabel = mode === 'signup' ? 'Sign up' : fullPage ? 'Continue to group' : 'Sign in'

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
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || email.split('@')[0] },
          },
        })
        if (signUpError) throw signUpError
        if (data.session) {
          onAuthenticated?.()
          if (!required) onClose?.()
        } else {
          setMessage('Account created. Check your email if confirmation is required.')
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
        onAuthenticated?.()
        if (!required) onClose?.()
      }
    } catch (err) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const card = (
    <AuthFormCard
      mode={mode}
      setMode={setMode}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      displayName={displayName}
      setDisplayName={setDisplayName}
      loading={loading}
      error={error}
      message={message}
      onSubmit={handleSubmit}
      resetForm={resetForm}
      title={title || defaultTitle}
      subtitle={subtitle || defaultSubtitle}
      submitLabel={submitLabel}
    />
  )

  const heroTitle = fullPageHeroTitle || 'Join your group'
  const heroSubtitle =
    fullPageHeroSubtitle ||
    "You've been invited to add your dining preferences. Sign in to continue."

  if (fullPage) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-8 pb-12">
        <div className="mb-6 text-center max-w-sm flex flex-col items-center">
          <img
            src="/tablefor-logo.png"
            alt=""
            className="h-16 w-16 object-contain mb-3"
            width={64}
            height={64}
          />
          <p className="text-sm font-semibold text-accent">TableFor</p>
          <h1 className="text-xl font-bold text-text-primary mt-1">{heroTitle}</h1>
          <p className="text-xs text-text-secondary mt-2">{heroSubtitle}</p>
        </div>
        {card}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {!required && (
        <button
          type="button"
          aria-label="Close"
          className="absolute inset-0 bg-black/40"
          onClick={onClose}
        />
      )}
      {required && <div className="absolute inset-0 bg-black/40" aria-hidden="true" />}
      {card}
    </div>
  )
}
