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
- Não alterar o fluxo de login, avaliações, Supabase ou chatbot.
- Não introduzir dependências novas.
- Manter a cascata CSS modular e a interface em português.
- Áudio deve ser local via Web Audio API, sem enviar dados para servidor.
