-- ─────────────────────────────────────────────────────────────────────────────
-- Mt Beauty SC – Supabase Schema
-- Run in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ─────────────────────────────────────────────────────────────────────────────

-- Fixtures (draws/schedule)
create table if not exists fixtures (
  id          uuid        primary key default gen_random_uuid(),
  round       int         not null,
  date        date        not null,
  time        time,
  home_team   text        not null,
  away_team   text        not null,
  age_group   text        not null check (age_group in ('U8','U10','U12','U14','U16')),
  venue       text        not null default 'Mt Beauty Rec Reserve',
  is_home     boolean     default true,
  created_at  timestamptz default now()
);

-- Results (linked to a fixture)
create table if not exists results (
  id              uuid        primary key default gen_random_uuid(),
  fixture_id      uuid        references fixtures(id) on delete cascade,
  home_score      int,
  away_score      int,
  scorers         text[],
  special_moment  text,
  created_at      timestamptz default now()
);

-- Rosters (players per age group)
create table if not exists rosters (
  id            uuid        primary key default gen_random_uuid(),
  player_name   text        not null,
  jersey_number int         check (jersey_number between 1 and 99),
  position      text        check (position in ('GK','DEF','MID','FWD')),
  age_group     text        not null check (age_group in ('U8','U10','U12','U14','U16')),
  parent_name   text,
  parent_phone  text,
  created_at    timestamptz default now()
);

-- Coaches
create table if not exists coaches (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  age_group   text        not null check (age_group in ('U8','U10','U12','U14','U16')),
  role        text        not null default 'Head Coach',
  phone       text,
  email       text,
  bio         text,
  created_at  timestamptz default now()
);

-- Messages (community board)
create table if not exists messages (
  id          uuid        primary key default gen_random_uuid(),
  author      text        not null,
  content     text        not null,
  approved    boolean     not null default false,
  created_at  timestamptz default now()
);

-- Attendance (player availability per fixture)
create table if not exists attendance (
  id          uuid        primary key default gen_random_uuid(),
  fixture_id  uuid        references fixtures(id) on delete cascade,
  player_id   uuid        references rosters(id)  on delete cascade,
  confirmed   boolean     not null default false,
  created_at  timestamptz default now(),
  unique (fixture_id, player_id)
);

-- ─── Row-Level Security ───────────────────────────────────────────────────────

alter table fixtures   enable row level security;
alter table results    enable row level security;
alter table rosters    enable row level security;
alter table coaches    enable row level security;
alter table messages   enable row level security;
alter table attendance enable row level security;

-- Public read on all tables
create policy "Public read fixtures"   on fixtures   for select using (true);
create policy "Public read results"    on results    for select using (true);
create policy "Public read rosters"    on rosters    for select using (true);
create policy "Public read coaches"    on coaches    for select using (true);
create policy "Public read messages"   on messages   for select using (approved = true);
create policy "Public read attendance" on attendance for select using (true);

-- Allow anon inserts (coach portal uses anon key with shared password – not role-based)
-- In a production setup you would use Supabase Auth with a service_role key for writes.
create policy "Anon insert fixtures"   on fixtures   for insert with check (true);
create policy "Anon update fixtures"   on fixtures   for update using (true);
create policy "Anon delete fixtures"   on fixtures   for delete using (true);

create policy "Anon insert results"    on results    for insert with check (true);
create policy "Anon update results"    on results    for update using (true);
create policy "Anon delete results"    on results    for delete using (true);

create policy "Anon insert rosters"    on rosters    for insert with check (true);
create policy "Anon update rosters"    on rosters    for update using (true);
create policy "Anon delete rosters"    on rosters    for delete using (true);

create policy "Anon insert coaches"    on coaches    for insert with check (true);
create policy "Anon update coaches"    on coaches    for update using (true);
create policy "Anon delete coaches"    on coaches    for delete using (true);

-- Messages: anyone can insert (pending moderation), full access for moderation
create policy "Anon insert messages"   on messages   for insert with check (true);
create policy "Anon update messages"   on messages   for update using (true);
create policy "Anon delete messages"   on messages   for delete using (true);

create policy "Anon insert attendance" on attendance for insert with check (true);
create policy "Anon update attendance" on attendance for update using (true);
create policy "Anon delete attendance" on attendance for delete using (true);
