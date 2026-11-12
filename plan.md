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
- Não alterar o fluxo de login, avaliações ou chatbot; as mudanças no Supabase ficam limitadas ao monitor de acessos já aprovado.
- Não introduzir dependências novas.
- Manter a cascata CSS modular e a interface em português.
- Áudio deve ser local via Web Audio API, sem enviar dados para servidor.

## Atualização de escopo — monitor de acessos (15/10/2026)
- Manter a contagem consentida por identificador aleatório de navegador, sem usar contas Google para identificar visitantes.
- Remover a gravação direta do cliente; aceitar gravações apenas via Edge Function com validação server-side do Cloudflare Turnstile, assinatura HMAC do identificador e limites por dispositivo.
- O Riff Theory não coleta, armazena nem deriva IP. A Cloudflare pode processar dados técnicos da conexão ao executar o desafio.
- Exibir totais por dia de São Paulo, navegadores pseudônimos únicos, sessões e média de entradas por navegador; preservar o histórico em vez de apagar contadores na virada do dia.
- Exigir consentimento opcional; recusar ou revogar continua permitindo o uso do site.


## Plano de continuidade — primeira rodada de usabilidade (12/11/2026)

### Objetivo e escopo
Aplicar correções de baixo risco observadas na auditoria pública, sem reescrever ferramentas musicais nem mudar serviços: (1) remover a navegação horizontal redundante, usando a sidebar no desktop e a barra móvel já existente em telas pequenas; (2) deixar o consentimento do monitor de acessos dentro do fluxo da página, com escolhas explícitas de permitir ou não permitir; (3) retirar do hero da landing page a nota/contagem fixa de avaliações, mantendo o acesso à seção de avaliações como fonte única dos números atualizados.

### Implementação e estrutura existente
- `src/App.jsx`: mantém o monitor apenas no fluxo principal do app.
- `src/components/Conteudo.jsx`: organiza a barra de consentimento, a navegação e a tela ativa; remove a segunda faixa de navegação.
- `src/components/AccessConsent.jsx` e `src/components/AccessConsent.css`: apresentam informação compacta, detalhes acessíveis e as escolhas de consentimento.
- `src/components/pages/Home.jsx`: elimina a nota e contagem hard-coded no hero; preserva o link para avaliações e os relatos já existentes.
- `src/assets/css/01-navigation.css` e `src/assets/css/06-responsive.css`: continuam responsáveis, respectivamente, pela navegação desktop/móvel e breakpoints.
- `TODO.md`: registra os critérios de cada resultado e só marca como concluído depois de build/teste.

### Restrições
Não alterar a autenticação, o fluxo do Thonic, a coleta server-side, o esquema ou os dados do Supabase, nem a lógica de publicação de avaliações. A opção de recusa deve salvar `declined`, que já é compatível com a função existente, e jamais disparar `registrarAcessoAnonimo()`. Não introduzir dependências. Manter desktop em sidebar, mobile em bottom navigation, português e a identidade visual atual.

### Verificação prevista
Validação final: `npm test` passou (12/12); `node node_modules/vite/bin/vite.js build` passou; preview verificado em desktop e em 375 × 812; a recusa gravou `declined` sem requisição de registro; a sidebar recolheu e reabriu; nenhuma navegação duplicada permaneceu. O build mantém um aviso de bundle JS de 725,9 kB (limite informativo de 500 kB). Após restaurar artefatos, `npm run build` ficou indisponível porque o repositório rastreia um link quebrado em `node_modules/.bin/vite`; o bundle final foi validado invocando o Vite diretamente. O trabalho será entregue em branch/preview. Não promover nem publicar em produção sem confirmação do usuário.


### Ajuste após validação móvel
A captura em 375 px mostrou que “Prática” ficava fora dos primeiros destinos visíveis do menu com rolagem horizontal. Nesta mesma rodada, priorizar esse destino no início da lista e tornar a instrução de deslizar explícita para pessoas usando teclado/leitor de tela; manter as demais ferramentas acessíveis no menu móvel.

### Segunda correção móvel
A captura também mostrou o CTA fixo de trilha e o botão flutuante do Thonic sobrepondo o hero em viewport estreita. `Conteudo.jsx` observa a interseção do hero e aplica uma classe de estado; em larguras móveis, `06-responsive.css` oculta os dois overlays enquanto o hero está na viewport. O CTA primário dentro do próprio hero continua disponível. Quando o hero sai de vista, os controles fixos reaparecem. Nenhuma mudança em serviços ou coleta de dados.

Validação desta correção: em 375 × 812, os dois overlays estão `hidden` no topo, o CTA primário do hero permanece visível e ambos reaparecem ao rolar além do hero. Em 1280 × 900, o FAB permanece visível e o CTA móvel permanece oculto. `npm test` passou (12/12), build Vite passou e `git diff --check` está limpo; build continua com o aviso conhecido de bundle acima de 500 kB.
