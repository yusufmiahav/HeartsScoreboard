-- Hearts Score Keeper — accounts + friends schema.
-- Run this once in your Supabase project's SQL editor (or via `supabase db push`
-- if you're using the Supabase CLI). See README.md "Backend setup" for the full
-- walkthrough, including enabling anonymous sign-ins and configuring Google OAuth.

-- ─── profiles ──────────────────────────────────────────────────────────────
-- One row per auth user (email, Google, or anonymous/guest). Created
-- automatically by the trigger below whenever someone signs up.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  player_code text not null unique,
  is_guest boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Friendly player ID like HRT·4K9·2QX. Excludes ambiguous characters
-- (0/O, 1/I, etc.) so it's easy to read aloud or retype.
create or replace function public.generate_player_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
  taken boolean;
begin
  loop
    candidate := 'HRT·';
    for i in 1..3 loop
      candidate := candidate || substr(chars, (floor(random() * length(chars)) + 1)::int, 1);
    end loop;
    candidate := candidate || '·';
    for i in 1..3 loop
      candidate := candidate || substr(chars, (floor(random() * length(chars)) + 1)::int, 1);
    end loop;
    select exists(select 1 from public.profiles where player_code = candidate) into taken;
    exit when not taken;
  end loop;
  return candidate;
end;
$$;

-- Auto-create a profile for every new auth user, whatever the sign-in method.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, player_code, is_guest)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Player'
    ),
    public.generate_player_code(),
    new.is_anonymous
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── friend_requests ───────────────────────────────────────────────────────
-- A single table for the whole lifecycle: a pending row is a request; the
-- addressee accepts it in place (status -> 'accepted', i.e. now friends);
-- either side deleting the row cancels a pending request, declines it, or
-- unfriends an accepted one.

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint no_self_request check (requester_id <> addressee_id)
);

-- one live (pending or accepted) relationship per pair, regardless of direction
create unique index if not exists friend_requests_unique_pair
  on public.friend_requests (least(requester_id, addressee_id), greatest(requester_id, addressee_id))
  where status in ('pending', 'accepted');

create index if not exists friend_requests_requester_idx on public.friend_requests (requester_id);
create index if not exists friend_requests_addressee_idx on public.friend_requests (addressee_id);

alter table public.friend_requests enable row level security;

drop policy if exists "Users can view their own friend requests" on public.friend_requests;
create policy "Users can view their own friend requests"
  on public.friend_requests for select
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "Users can send friend requests" on public.friend_requests;
create policy "Users can send friend requests"
  on public.friend_requests for insert
  to authenticated
  with check (auth.uid() = requester_id);

drop policy if exists "Addressee can accept a request" on public.friend_requests;
create policy "Addressee can accept a request"
  on public.friend_requests for update
  to authenticated
  using (auth.uid() = addressee_id)
  with check (auth.uid() = addressee_id);

drop policy if exists "Either side can remove a request or friendship" on public.friend_requests;
create policy "Either side can remove a request or friendship"
  on public.friend_requests for delete
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Live updates for incoming requests / acceptances without a page refresh.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'friend_requests'
  ) then
    alter publication supabase_realtime add table public.friend_requests;
  end if;
end;
$$;
