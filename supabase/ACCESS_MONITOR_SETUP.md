# Configuração do painel de acessos

O painel fica fora da navegação pública em `/admin/acessos`, reutiliza o login Google e libera métricas somente para administradores cadastrados no Supabase. As contagens são por navegador pseudônimo; não são contas Google nem pessoas identificadas.

## Proteção antiabuso

O navegador não grava mais diretamente no banco. A execução de `register_anonymous_access` foi revogada para `anon` e `authenticated`; somente `service_role` pode executá-la, por meio da Edge Function `register-anonymous-access`. A função valida o token do Cloudflare Turnstile no servidor antes de gravar. O ID aleatório do navegador recebe uma assinatura HMAC server-side para impedir que o cliente altere o identificador sem nova verificação.

O Riff Theory não lê, grava nem deriva IP para o monitoramento ou para o rate limit, e o novo fluxo não envia caminho de página nem user-agent ao banco. O limite atual é de 30 entradas por dispositivo a cada 5 minutos e 300 por dia, calculado no banco. Como não há identificação por IP, alguém determinado ainda pode criar outro navegador e resolver novos desafios; a proteção reduz o abuso, mas não garante ausência absoluta de bots. A verificação do Turnstile é feita pela Cloudflare, que pode processar dados técnicos de conexão durante o desafio.

Até as chaves do Turnstile serem configuradas, o monitoramento fica pausado; o restante do site continua funcionando normalmente. Não coloque segredos no código, no GitHub, no navegador nem em mensagens.

## Configurar o Turnstile

1. Crie um widget Cloudflare Turnstile para o host `rifftheory.vercel.app`.
2. Na Vercel, configure `VITE_TURNSTILE_SITE_KEY` com o **Site Key** público para o ambiente Production. Se usar Preview, configure-o separadamente.
3. No Supabase Dashboard do projeto `RiffTheory`, abra **Edge Functions → Secrets** e salve o **Secret Key** com o nome `TURNSTILE_SECRET_KEY`. Não envie esse segredo pelo chat.
4. A Edge Function usa as chaves secretas padrão fornecidas pelo Supabase no backend. Não exponha `SUPABASE_SECRET_KEYS` nem `service_role` no front-end.
5. Publique o código do repositório e implante `supabase/functions/register-anonymous-access/index.ts` com `verify_jwt=false`. A função é pública para receber visitantes sem login, mas valida o Turnstile no servidor e só então usa a chave administrativa para gravar.

Se qualquer chave estiver ausente, a gravação deve falhar fechada. O consentimento não bloqueia o site; apenas deixa de enviar a métrica.

## Migrações

No projeto Supabase do Riff Theory, as migrações do monitor devem estar aplicadas nesta ordem:

1. `migrations/20261014_anonymous_access_monitor.sql`
2. `migrations/20261014190000_access_monitor_admin_dashboard.sql`
3. `migrations/20261015003659_restrict_access_monitor_admin_check.sql`
4. `migrations/20261015110000_restrict_access_monitor_writes_to_server.sql`
5. `migrations/20261015112000_access_monitor_daily_metrics_and_device_rate_limit.sql`
6. `migrations/20261015121000_remove_unused_access_visits_time_index.sql`

As migrações 4 e 5 fecham a gravação pública, aplicam os limites por dispositivo e criam as views diárias protegidas por RLS. A migração 6 remove um índice sem uso, sem alterar registros. A leitura continua condicionada ao email autenticado estar ativo em `access_monitor_admins`.

## Métricas diárias

`access_daily_summary` mostra, por dia de `America/Sao_Paulo`, acessos totais, navegadores pseudônimos únicos, sessões e média de acessos por navegador. `access_daily_device_summary` detalha a quantidade diária por identificador. O painel exibe os últimos 30 dias com registros, permite escolher uma data e calcula variação contra o dia anterior.

A virada do dia não apaga eventos nem zera o histórico: cada data fica separada para comparar crescimento. Os relatórios são calculados a partir dos eventos preservados em `access_visits`. A tabela não possui política automática de exclusão.

## Abrir o painel

Entre no Riff Theory com uma conta Google autorizada e acesse `https://rifftheory.vercel.app/admin/acessos`. Para cadastrar ou reativar um administrador, use o SQL Editor do mesmo projeto:

```sql
insert into public.access_monitor_admins (email)
select lower(trim('SEU_EMAIL_GOOGLE'))
limit 1
on conflict (email) do update set active = true;
```

Para revogar, defina `active = false` para o email correspondente.

## Qualidade e limites dos dados

O identificador é aleatório e local ao navegador. Limpar armazenamento, usar navegação privada ou trocar de navegador/dispositivo pode criar outro ID; portanto, “navegadores únicos” não significa pessoas únicas.

Os registros anteriores a 15/10/2026 às 13:58 (horário de Brasília) foram coletados antes do bloqueio da RPC pública e podem conter falsificações. Eles foram preservados, mas o painel os sinaliza como não verificados. Considere o crescimento confiável somente depois que o fluxo Turnstile estiver ativo.
