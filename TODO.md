# TODO.md — Riff Theory: Roadmap de Melhorias

Backlog organizado a partir do mapa mental "Prioridades de melhorias para o app de guitarra".
As tarefas estão agrupadas por nível de prioridade e seguem, dentro de cada grupo, a ordem
sugerida de implementação (1 → 5) indicada no mapa.

---
<details>
      <summary>🔴 Prioridade máxima</summary>
      
## 🔴 Prioridade máxima — base essencial e rápida de entregar
> Estrutura fundamental para o app não afastar quem está começando; validar com uso real antes de expandir.

### 1. Fundar o app
- [x] **Conteúdo para iniciantes**: revisar telas/textos para não afastar quem está começando —
      explicar sem excesso de teoria, com exemplos simples e diretos.
- [x] **Experiência mais prática**: transformar informação em ação (tocar, testar, comparar,
      repetir) — o app precisa ser útil para *tocar*, não só para consultar. Melhoria transversal,
      impacta todas as outras áreas.
- [x] **Versão beta**: lançar uma versão enxuta o quanto antes para reduzir risco e acelerar a
      validação real; evitar gastar tempo demais antes de confirmar o que é mais útil.
- [x] **Testes com músicos**: validar com guitarristas, alunos e músicos de igreja antes de
      ampliar o escopo; ajuda a descobrir o que realmente faz diferença no dia a dia e a corrigir
      prioridades com base em uso real (não só em suposição).
      
</details>

---

<details>
      <summary>🟠 Prioridade alta</summary>
      
## 🟠 Prioridade alta — valor imediato para o usuário tocar melhor

### 2. Entregar utilidade imediata
- [x] **Acordes mais práticos**: incluir diferentes formas de tocar o mesmo acorde; facilita a
      aplicação em músicas reais e reduz a dependência do desenho básico.
- [x] **Explicação de sonoridade**: mostrar como cada acorde/posição soa, ajudando o usuário a
      escolher a melhor forma de tocar em cada contexto (mais musical, menos apenas visual).
- [x] **Sistema de sugestões**: recomendar automaticamente opções em vez de só listar
      informações — reduz esforço de decisão. Pode começar simples e evoluir depois.
- [x] **Aprendizado gradual**: organizar o conteúdo como trilha de estudo progressiva, para o
      usuário avançar sem se perder em excesso de informação (sensação de caminho claro, melhora
      retenção).

</details>

---


<details>
      <summary>🟡 Prioridade média</summary>
      

## 🟡 Prioridade média — núcleo harmônico do app

### 3. Estruturar a teoria principal
- [x] **Campo harmônico**: já implementado (`calcCampoHarmonico` em `util.js`) — cria uma base
      para graus, funções e relações entre acordes; serve de estrutura para várias outras áreas
      do sistema.
- [x] **Harmonia aplicada**: conectar teoria com prática musical (ex: sugerir progressões comuns
      usando o campo harmônico já calculado). Depende de uma base harmônica já organizada.
- [x] **Escalas por contexto**: organizar escalas maiores, menores, pentatônicas e modos de forma
      fácil de consultar; precisa estar bem categorizado para não virar uma lista confusa.
- [x] **Relação escala-acorde**: mostrar quais escalas combinam com cada acorde/progressão,
      fortalecendo o uso prático da teoria no estudo e no improviso. Funciona melhor depois que o
      campo harmônico estiver bem definido.

</details>

---


<details>
      <summary>🟣 Prioridade média-alta</summary>
      

## 🟣 Prioridade média-alta — recursos de criação e improviso

### 4. Expandir para uso musical avançado
- [x] **Improvisação guiada**: dar sugestões de notas e caminhos para improvisar melhor, ajudando
      a transformar conhecimento em execução musical. Pode começar com orientações simples e
      evoluir em profundidade.
- [x] **Arpejos**: incluir estudo de arpejos para solo e acompanhamento; complementa bem o campo
      harmônico e a relação escala-acorde.
- [x] **Sobreposições de escalas**: sugerir pentatônicas e outras combinações úteis sobre acordes,
      trazendo riqueza musical e opções mais criativas. Faz mais sentido depois do básico
      consolidado.

</details>

---


<details>
      <summary>🟢 Prioridade de especialização</summary>
      

## 🟢 Prioridade de especialização — para aprofundar o app

### 5. Adicionar camadas de especialização
- [x] **Sonoridade por estilo**: separar sons e padrões por igreja, rock, pop, blues e outros
      estilos, ajudando o usuário a aplicar o conteúdo em contextos reais. Pode vir depois do
      núcleo principal estar pronto.
- [x] **Guia de timbres**: mostrar como chegar em timbres parecidos com bandas/referências
      conhecidas — aumenta muito o valor percebido do app, mas exige boa curadoria e pode crescer
      por etapas.
