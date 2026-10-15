-- Fecha a gravação direta via Data API enquanto os registros passam pelo endpoint server-side.
-- A chave service_role permanece apenas no backend; nunca deve ser incluída no navegador.
revoke execute on function public.register_anonymous_access(text, text, text, text)
    from public, anon, authenticated;
grant execute on function public.register_anonymous_access(text, text, text, text)
    to service_role;
