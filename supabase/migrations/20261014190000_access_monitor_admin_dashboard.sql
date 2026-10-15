-- Autoriza o painel externo de métricas apenas a emails explicitamente incluídos
-- pelo administrador no SQL Editor do Supabase. Não associa acessos a nomes.

create table if not exists public.access_monitor_admins (
    email text primary key check (email = lower(trim(email)) and position('@' in email) > 1),
    active boolean not null default true,
    created_at timestamptz not null default timezone('utc', now())
);

alter table public.access_monitor_admins enable row level security;
revoke all on table public.access_monitor_admins from anon, authenticated;

create or replace function public.is_access_monitor_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.access_monitor_admins a
        where a.active = true
          and a.email = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
    );
$$;

revoke all on function public.is_access_monitor_admin() from public;
grant execute on function public.is_access_monitor_admin() to authenticated;

alter view public.access_monitor_summary set (security_invoker = true);

-- A view é legível via PostgREST somente por usuários autenticados. As políticas
-- das tabelas de origem fazem a autorização efetiva do administrador.
grant select on public.access_monitor_summary to authenticated;
revoke all on public.access_monitor_summary from anon;
grant select on public.access_devices, public.access_sessions, public.access_visits to authenticated;
revoke all on public.access_devices, public.access_sessions, public.access_visits from anon;

-- A leitura fica restrita ao email presente no JWT e cadastrado na lista privada.
drop policy if exists access_devices_no_public_read on public.access_devices;
drop policy if exists access_sessions_no_public_read on public.access_sessions;
drop policy if exists access_visits_no_public_read on public.access_visits;
drop policy if exists access_devices_read_admin on public.access_devices;
drop policy if exists access_sessions_read_admin on public.access_sessions;
drop policy if exists access_visits_read_admin on public.access_visits;

create policy access_devices_read_admin
    on public.access_devices for select to authenticated
    using (public.is_access_monitor_admin());
create policy access_sessions_read_admin
    on public.access_sessions for select to authenticated
    using (public.is_access_monitor_admin());
create policy access_visits_read_admin
    on public.access_visits for select to authenticated
    using (public.is_access_monitor_admin());
