-- Ejecuta esto en Supabase: panel del proyecto -> SQL Editor -> New query
-- Si ya habías ejecutado una versión anterior de este script (tabla "items"),
-- puedes borrarla con: drop table if exists items;

-- ============================================================
-- Tabla: habits — los hábitos que cada usuario quiere trackear
-- ============================================================
create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  name text not null,
  emoji text not null default '⭐',
  color text not null default '#7C5CFC',
  target_days_per_week smallint not null default 7 check (target_days_per_week between 1 and 7),
  created_at timestamp with time zone default now()
);

alter table habits enable row level security;

create policy "select_own_habits" on habits
  for select using (auth.uid() = user_id);

create policy "insert_own_habits" on habits
  for insert with check (auth.uid() = user_id);

create policy "update_own_habits" on habits
  for update using (auth.uid() = user_id);

create policy "delete_own_habits" on habits
  for delete using (auth.uid() = user_id);

-- ============================================================
-- Tabla: habit_logs — check-ins (días completados) por hábito
-- ============================================================
create table if not exists habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references habits(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  log_date date not null,
  note text,
  created_at timestamp with time zone default now(),
  unique (habit_id, log_date)
);

alter table habit_logs enable row level security;

create policy "select_own_logs" on habit_logs
  for select using (auth.uid() = user_id);

create policy "insert_own_logs" on habit_logs
  for insert with check (auth.uid() = user_id);

create policy "update_own_logs" on habit_logs
  for update using (auth.uid() = user_id);

create policy "delete_own_logs" on habit_logs
  for delete using (auth.uid() = user_id);

create index if not exists habit_logs_habit_id_idx on habit_logs (habit_id);
create index if not exists habit_logs_user_id_idx on habit_logs (user_id);
