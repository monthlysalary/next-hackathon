import { createSupabaseClient } from './supabase/client'

export async function fetchProfile(userId) {
  const supabase = createSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, display_name, is_pro, created_at')
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
    .select('id, session_id, group_name, suggested_area, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return []
  return data || []
}
