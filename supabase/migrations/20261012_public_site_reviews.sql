begin;

-- One-time additive migration. Existing table, view and trigger function names were checked first.
create table public.site_reviews (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null unique references auth.users (id) on delete cascade,
    display_name text not null
        check (char_length(btrim(display_name)) between 2 and 254),
    rating smallint not null check (rating between 1 and 5),
    comment text not null default '' check (char_length(comment) <= 500),
    public_consent boolean not null check (public_consent is true),
    created_at timestamptz not null default pg_catalog.now(),
    updated_at timestamptz not null default pg_catalog.now()
);

alter table public.site_reviews enable row level security;

revoke all on table public.site_reviews from public, anon, authenticated;
grant select on table public.site_reviews to authenticated;
grant insert (user_id, display_name, rating, comment, public_consent)
    on table public.site_reviews to authenticated;
-- Upsert includes user_id in its conflict update; RLS below still pins it to auth.uid().
grant update (user_id, display_name, rating, comment, public_consent)
    on table public.site_reviews to authenticated;
grant delete on table public.site_reviews to authenticated;

create policy site_reviews_owner_select
    on public.site_reviews for select to authenticated
    using ((select auth.uid()) = user_id);

create policy site_reviews_owner_insert
    on public.site_reviews for insert to authenticated
    with check ((select auth.uid()) = user_id and public_consent is true);

create policy site_reviews_owner_update
    on public.site_reviews for update to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id and public_consent is true);

create policy site_reviews_owner_delete
    on public.site_reviews for delete to authenticated
    using ((select auth.uid()) = user_id);

create function public.riff_sync_site_review_display_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    account_name text;
begin
    select coalesce(
        nullif(pg_catalog.btrim(raw_user_meta_data ->> 'full_name'), ''),
        nullif(pg_catalog.btrim(raw_user_meta_data ->> 'name'), ''),
        nullif(pg_catalog.btrim(email), '')
    )
    into account_name
    from auth.users
    where id = new.user_id;
    if account_name is null then
        raise exception 'Não foi possível identificar a conta Google desta avaliação.';
    end if;
    new.display_name := account_name;
    return new;
end;
$$;

revoke all on function public.riff_sync_site_review_display_name()
    from public, anon, authenticated;
create trigger site_reviews_sync_display_name
    before insert or update of user_id, display_name on public.site_reviews
    for each row execute function public.riff_sync_site_review_display_name();

create function public.riff_set_site_reviews_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at := pg_catalog.now();
    return new;
end;
$$;

revoke all on function public.riff_set_site_reviews_updated_at()
    from public, anon, authenticated;
create trigger site_reviews_set_updated_at
    before update on public.site_reviews
    for each row execute function public.riff_set_site_reviews_updated_at();

-- This owner-executed projection is intentionally public. It exposes only fields
-- consented for publication; auth user_id and private metadata remain in the table.
create view public.site_reviews_public
with (security_barrier = true)
as
select id, display_name, rating, comment, created_at
from public.site_reviews
where public_consent is true;

comment on view public.site_reviews_public is
    'Public projection of consented reviews; excludes auth user_id and private metadata.';

revoke all on table public.site_reviews_public from public, anon, authenticated;
grant select on table public.site_reviews_public to anon, authenticated;

commit;
