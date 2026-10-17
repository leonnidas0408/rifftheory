begin;

create table if not exists public.thonic_chat_rate_limits (
    user_id uuid primary key references auth.users (id) on delete cascade,
    request_times timestamptz[] not null default '{}'::timestamptz[],
    updated_at timestamptz not null default pg_catalog.now()
);

alter table public.thonic_chat_rate_limits enable row level security;
revoke all on table public.thonic_chat_rate_limits from public, anon, authenticated;

create or replace function public.consume_thonic_chat_quota()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid := auth.uid();
    v_now timestamptz := pg_catalog.clock_timestamp();
    v_request_times timestamptz[];
    v_recent_times timestamptz[];
    v_minute_count integer;
begin
    if v_user_id is null then
        raise exception 'authentication required' using errcode = '28000';
    end if;

    insert into public.thonic_chat_rate_limits (user_id, request_times, updated_at)
    values (v_user_id, '{}'::timestamptz[], v_now)
    on conflict (user_id) do nothing;

    select limits.request_times
      into v_request_times
      from public.thonic_chat_rate_limits as limits
     where limits.user_id = v_user_id
     for update;

    select
        coalesce(pg_catalog.array_agg(events.requested_at order by events.requested_at), '{}'::timestamptz[]),
        count(*) filter (where events.requested_at > v_now - interval '1 minute')::integer
      into v_recent_times, v_minute_count
      from pg_catalog.unnest(v_request_times) as events(requested_at)
     where events.requested_at > v_now - interval '1 hour';

    if v_minute_count >= 5 or pg_catalog.cardinality(v_recent_times) >= 30 then
        update public.thonic_chat_rate_limits
           set request_times = v_recent_times,
               updated_at = v_now
         where user_id = v_user_id;
        return false;
    end if;

    update public.thonic_chat_rate_limits
       set request_times = pg_catalog.array_append(v_recent_times, v_now),
           updated_at = v_now
     where user_id = v_user_id;

    return true;
end;
$$;

revoke all on function public.consume_thonic_chat_quota() from public, anon;
grant execute on function public.consume_thonic_chat_quota() to authenticated;

notify pgrst, 'reload schema';

commit;
