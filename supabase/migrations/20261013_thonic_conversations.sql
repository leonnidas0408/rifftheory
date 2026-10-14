begin;

create table public.thonic_conversations (
    user_id uuid primary key references auth.users (id) on delete cascade,
    messages jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default pg_catalog.now(),
    updated_at timestamptz not null default pg_catalog.now(),
    constraint thonic_conversations_messages_array check (jsonb_typeof(messages) = 'array')
);

alter table public.thonic_conversations enable row level security;

revoke all on table public.thonic_conversations from public, anon, authenticated;
grant select, insert, update on table public.thonic_conversations to authenticated;

create policy thonic_conversations_owner_select
    on public.thonic_conversations for select to authenticated
    using ((select auth.uid()) = user_id);

create policy thonic_conversations_owner_insert
    on public.thonic_conversations for insert to authenticated
    with check ((select auth.uid()) = user_id);

create policy thonic_conversations_owner_update
    on public.thonic_conversations for update to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

create function public.riff_set_thonic_conversation_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at := pg_catalog.now();
    return new;
end;
$$;

revoke all on function public.riff_set_thonic_conversation_updated_at()
    from public, anon, authenticated;

create trigger thonic_conversations_set_updated_at
    before update on public.thonic_conversations
    for each row execute function public.riff_set_thonic_conversation_updated_at();

commit;
