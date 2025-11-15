-- Enable required extensions
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- Users & profiles
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  passcode_hash text,
  name text,
  birth_year int,
  interests jsonb default '[]'::jsonb,
  consent_peer boolean default false,
  consent_share boolean default false,
  created_at timestamptz default now()
);

create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  ts timestamptz default now(),
  audio_url text,
  transcript text,
  plan_json jsonb,
  mood text check (mood in ('low','ok','good')),
  tags jsonb default '[]'::jsonb,
  deleted boolean default false
);

create table if not exists memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  ts timestamptz default now(),
  audio_url text,
  transcript text,
  summary_json jsonb,
  era text,
  tags jsonb default '[]'::jsonb,
  quote text,
  deleted boolean default false
);

create table if not exists buddies (
  id uuid primary key default gen_random_uuid(),
  user_a uuid references users(id) on delete cascade,
  user_b uuid references users(id) on delete cascade,
  since_ts timestamptz default now(),
  active boolean default true
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  buddy_id uuid references buddies(id) on delete cascade,
  from_user uuid references users(id) on delete cascade,
  ts timestamptz default now(),
  audio_url text,
  transcript text,
  summary_json jsonb,
  deleted boolean default false
);

create table if not exists shares (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid references memories(id) on delete cascade,
  to_user_id uuid references users(id) on delete cascade,
  created_at timestamptz default now(),
  revoked boolean default false
);

-- Basic audit helper for shares
create table if not exists share_audit (
  id uuid primary key default gen_random_uuid(),
  share_id uuid references shares(id) on delete cascade,
  action text check (action in ('created','revoked')),
  actor uuid references users(id),
  created_at timestamptz default now()
);

-- Enable RLS
alter table users enable row level security;
alter table entries enable row level security;
alter table memories enable row level security;
alter table buddies enable row level security;
alter table messages enable row level security;
alter table shares enable row level security;
alter table share_audit enable row level security;

-- Users can see only themselves
create policy "Users manage self" on users
  using ( id = auth.uid() )
  with check ( id = auth.uid() );

-- Allow service role to bypass RLS for seeding/admin operations
create policy "Service role full access" on users
  using ( auth.jwt()->>'role' = 'service_role' )
  with check ( auth.jwt()->>'role' = 'service_role' );

-- Entries policies
create policy "Entries owner access" on entries
  using ( user_id = auth.uid() )
  with check ( user_id = auth.uid() );

-- Memories policies
create policy "Memories owner access" on memories
  using ( user_id = auth.uid() )
  with check ( user_id = auth.uid() );

-- Buddy policies: only participants
create policy "Buddy participants" on buddies
  using ( auth.uid() in (user_a, user_b) )
  with check ( auth.uid() in (user_a, user_b) );

create policy "Message participants" on messages
  using (
    exists (
      select 1 from buddies b
      where b.id = messages.buddy_id
        and auth.uid() in (b.user_a, b.user_b)
    )
  )
  with check (
    exists (
      select 1 from buddies b
      where b.id = messages.buddy_id
        and auth.uid() in (b.user_a, b.user_b)
    )
  );

-- Share policies: owner or recipient may read
create policy "Share owners manage" on shares
  using (
    exists (
      select 1 from memories m
      where m.id = shares.memory_id and m.user_id = auth.uid()
    ) or shares.to_user_id = auth.uid()
  )
  with check (
    exists (
      select 1 from memories m
      where m.id = shares.memory_id and m.user_id = auth.uid()
    )
  );

-- Share audit
create policy "Share audit read" on share_audit
  using (
    exists (
      select 1 from shares s
      join memories m on m.id = s.memory_id
      where s.id = share_audit.share_id
        and (m.user_id = auth.uid() or s.to_user_id = auth.uid())
    )
  )
  with check (false);

-- Storage instructions (run separately via Supabase CLI)
--   supabase storage create-bucket audio --public=false
--   Policies restrict uploads via service key only.
