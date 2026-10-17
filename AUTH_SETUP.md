# Configuração do login Google

A autenticação foi implementada com Supabase Auth. Para ativá-la no ambiente publicado, é necessário configurar o projeto Supabase e as variáveis de ambiente do deploy.

## 1. Criar ou selecionar o projeto Supabase

No painel do Supabase, abra **Authentication → Providers → Google** e habilite o provedor. Use as credenciais OAuth criadas no Google Cloud Console.

Em **Authentication → URL Configuration**, configure:

- Site URL: `https://SEU-DOMINIO-PUBLICO`
- Redirect URL adicional: `https://SEU-DOMINIO-PUBLICO`

Se o domínio de produção ou preview mudar, inclua cada origem autorizada necessária.

## 2. Variáveis do front-end

No ambiente de build, configure:

```text
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

## 3. Variáveis da API

Na função serverless, configure:

```text
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon-publica
GROQ_API_KEY=sua-chave-groq
CATALOG_OWNER_USER_ID=uuid-do-usuario-proprietario
```

A chave `SUPABASE_ANON_KEY` é usada para validar o Bearer token da sessão. Não coloque uma service role key no navegador.

`CATALOG_OWNER_USER_ID` é o UUID do usuário autorizado a ler `/api/catalog`;
sem essa variável o endpoint fica desabilitado (503), e outros usuários recebem 403.

## 4. Comportamento implementado

- Visitante vê **Entrar com Google** na navegação.
- Usuário autenticado vê nome, foto do Google e botão **Sair**.
- O Chatbot exige uma sessão Google válida; sem sessão, a interface apresenta o bloqueio de login.
- A API do Chatbot valida o Bearer token no Supabase antes de chamar a Groq. Sem token ou com token inválido, responde HTTP 401; se as variáveis de autenticação do servidor estiverem ausentes ou a validação estiver indisponível, responde HTTP 503.
- O formulário de avaliação exige login Google e publica a nota, o comentário e o nome da conta Google; se o nome não estiver disponível, publica o e-mail da conta. Esse identificador é somente leitura no formulário e também é derivado novamente por um trigger do Supabase.
- O chatbot consome a cota persistente por usuário na função Supabase `consume_thonic_chat_quota`, com máximo de 5 chamadas por janela móvel de 1 minuto e 30 por janela móvel de 1 hora. A migration `20261017014723_thonic_chat_persistent_rate_limit.sql` já foi aplicada ao Supabase de produção. Se a função estiver indisponível, a API falha fechada com HTTP 503 em vez de enviar a chamada à Groq sem aplicar a cota.
- O deployment inclui `Content-Security-Policy-Report-Only`, que não bloqueia recursos. Revise as violações no console do navegador nos fluxos reais (login, Turnstile, tuner e chatbot) e só então considere uma política de aplicação. Não há endpoint central de coleta de relatórios CSP configurado.
- Sem variáveis Supabase, a aplicação informa que o login ainda não foi configurado em vez de simular autenticação.

## 5. Teste de aceite

1. Abrir a aplicação sem sessão e confirmar que o Chatbot bloqueia o envio e oferece login Google.
2. Fazer uma chamada direta a `/api/chat` sem `Authorization` e confirmar HTTP 401, sem chamada à Groq.
3. Confirmar que um token válido é verificado no Supabase antes da chamada à Groq e que tokens inválidos recebem HTTP 401.
4. Confirmar que excesso de chamadas retorna HTTP 429 e que mensagens inválidas/grandes continuam sendo rejeitadas.
5. Salvar e apagar uma avaliação; confirmar que o identificador público vem da conta Google, não pode ser digitado e que a avaliação pública é atualizada/removida corretamente.
6. Testar o login Google separadamente e confirmar que avatar e nome aparecem na navegação.
