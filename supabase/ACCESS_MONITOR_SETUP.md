# Configuração do painel de acessos

O painel fica fora da navegação pública em `/admin/acessos`. Ele reutiliza o login Google já existente e só mostra os dados quando o email da conta estiver explicitamente autorizado no Supabase.

## 1. Aplicar a migração

Confirme se `migrations/20261014_anonymous_access_monitor.sql` já foi aplicada no projeto Supabase. Se ainda não foi, aplique-a primeiro para criar as tabelas e a view de resumo. Depois execute `migrations/20261014190000_access_monitor_admin_dashboard.sql` e, por último, `migrations/20261015003659_restrict_access_monitor_admin_check.sql`, no SQL Editor (ou aplique-as nessa ordem pelo fluxo já usado pelo projeto). Não coloque uma `service_role key` no navegador.

## 2. Autorizar a conta administrativa

No SQL Editor do mesmo projeto, substitua o marcador pelo email exato usado no login Google e execute:

```sql
insert into public.access_monitor_admins (email)
values (lower(trim('SEU_EMAIL_GOOGLE')))
on conflict (email) do update set active = true;
```

Para retirar acesso, execute:

```sql
update public.access_monitor_admins
set active = false
where email = lower(trim('SEU_EMAIL_GOOGLE'));
```

## 3. Abrir o painel

Entre no Riff Theory com essa mesma conta Google e acesse `https://rifftheory.vercel.app/admin/acessos`. Se a configuração de login Google não estiver ativa no projeto Supabase, habilite-a seguindo `AUTH_SETUP.md`.

## Métricas e limites

O painel mostra contagem de entradas e sessões, dias ativos e média de entradas por dia ativo, agrupadas por identificador aleatório armazenado no navegador. Não mostra nomes, emails, IPs, caminho da página ou user-agent. Navegadores diferentes, limpeza de armazenamento e navegação privada podem produzir identificadores diferentes; não é uma contagem de pessoas únicas garantida.

Esta configuração não apaga dados históricos já gravados, nem estabelece prazo de retenção. A migração restringe a leitura do painel aos administradores autorizados; a coleta continua dependente da decisão de consentimento armazenada no navegador. O aplicativo ainda não está publicado por estas instruções: é preciso aplicar a migração e publicar o código pelo fluxo autorizado do repositório.
