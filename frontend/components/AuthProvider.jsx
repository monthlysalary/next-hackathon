'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { createSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { fetchProfile } from '@/lib/userDb'

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  configured: false,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const supabase = useMemo(() => createSupabaseClient(), [])

  const refreshProfile = async (userId) => {
    if (!userId) {
      setProfile(null)
      return
    }
    const data = await fetchProfile(userId)
    setProfile(data)
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    let mounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      const nextUser = session?.user ?? null
      setUser(nextUser)
      if (nextUser) {
        refreshProfile(nextUser.id).finally(() => {
          if (mounted) setLoading(false)
        })
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null
      setUser(nextUser)
      if (nextUser) {
        refreshProfile(nextUser.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const value = {
    user,
    profile,
    loading,
    configured: isSupabaseConfigured,
    signOut,
    refreshProfile: () => (user ? refreshProfile(user.id) : Promise.resolve()),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
