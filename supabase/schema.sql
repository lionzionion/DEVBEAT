-- DEVBEAT 2.0: execute no SQL Editor de um projeto Supabase dedicado.
-- NÃO execute em projetos CampusFreq, LD Engenharia ou outros existentes.
create table if not exists public.devbeat_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'DEV' check (char_length(display_name) between 1 and 40),
  created_at timestamptz not null default now()
);
create table if not exists public.devbeat_libraries (
  user_id uuid primary key references auth.users(id) on delete cascade,
  favorites jsonb not null default '{}'::jsonb check (jsonb_typeof(favorites) = 'object'),
  playlists jsonb not null default '[]'::jsonb check (jsonb_typeof(playlists) = 'array'),
  history jsonb not null default '[]'::jsonb check (jsonb_typeof(history) = 'array'),
  playback jsonb not null default '{}'::jsonb check (jsonb_typeof(playback) = 'object'),
  updated_at timestamptz not null default now()
);
alter table public.devbeat_profiles enable row level security;
alter table public.devbeat_libraries enable row level security;
revoke all on public.devbeat_profiles from anon;
revoke all on public.devbeat_libraries from anon;
grant select, insert, update, delete on public.devbeat_profiles to authenticated;
grant select, insert, update, delete on public.devbeat_libraries to authenticated;

drop policy if exists devbeat_profiles_select on public.devbeat_profiles;
create policy devbeat_profiles_select on public.devbeat_profiles for select to authenticated using ((select auth.uid()) = id);
drop policy if exists devbeat_profiles_insert on public.devbeat_profiles;
create policy devbeat_profiles_insert on public.devbeat_profiles for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists devbeat_profiles_update on public.devbeat_profiles;
create policy devbeat_profiles_update on public.devbeat_profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
drop policy if exists devbeat_profiles_delete on public.devbeat_profiles;
create policy devbeat_profiles_delete on public.devbeat_profiles for delete to authenticated using ((select auth.uid()) = id);

drop policy if exists devbeat_libraries_select on public.devbeat_libraries;
create policy devbeat_libraries_select on public.devbeat_libraries for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists devbeat_libraries_insert on public.devbeat_libraries;
create policy devbeat_libraries_insert on public.devbeat_libraries for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists devbeat_libraries_update on public.devbeat_libraries;
create policy devbeat_libraries_update on public.devbeat_libraries for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists devbeat_libraries_delete on public.devbeat_libraries;
create policy devbeat_libraries_delete on public.devbeat_libraries for delete to authenticated using ((select auth.uid()) = user_id);
