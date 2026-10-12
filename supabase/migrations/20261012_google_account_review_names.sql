begin;

-- Compatibilidade para projetos que já aplicaram a migration inicial com nome editável.
do $$
declare
    constraint_row record;
begin
    for constraint_row in
        select conname
        from pg_catalog.pg_constraint
        where conrelid = 'public.site_reviews'::pg_catalog.regclass
          and contype = 'c'
          and pg_catalog.pg_get_constraintdef(oid) ilike '%display_name%'
    loop
        execute pg_catalog.format(
            'alter table public.site_reviews drop constraint %I',
            constraint_row.conname
        );
    end loop;
end;
$$;

alter table public.site_reviews
    add constraint site_reviews_display_name_length_check
    check (char_length(btrim(display_name)) between 2 and 254);

create or replace function public.riff_sync_site_review_display_name()
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

drop trigger if exists site_reviews_sync_display_name on public.site_reviews;
create trigger site_reviews_sync_display_name
    before insert or update of user_id, display_name on public.site_reviews
    for each row execute function public.riff_sync_site_review_display_name();

-- Normaliza também avaliações já existentes para a identidade da conta vinculada.
update public.site_reviews as review
set display_name = coalesce(
    nullif(pg_catalog.btrim(account.raw_user_meta_data ->> 'full_name'), ''),
    nullif(pg_catalog.btrim(account.raw_user_meta_data ->> 'name'), ''),
    nullif(pg_catalog.btrim(account.email), '')
)
from auth.users as account
where account.id = review.user_id;

commit;
