# Plano de implementação — melhorias do roadmap

## Objetivo
Transformar os itens do TODO em uma primeira versão funcional, prática e testável dentro de uma nova área **Prática**, sem remover as ferramentas existentes.

## Direção de produto
- **Experiência:** estúdio editorial de guitarra, direto ao instrumento.
- **Princípios:** uma próxima ação clara, teoria ligada a som e execução, progressão visível e conteúdo organizado por contexto.
- **Paleta/interação:** reutilizar tokens e componentes existentes; cartões curtos, botões de ação e áudio iniciado por ação explícita do usuário.

## Entregas
1. **Prática guiada e base:** rotas de iniciante, progresso modular, exercícios e badge beta.
2. **Acordes práticos:** voicings alternativos, comparação de uso e reprodução de som.
3. **Harmonia aplicada:** tonalidade, campo harmônico, progressões sugeridas e relação escala–acorde.
4. **Improviso:** notas-alvo, caminhos guiados, arpejos e sobreposições de escalas.
5. **Especialização:** estilos, guia de timbres e orientações de equipamento.
6. **Avançado e ouvido:** conteúdos aprofundados e exercício de identificação auditiva.

## Estrutura
- `src/components/pages/Pratica.jsx`: página e interações dos módulos.
- `src/components/pages/praticaData.js`: catálogo curado e funções musicais da área.
- `src/assets/css/13-pratica.css`: estilos isolados da nova área.
- `src/App.jsx`: entrada da página na navegação.
- `TODO.md`: status atualizado somente após validação do build.

## Restrições
- Manter o login Google do Thonic, mas não exigir Premium nem impor cota de mensagens pelo Riff Theory para o Thonic Básico gratuito.
- Selecionar o modelo Premium no servidor a partir do `app_metadata.plan` verificado pelo Supabase; nunca confiar no plano indicado pelo cliente.
- Preservar validação de sessão, limites por requisição e controles Premium de anexos; informar que a disponibilidade técnica do provedor pode variar.
- Não introduzir dependências novas.
- Manter a cascata CSS modular e a interface em português.
- Áudio deve ser local via Web Audio API, sem enviar dados para servidor.

## Atualização de escopo — níveis do Thonic (19/10/2026)
- Thonic Básico: uso gratuito sem cota de mensagens do Riff Theory; login Google continua necessário para abrir/salvar conversa.
- Thonic Premium: selecionar um modelo de IA mais avançado no backend e manter o envio de anexos como recurso Premium.
- A interface e a landing page devem explicar essa diferença sem prometer disponibilidade além dos limites técnicos do provedor.

## Atualização de escopo — monitor de acessos (15/10/2026)
- Manter a contagem consentida por identificador aleatório de navegador, sem usar contas Google para identificar visitantes.
- Remover a gravação direta do cliente; aceitar gravações apenas via Edge Function com validação server-side do Cloudflare Turnstile, assinatura HMAC do identificador e limites por dispositivo.
- O Riff Theory não coleta, armazena nem deriva IP. A Cloudflare pode processar dados técnicos da conexão ao executar o desafio.
- Exibir totais por dia de São Paulo, navegadores pseudônimos únicos, sessões e média de entradas por navegador; preservar o histórico em vez de apagar contadores na virada do dia.
- Exigir consentimento opcional; recusar ou revogar continua permitindo o uso do site.
