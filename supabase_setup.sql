-- Ejecuta esto en Supabase: panel del proyecto -> SQL Editor -> New query

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  title text not null,
  created_at timestamp with time zone default now()
);

alter table items enable row level security;

create policy "Los usuarios ven solo sus propios elementos"
on items for select
using (auth.uid() = user_id);

create policy "Los usuarios insertan solo sus propios elementos"
on items for insert
with check (auth.uid() = user_id);
