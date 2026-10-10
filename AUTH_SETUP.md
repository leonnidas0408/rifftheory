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
```

A chave `SUPABASE_ANON_KEY` é usada para validar o Bearer token da sessão. Não coloque uma service role key no navegador.

## 4. Comportamento implementado

- Visitante vê **Entrar com Google** na navegação.
- Usuário autenticado vê nome, foto do Google e botão **Sair**.
- O Chatbot mostra uma tela de login para visitantes.
- A interface envia o access token na chamada da IA.
- A API valida o token no Supabase antes de chamar a Groq.
- Uma chamada sem token recebe HTTP 401.
- Sem variáveis Supabase, a aplicação informa que o login ainda não foi configurado em vez de simular autenticação.

## 5. Teste de aceite

1. Abrir a aplicação sem sessão: o botão de login deve aparecer.
2. Clicar em **Entrar com Google** e concluir o consentimento.
3. Confirmar que o avatar e o nome aparecem na navegação.
4. Abrir o Chatbot e enviar uma pergunta.
5. Sair da conta e confirmar que o Chatbot volta a ficar bloqueado.
6. Fazer uma chamada direta a `/api/chat` sem `Authorization` e confirmar HTTP 401.
