-- TableFor user database
-- Run in Supabase Dashboard → SQL Editor (or via Supabase CLI migrate)

-- Profiles (one row per auth user)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  is_pro boolean not null default false,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Links TableFor dining sessions to a logged-in user
create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  session_id text not null,
  group_name text,
  suggested_area text,
  session_data jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, session_id)
);

create index if not exists user_sessions_user_id_idx on public.user_sessions (user_id);
create index if not exists user_sessions_created_at_idx on public.user_sessions (created_at desc);

-- Auto-create profile when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Row level security
alter table public.profiles enable row level security;
alter table public.user_sessions enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can view own sessions"
  on public.user_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on public.user_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on public.user_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete own sessions"
  on public.user_sessions for delete
  using (auth.uid() = user_id);
