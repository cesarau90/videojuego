-- Ejecuta este archivo completo en Supabase: SQL Editor > New query.
-- Es seguro volver a ejecutarlo (usa "if not exists"/"or replace" donde
-- aplica). Crea la clasificación global con lectura pública y guardado
-- SOLO a través de una función controlada, que conserva únicamente el
-- MEJOR puntaje de cada gamertag (no una fila nueva por cada victoria).
-- El navegador nunca puede editar ni borrar filas directamente.

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

-- Si ya existían varias filas del mismo gamertag (de antes de este
-- cambio), conserva solo la de mayor puntuación por gamertag antes de
-- crear el índice único (si no, el índice único fallaría al crearse).
delete from public.puntuaciones a
using public.puntuaciones b
where lower(a.gamertag) = lower(b.gamertag)
  and (
    a.puntuacion < b.puntuacion
    or (a.puntuacion = b.puntuacion and a.creado_en > b.creado_en)
    or (a.puntuacion = b.puntuacion and a.creado_en = b.creado_en and a.id > b.id)
  );

-- Un gamertag (sin distinguir mayúsculas/minúsculas) solo puede tener
-- una fila: la de su mejor puntaje.
create unique index if not exists puntuaciones_gamertag_unico
on public.puntuaciones (lower(gamertag));

alter table public.puntuaciones enable row level security;

-- El navegador ya NO inserta directamente: todo pasa por la función
-- guardar_puntuacion() de abajo, que decide si reemplaza el mejor
-- puntaje o no. Se revoca cualquier permiso de escritura directa.
revoke all on table public.puntuaciones from anon, authenticated;
grant select on table public.puntuaciones to anon, authenticated;

drop policy if exists "Registrar puntuacion valida" on public.puntuaciones;

drop policy if exists "Clasificacion visible para todos" on public.puntuaciones;
create policy "Clasificacion visible para todos"
on public.puntuaciones
for select
to anon, authenticated
using (true);

create index if not exists puntuaciones_ranking_idx
on public.puntuaciones (puntuacion desc, creado_en asc);

-- Función que guarda una puntuación SOLO si es la primera de ese
-- gamertag o supera a la que ya tenía guardada. Corre con los permisos
-- de quien la creó (security definer), así que puede insertar/actualizar
-- aunque el navegador (anon) no tenga permiso directo sobre la tabla;
-- por eso valida el gamertag y la puntuación ella misma, con las mismas
-- reglas que antes tenía la política de inserción.
create or replace function public.guardar_puntuacion(
  p_gamertag text,
  p_puntuacion integer,
  p_partida_id uuid
) returns table (guardado boolean, mejor_puntaje integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gamertag text := trim(p_gamertag);
  v_afectados integer;
  v_mejor integer;
begin
  if v_gamertag is null or char_length(v_gamertag) not between 2 and 16 then
    raise exception 'Gamertag inválido';
  end if;
  if v_gamertag !~ '^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 _.-]+$' then
    raise exception 'Gamertag inválido';
  end if;
  if p_puntuacion is null or p_puntuacion not between 0 and 3000 then
    raise exception 'Puntuación inválida';
  end if;
  if p_partida_id is null then
    raise exception 'Falta el identificador de partida';
  end if;

  insert into public.puntuaciones (gamertag, puntuacion, partida_id)
  values (v_gamertag, p_puntuacion, p_partida_id)
  on conflict (lower(gamertag)) do update
    set puntuacion = excluded.puntuacion,
        partida_id = excluded.partida_id,
        gamertag = excluded.gamertag,
        creado_en = now()
    where excluded.puntuacion > public.puntuaciones.puntuacion;

  get diagnostics v_afectados = row_count;

  select p.puntuacion into v_mejor
  from public.puntuaciones p
  where lower(p.gamertag) = lower(v_gamertag);

  return query select (v_afectados > 0), v_mejor;
end;
$$;

revoke all on function public.guardar_puntuacion(text, integer, uuid) from public;
grant execute on function public.guardar_puntuacion(text, integer, uuid) to anon, authenticated;
