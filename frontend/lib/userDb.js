import { createSupabaseClient } from './supabase/client'

export async function fetchProfile(userId) {
  const supabase = createSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, display_name, is_pro, stripe_subscription_id, created_at')
    .eq('id', userId)
    .single()

  if (error) return null
  return data
}

export async function updateDisplayName(userId, displayName) {
  const supabase = createSupabaseClient()
  if (!supabase) return { error: 'Supabase not configured' }

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  return { error: error?.message || null }
}

export async function saveUserSession(userId, session) {
  const supabase = createSupabaseClient()
  if (!supabase) return { error: 'Supabase not configured' }

  const { error } = await supabase.from('user_sessions').upsert(
    {
      user_id: userId,
      session_id: session.session_id,
      group_name: session.group_name || null,
      suggested_area: session.suggested_area || null,
      session_data: session.session_data || null,
    },
    { onConflict: 'user_id,session_id' },
  )

  return { error: error?.message || null }
}

export async function fetchUserSessions(userId) {
  const supabase = createSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('user_sessions')
    .select('id, session_id, group_name, suggested_area, created_at, session_data')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return []
  return data || []
}

export async function fetchUserSessionData(userId, sessionId) {
  const supabase = createSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('user_sessions')
    .select('session_data')
    .eq('user_id', userId)
    .eq('session_id', sessionId)
    .single()

  if (error || !data?.session_data) return null
  return data.session_data
}

export async function countUserSessionsToday(userId) {
  const supabase = createSupabaseClient()
  if (!supabase) return 0

  const today = new Date().toISOString().slice(0, 10)
  const { count, error } = await supabase
    .from('user_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', `${today}T00:00:00`)

  if (error) return 0
  return count || 0
}

export async function setUserPro(userId, isPro = true, subscriptionId = null) {
  const supabase = createSupabaseClient()
  if (!supabase) return { error: 'Supabase not configured' }

  const payload = {
    is_pro: isPro,
    updated_at: new Date().toISOString(),
  }
  if (isPro && subscriptionId) {
    payload.stripe_subscription_id = subscriptionId
  }
  if (!isPro) {
    payload.stripe_subscription_id = null
  }

  const { error } = await supabase.from('profiles').update(payload).eq('id', userId)

  return { error: error?.message || null }
}