- [x] **Ajustes de equipamento**: explicar influência de pedal, amp, captador, guitarra e pegada;
      complementa o guia de timbres e a sonoridade por estilo. Útil para músicos mais dedicados,
      fase posterior.

</details>

---


<details>
      <summary>🔵 Prioridade avançada</summary>
      

## 🔵 Prioridade avançada — profundidade e expansão

- [x] **Conteúdo para avançados**: material mais profundo para quem já toca há mais tempo, sem
      simplificar demais o app; ajuda a reter usuários experientes. Deve vir depois que a base
      estiver consistente.
- [x] **Tirar música de ouvido**: seção para o usuário descobrir acordes e progressões sozinho.
      Alto valor pedagógico, porém mais complexa de estruturar — pode ser uma das fases mais
      fortes do produto, mas não a primeira.
- [x] **Sonoridade por estilo e timbre como trilha de evolução**: usar essas camadas para permitir
      crescer por módulos sem travar o lançamento — boa estratégia para transformar o app em
      plataforma completa.

</details>

---

## Ordem sugerida de implementação (resumo)
1. **Fundar o app** — base essencial, versão beta, testes com músicos
2. **Entregar utilidade imediata** — acordes práticos, sugestões, aprendizado gradual
3. **Estruturar a teoria principal** — campo harmônico ✅, harmonia aplicada, escalas por contexto
4. **Expandir para uso musical avançado** — improvisação, arpejos, sobreposição de escalas
5. **Adicionar camadas de especialização** — estilo, timbre, equipamento, conteúdo avançado

---


## Monitor de acessos — proteção antiabuso e métricas diárias

- [x] Revogar a gravação direta do navegador para a role `anon`; somente `service_role` pode registrar entradas.
- [x] Aplicar limite por identificador de dispositivo e criar relatórios por dia de São Paulo, sem apagar o histórico na virada do dia.
- [x] Remover o uso de IP pelo Riff Theory e documentar o processamento técnico externo necessário ao Turnstile.
- [ ] Configurar as chaves Turnstile, implantar a Edge Function e reativar a coleta protegida.
- [ ] Publicar o painel atualizado e validar `/admin/acessos` com uma conta autorizada.


## Auditoria da landing page — melhorias aplicadas (17/10/2026)

- [x] Hero com um CTA primário padronizado ("Testar no braço"), benefício de teste em cerca de 1 minuto e CTA secundário rebaixado a link.
- [x] Repetição de CTA principal após o bloco de confiança e no convite final, com microcopy "sem conta".
- [x] Prova social real mantida no hero, com nota, quantidade de avaliações e link para ler; sem inventar depoimentos.
- [x] Garantias de confiança destacadas: sem cartão, progresso no navegador e transparência sobre o envio de perguntas ao Thonic.
- [x] Quadro "Grátis para testar" versus "Premium", explicitando cadastro e a transparência sobre limites variáveis do Thonic sem inventar números.
- [x] Mini tutorial com expectativa de tempo e correção da prévia do acorde exibido no hero.
- [x] Título descritivo adicionado à imagem-chave do hero para SEO.
- [ ] Publicar as alterações no repositório/deploy após validação e acesso de publicação.

## Thonic agêntico — incremento do RT Premium
- [x] **Executar ações dentro do site:** “Uma versão do Thonic que consegue fazer coisas dentro do site por você, igual criar tablaturas ou bases de tablatura”; oferecer uma base inicial baseada em progressão e abri-la como rascunho no editor de tablaturas existente, para o usuário revisar e editar.
- [x] **Criar guia personalizado:** “consegue criar um guia personalizado para você usando o geral do site como base”; coletar foco/dificuldade, nível e tempo disponível, enviar esses dados ao Thonic somente quando solicitado e contextualizar o guia com os recursos atuais do Riff Theory.
- [x] **Ficha de exercícios interativa e exportável:** “criar uma planilha exercícios focados nas suas dificuldades. Não só aquele markdown, uma planilha/pdf mesmo junto com coisas interativas”; apresentar exercícios personalizados com checklist/progresso local e permitir imprimir/salvar como PDF pelo navegador.
- [ ] **Mensagens interativas geradas dinamicamente pela IA (opcional):** “E/ou então colocar para o Thonic conseguir gerar mensagens interativas”; o Studio já oferece controles e checklists interativos, mas respostas de IA convertidas em ações/cartões dinâmicos ficam para uma etapa posterior.
- [x] **Braço interativo na prática:** “E coloca para a prática ter o braço interativo”; oferecer acesso direto ao braço interativo já existente como parte do fluxo de estudo Premium, sem duplicar o componente.
