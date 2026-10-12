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
- O Chatbot pode ser usado por visitantes sem sessão Google; se houver uma sessão, a interface envia o access token.
- A API do Chatbot não exige autenticação; limita o uso por IP em janelas curtas e valida tamanho/formato do histórico antes de chamar a Groq.
- O limitador em memória é de melhor esforço por instância serverless e não equivale a uma cota global persistente.
- Sem variáveis Supabase, a aplicação informa que o login ainda não foi configurado em vez de simular autenticação.

## 5. Teste de aceite

1. Abrir a aplicação sem sessão e confirmar que o Chatbot permite enviar uma pergunta.
2. Confirmar que uma conversa sem token chega à API e que mensagens inválidas/grandes são rejeitadas.
3. Confirmar que excesso de chamadas pelo mesmo IP retorna HTTP 429.
4. Testar o login Google separadamente e confirmar que avatar e nome aparecem na navegação.
