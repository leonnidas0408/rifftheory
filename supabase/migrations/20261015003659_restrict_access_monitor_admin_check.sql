-- Remove permissões explícitas herdadas para o teste de autorização.
-- A coleta anônima consentida usa outra função e continua habilitada.
revoke all on function public.is_access_monitor_admin() from public, anon;
grant execute on function public.is_access_monitor_admin() to authenticated;

-- Deixa explícito que clientes não podem ler a lista privada de administradores.
drop policy if exists access_monitor_admins_deny_select on public.access_monitor_admins;
create policy access_monitor_admins_deny_select
    on public.access_monitor_admins for select to anon, authenticated
    using (false);
