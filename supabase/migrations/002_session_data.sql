-- Store full session snapshot so users can reopen past searches
alter table public.user_sessions
  add column if not exists session_data jsonb;

create policy "Users can update own sessions"
  on public.user_sessions for update
  using (auth.uid() = user_id);
