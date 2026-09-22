-- Ejecuta este archivo una sola vez en Supabase: SQL Editor > New query.
-- Crea la clasificación global con lectura e inserción públicas limitadas.
-- El navegador no puede editar ni borrar puntuaciones existentes.

create table if not exists public.puntuaciones (
  id bigint generated always as identity primary key,
  gamertag text not null,
  puntuacion integer not null,
  partida_id uuid not null unique,
  creado_en timestamptz not null default now(),
  constraint gamertag_longitud check (char_length(gamertag) between 2 and 16),
  constraint gamertag_caracteres check (
    gamertag ~ '^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 _.-]+$'
  ),
  constraint puntuacion_valida check (puntuacion between 0 and 3000)
);

alter table public.puntuaciones enable row level security;

revoke all on table public.puntuaciones from anon, authenticated;
grant select on table public.puntuaciones to anon, authenticated;
grant insert (gamertag, puntuacion, partida_id) on table public.puntuaciones to anon, authenticated;
grant usage, select on sequence public.puntuaciones_id_seq to anon, authenticated;

drop policy if exists "Clasificacion visible para todos" on public.puntuaciones;
create policy "Clasificacion visible para todos"
on public.puntuaciones
for select
to anon, authenticated
using (true);

drop policy if exists "Registrar puntuacion valida" on public.puntuaciones;
create policy "Registrar puntuacion valida"
on public.puntuaciones
for insert
to anon, authenticated
with check (
  char_length(gamertag) between 2 and 16
  and gamertag ~ '^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 _.-]+$'
  and puntuacion between 0 and 3000
);

create index if not exists puntuaciones_ranking_idx
on public.puntuaciones (puntuacion desc, creado_en asc);
