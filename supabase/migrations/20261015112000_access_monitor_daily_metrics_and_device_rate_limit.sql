-- Limites por dispositivo. Não coleta, grava nem deriva IP.
-- A função é chamada exclusivamente pelo endpoint Edge após validar Turnstile e assinatura HMAC.
create or replace function public.register_anonymous_access(
    p_device_id text,
    p_session_id text,
    p_path text default null,
    p_user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_now timestamptz := pg_catalog.clock_timestamp();
    v_day_start timestamptz;
    v_recent_entries integer;
    v_today_entries integer;
begin
    if p_device_id is null or pg_catalog.char_length(p_device_id) < 16 or pg_catalog.char_length(p_device_id) > 128 then
        raise exception using errcode = '22023', message = 'invalid_device_id';
    end if;
    if p_session_id is null or pg_catalog.char_length(p_session_id) < 16 or pg_catalog.char_length(p_session_id) > 128 then
        raise exception using errcode = '22023', message = 'invalid_session_id';
    end if;

    -- Serializa registros do mesmo identificador para que chamadas concorrentes
    -- não ultrapassem o limite por dispositivo.
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_device_id, 0));

    insert into public.access_devices (device_id, first_seen, last_seen, total_entries, total_sessions, last_path, user_agent, consented_at)
    values (p_device_id, v_now, v_now, 0, 0, left(p_path, 512), left(p_user_agent, 512), v_now)
    on conflict (device_id) do nothing;

    v_day_start := pg_catalog.date_trunc('day', v_now at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo';
    select count(*)::integer into v_recent_entries
    from public.access_visits
    where device_id = p_device_id
      and visited_at >= v_now - interval '5 minutes';
    select count(*)::integer into v_today_entries
    from public.access_visits
    where device_id = p_device_id
      and visited_at >= v_day_start;

    if v_recent_entries >= 30 or v_today_entries >= 300 then
        raise exception using errcode = 'P0001', message = 'access_rate_limited';
    end if;

    update public.access_devices
    set last_seen = v_now,
        total_entries = total_entries + 1,
        last_path = left(p_path, 512),
        user_agent = coalesce(left(p_user_agent, 512), user_agent)
    where device_id = p_device_id;

    insert into public.access_sessions (device_id, session_id, started_at)
    values (p_device_id, p_session_id, v_now)
    on conflict (device_id, session_id) do nothing;

    update public.access_devices
    set total_sessions = (
        select count(*)::integer
        from public.access_sessions
        where access_sessions.device_id = p_device_id
    )
    where device_id = p_device_id;

    insert into public.access_visits (device_id, session_id, visited_at, path, user_agent)
    values (p_device_id, p_session_id, v_now, left(p_path, 512), left(p_user_agent, 512));
end;
$$;

revoke all on function public.register_anonymous_access(text, text, text, text)
    from public, anon, authenticated;
grant execute on function public.register_anonymous_access(text, text, text, text)
    to service_role;

create index if not exists access_visits_time_idx
    on public.access_visits (visited_at desc);

-- Métricas diárias em horário de São Paulo. Os eventos originais permanecem
-- preservados; a virada do dia fecha uma linha histórica sem apagar contadores.
create or replace view public.access_daily_device_summary
with (security_invoker = true)
as
select
    (v.visited_at at time zone 'America/Sao_Paulo')::date as access_day,
    v.device_id,
    count(*)::integer as entries,
    count(distinct v.session_id)::integer as sessions,
    min(v.visited_at) as first_visit,
    max(v.visited_at) as last_visit
from public.access_visits v
group by (v.visited_at at time zone 'America/Sao_Paulo')::date, v.device_id;

create or replace view public.access_daily_summary
with (security_invoker = true)
as
select
    d.access_day,
    count(*)::integer as unique_devices,
    sum(d.entries)::integer as total_entries,
    sum(d.sessions)::integer as total_sessions,
    round(sum(d.entries)::numeric / nullif(count(*), 0), 2) as average_entries_per_device
from public.access_daily_device_summary d
group by d.access_day;

revoke all on public.access_daily_device_summary, public.access_daily_summary from public, anon;
grant select on public.access_daily_device_summary, public.access_daily_summary to authenticated;
