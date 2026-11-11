-- Jass-Stats: Datenbank-Schema für Supabase
-- Im Supabase-Dashboard unter "SQL Editor" → "New query" einfügen und "Run" klicken.
-- Das Skript kann gefahrlos mehrmals ausgeführt werden.

create table if not exists public.players (
  id          text primary key,
  name        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.evenings (
  id          text primary key,
  date        date not null,
  team0       text[] not null default '{}',
  team1       text[] not null default '{}',
  status      text not null default 'done' check (status in ('active', 'done')),
  notes       text,
  created_at  timestamptz not null default now()
);

create table if not exists public.games (
  id          text primary key,
  evening_id  text not null references public.evenings(id) on delete cascade,
  number      int  not null default 1,
  dismissed   text[] not null default '{}',
  created_at  timestamptz not null default now()
);

create table if not exists public.rounds (
  id            text primary key,
  game_id       text not null references public.games(id) on delete cascade,
  evening_id    text not null references public.evenings(id) on delete cascade,
  seq           int  not null default 0,
  multiplier    int  not null default 1,
  stich_team    smallint check (stich_team in (0, 1)),
  stich_points  int,
  match_team    smallint check (match_team in (0, 1)),
  weis0         int not null default 0,
  weis1         int not null default 0,
  stoeck0       boolean not null default false,
  stoeck1       boolean not null default false,
  created_at    timestamptz not null default now()
);

create table if not exists public.chritz (
  id          text primary key,
  evening_id  text not null references public.evenings(id) on delete cascade,
  game_id     text references public.games(id) on delete cascade,
  round_id    text references public.rounds(id) on delete cascade,
  type        text not null check (type in ('match', 'bergpreis', 'sieg')),
  team        smallint not null check (team in (0, 1)),
  auto        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists games_evening_idx  on public.games (evening_id);
create index if not exists rounds_game_idx    on public.rounds (game_id);
create index if not exists chritz_evening_idx on public.chritz (evening_id);

-- Zugriff ohne Login: Jeder mit dem Link darf lesen und schreiben.
do $$
declare t text;
begin
  foreach t in array array['players', 'evenings', 'games', 'rounds', 'chritz'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "open access" on public.%I', t);
    execute format('create policy "open access" on public.%I for all to anon, authenticated using (true) with check (true)', t);
    execute format('grant select, insert, update, delete on public.%I to anon, authenticated', t);
    -- Live-Updates auf allen Handys
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
