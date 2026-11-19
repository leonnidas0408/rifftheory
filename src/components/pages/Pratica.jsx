import { useMemo, useState } from "react";
import Barra from "../Barra";
import PrettyPanel from "../PrettyPanel";
import {
  AVANCADO,
  CHAVES,
  ESCALAS_CONTEXTUAIS,
  ESTILOS,
  PROGRESSOES,
  TREINO_OUVIDO,
  VOICINGS,
  caminhoImproviso,
  gerarHarmonia,
  notasDaEscala,
  sugestoesParaAcorde,
} from "./praticaData";

const FREQUENCIAS = {
  C: 261.63,
  "C#": 277.18,
  D: 293.66,
  "D#": 311.13,
  E: 329.63,
  F: 349.23,
  "F#": 369.99,
  G: 392,
  "G#": 415.3,
  A: 440,
  "A#": 466.16,
  B: 493.88,
};
const AMOSTRAS_ACORDES = {
  C: "/audio/ccmixter/major-C.wav",
  D: "/audio/ccmixter/major-D.wav",
  E: "/audio/ccmixter/major-E.wav",
  F: "/audio/ccmixter/major-F.wav",
  G: "/audio/ccmixter/major-G.wav",
  A: "/audio/ccmixter/major-A.wav",
  Am: "/audio/ccmixter/minor-A.wav",
  Dm: "/audio/ccmixter/minor-D.wav",
  Em: "/audio/ccmixter/minor-E.wav",
};
const NOMES_NOTAS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const SEMITONS = { C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11 };

function notasDoAcorde(acorde) {
  const partes = acorde.match(/^([A-G](?:#|b)?)(.*)$/);
  if (!partes || SEMITONS[partes[1]] == null) return ["C4", "E4", "G4"];
  const [_, raiz, qualidade] = partes;
  const intervalos = qualidade.includes("dim") || qualidade.includes("°")
    ? [0, 3, 6]
    : /^m(?!aj)/.test(qualidade)
      ? [0, 3, 7]
      : [0, 4, 7];
  if (qualidade.includes("7")) intervalos.push(qualidade.includes("maj7") ? 11 : 10);
  return intervalos.map((semitom) => `${NOMES_NOTAS[(SEMITONS[raiz] + semitom) % 12]}4`);
}

function tocarNotas(notas, duracao = 0.85) {
  if (typeof window === "undefined") return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const agora = ctx.currentTime;
  notas.forEach((nome, indice) => {
    const nota = nome.replace(/[0-9]/g, "");
    const oitava = Number(nome.match(/[0-9]+/)?.[0] ?? 4);
    const base = FREQUENCIAS[nota] ?? 261.63;
    const frequencia = base * 2 ** (oitava - 4);
    const osc = ctx.createOscillator();
    const ganho = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = frequencia;
    ganho.gain.setValueAtTime(0.0001, agora + indice * 0.08);
    ganho.gain.exponentialRampToValueAtTime(0.18, agora + indice * 0.08 + 0.02);
    ganho.gain.exponentialRampToValueAtTime(
      0.0001,
      agora + indice * 0.08 + duracao,
    );
    osc.connect(ganho).connect(ctx.destination);
    osc.start(agora + indice * 0.08);
    osc.stop(agora + indice * 0.08 + duracao + 0.05);
  });
  window.setTimeout(() => ctx.close(), (duracao + 1) * 1000);
}

function tocarAcorde(acorde) {
  if (typeof window === "undefined") return;
  const amostra = AMOSTRAS_ACORDES[acorde];
  if (!amostra) {
    tocarNotas(notasDoAcorde(acorde));
    return;
  }
  const audio = new Audio(amostra);
  audio.volume = 0.9;
  audio
    .play()
    .catch(() =>
      tocarNotas(notasDoAcorde(acorde)),
    );
  window.setTimeout(() => {
    audio.pause();
    audio.currentTime = 0;
  }, 4200);
}

function SectionTitle({ eyebrow, title, children }) {
  return (
    <div className="roadmap-section-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}

function LessonGuide({ eyebrow, title, introduction, steps }) {
  return (
    <section className="lesson-guide" aria-label={title}>
      <div className="lesson-guide-heading">
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{introduction}</p>
      </div>
      <ol className="lesson-steps">
        {steps.map((step, index) => (
          <li key={step.title}>
            <span className="lesson-step-number">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <strong>{step.title}</strong>
              <p>{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function Pratica() {
  const [aba, setAba] = useState("começar");
  const [chave, setChave] = useState("C");
  const [acorde, setAcorde] = useState("C");
  const [progressao, setProgressao] = useState(["C", "G", "Am", "F"]);
  const [voicing, setVoicing] = useState(VOICINGS[0]);
  const [escala, setEscala] = useState(ESCALAS_CONTEXTUAIS[0]);
  const [ouvido, setOuvido] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState("");
  const harmonia = useMemo(() => gerarHarmonia(chave), [chave]);
  const notas = useMemo(
    () => notasDaEscala(chave, escala.tipo),
    [chave, escala],
  );
  const sugestoes = useMemo(() => sugestoesParaAcorde(acorde), [acorde]);
  const caminho = useMemo(() => caminhoImproviso(acorde), [acorde]);
  const arpejo = useMemo(
    () => notasDoAcorde(acorde).map((nota) => nota.replace(/[0-9]/g, "")),
    [acorde],
  );
  const formasAcorde = useMemo(
    () => VOICINGS.filter((item) => item.acorde === acorde),
    [acorde],
  );
  const audioOuvido = TREINO_OUVIDO[ouvido];

  function escolherAcorde(nome) {
    setAcorde(nome);
    setVoicing(VOICINGS.find((item) => item.acorde === nome) ?? null);
  }

  function adicionarAcordeProgressao(nome) {
    setProgressao((atual) => atual.length >= 8 ? atual : [...atual, nome]);
  }

  function usarProgressaoSugerida() {
    if (harmonia.length >= 6) {
      setProgressao([harmonia[0], harmonia[4], harmonia[5], harmonia[3]]);
      escolherAcorde(harmonia[0]);
    }
  }

  function selecionarTonalidade(novaChave) {
    setChave(novaChave);
    const novoCampo = gerarHarmonia(novaChave);
    if (novoCampo.length >= 6) {
      setProgressao([novoCampo[0], novoCampo[4], novoCampo[5], novoCampo[3]]);
      escolherAcorde(novoCampo[0]);
    }
  }

  function responderOuvido(resposta) {
    const certo = resposta === audioOuvido.resposta;
    setFeedback(
      certo
        ? "Acertou. Confie na sensação da tônica e repita."
        : `Quase. A resposta era ${audioOuvido.resposta}. Tente ouvir a nota mais estável.`,
    );
    setFeedbackType(certo ? "positive" : "negative");
  }

  return (
    <div className="pagina roadmap-page">
      <Barra titulo="Prática" />
      <section className="roadmap-hero">
        <div>
          <span className="eyebrow">Riff Theory · aulas práticas</span>
          <h1>Uma aula por tópico. Um passo por vez.</h1>
          <p>
            Escolha o assunto, siga a explicação em ordem e use os exercícios
            desta página para praticar o que acabou de aprender.
          </p>
        </div>
        <div className="roadmap-beta">
          <strong>5 aulas</strong>
          <span>com exemplos interativos</span>
        </div>
      </section>
      <nav className="roadmap-tabs" aria-label="Módulos de prática">
        {[
          ["começar", "Índice das aulas"],
          ["harmonia", "Acordes e progressões"],
          ["improviso", "Improvisação"],
          ["estilos", "Estilos e timbres"],
          ["ouvido", "Treino de ouvido"],
          ["composicao", "Criar sua música"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={aba === id ? "ativo" : ""}
            onClick={() => setAba(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {aba === "começar" && (
        <section className="lesson-index">
          <SectionTitle
            eyebrow="Por onde começar"
            title="Escolha uma aula"
          >
            Cada assunto tem explicação, exemplo e uma atividade logo abaixo.
            Comece por acordes e progressões; depois explore improvisação,
            estilos e treino de ouvido.
          </SectionTitle>
          <div className="lesson-catalog">
            {[
              ["01", "Acordes e progressões", "Aprenda o que é tonalidade, entenda os graus e monte C–G–Am–F passo a passo.", "harmonia"],
              ["02", "Improvisação", "Escolha notas do acorde, pratique o arpejo e entenda como resolver uma frase.", "improviso"],
              ["03", "Estilos e timbres", "Compare ritmo, timbre e dinâmica sem confundir equipamento com teoria.", "estilos"],
              ["04", "Treino de ouvido", "Ouça um acorde, escolha uma resposta e use o retorno para treinar de novo.", "ouvido"],
              ["05", "Criar sua música", "Transforme uma ideia em tema, progressão, melodia, estrutura e arranjo.", "composicao"],
            ].map(([numero, titulo, descricao, id]) => (
              <article className="lesson-catalog-card" key={id}>
                <span className="lesson-step-number">{numero}</span>
                <h3>{titulo}</h3>
                <p>{descricao}</p>
                <button type="button" className="lesson-open" onClick={() => setAba(id)}>
                  Abrir aula <span aria-hidden="true">→</span>
                </button>
              </article>
            ))}
          </div>
          <p className="lesson-note">
            Não precisa saber teoria antes: siga os passos em ordem e experimente os controles da própria aula.
          </p>
        </section>
      )}

      {aba === "harmonia" && (
        <>
        <h2>Aula 1 · Acordes e progressões</h2>
          <LessonGuide
            eyebrow="Siga estes passos antes de mexer no montador"
            title="Como montar uma progressão"
            introduction="Progressão é uma ordem de acordes que sustenta uma parte da música. Você não precisa adivinhar: primeiro escolhe o tom, depois combina acordes desse tom e organiza a ordem."
            steps={[
              { title: "Escolha a tonalidade", text: "O tom é o ponto de repouso da música. Escolha C (Dó) para seguir o exemplo abaixo. Ao mudar o tom, a sequência de demonstração se ajusta junto." },
              { title: "Leia o campo harmônico", text: "Em C maior, os acordes são C, Dm, Em, F, G, Am e Bdim. Os algarismos romanos são graus: I, ii, iii, IV, V, vi e vii°. Maiúsculas indicam acorde maior; minúsculas, menor; °, diminuto." },
              { title: "Experimente uma ordem conhecida", text: "I–V–vi–IV significa pegar o 1º, 5º, 6º e 4º acordes do campo. Em C isso vira C–G–Am–F. Use o botão ‘Usar I–V–vi–IV’ para preencher a sequência automaticamente." },
              { title: "Monte ou altere a sequência", text: "Cada botão com ‘+’ acrescenta aquele acorde ao final. A ordem dos cartões é a ordem em que os acordes entram na música. O ‘×’ remove uma posição; você pode ter até oito." },
              { title: "Estude e ouça cada acorde", text: "Clique no cartão de um acorde da sequência. A área de formas abaixo troca para esse acorde; escolha uma forma e pressione ‘Ouvir’ para comparar o som. Repita a progressão no seu instrumento, um acorde de cada vez." },
            ]}
          />
          <PrettyPanel>
            <SectionTitle
              eyebrow="Teoria que vira ação"
              title="Agora experimente os passos no montador"
            >
              Primeiro escolha o tom. Em seguida use o botão I–V–vi–IV para
              carregar o exemplo, ou acrescente acordes manualmente.
            </SectionTitle>
            <div className="roadmap-controls">
              <label>
                Tonalidade
                <select
                  value={chave}
                  onChange={(e) => selecionarTonalidade(e.target.value)}
                >
                  {CHAVES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <div className="lesson-control-group">
                <strong>Toque um acorde para estudar sua forma:</strong>
              <div className="roadmap-chip-list">
                {harmonia.map((item) => (
                  <button
                    key={item}
                    className={acorde === item ? "selecionado" : ""}
                    onClick={() => escolherAcorde(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              </div>
            </div>
            <div className="roadmap-suggestion">
              <strong>
                {PROGRESSOES.find((p) => p.acordes[0] === chave)?.nome ??
                  `I–V–vi–IV em ${chave}`}
              </strong>
              <span>
                {PROGRESSOES.find((p) => p.acordes[0] === chave)?.contexto ??
                  "Sequência pop comum calculada a partir do campo harmônico desta tonalidade."}
              </span>
            </div>
            <PrettyPanel>
              <SectionTitle
                eyebrow="Composição guiada"
                title="Rascunhe sua progressão"
              >
                Adicione acordes do campo harmônico, veja o grau de cada um e
                selecione qualquer posição para estudar sua forma e sonoridade.
              </SectionTitle>
              <div className="progression-builder">
                <div className="progression-builder-heading">
                  <strong>Acordes disponíveis em {chave}</strong>
                  <span>{progressao.length} de 8 posições</span>
                </div>
                <div className="roadmap-chip-list" aria-label={`Acordes do campo harmônico de ${chave}`}>
                  {harmonia.map((item, index) => (
                    <button
                      key={`${item}-${index}`}
                      type="button"
                      onClick={() => adicionarAcordeProgressao(item)}
                      disabled={progressao.length >= 8}
                      aria-label={`Adicionar ${item}, grau ${["I", "ii", "iii", "IV", "V", "vi", "vii°"][index]}`}
                    >
                      + {item} <small>{["I", "ii", "iii", "IV", "V", "vi", "vii°"][index]}</small>
                    </button>
                  ))}
                </div>
                <div className="progression-sequence" aria-label="Sua progressão">
                  {progressao.map((item, index) => {
                    const grau = harmonia.indexOf(item);
                    const graus = ["I", "ii", "iii", "IV", "V", "vi", "vii°"];
                    return (
                      <div className="progression-step" key={`${item}-${index}`}>
                        <button
                          type="button"
                          className="progression-chord"
                          onClick={() => escolherAcorde(item)}
                          aria-label={`Estudar acorde ${item}${grau >= 0 ? `, grau ${graus[grau]}` : ""}`}
                        >
                          <strong>{item}</strong>
                          <span>{grau >= 0 ? graus[grau] : "fora do campo"}</span>
                        </button>
                        <button
                          type="button"
                          className="progression-remove"
                          onClick={() => setProgressao((atual) => atual.filter((_, posicao) => posicao !== index))}
                          aria-label={`Remover ${item} da posição ${index + 1}`}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                  {!progressao.length && <span className="progression-empty">Adicione um acorde para começar.</span>}
                </div>
                <div className="progression-builder-actions">
                  <button type="button" className="pilula" onClick={usarProgressaoSugerida} disabled={harmonia.length < 6}>
                    Usar I–V–vi–IV em {chave}
                  </button>
                  <button
                    type="button"
                    className="pilula"
                    onClick={() => setProgressao([])}
                    disabled={!progressao.length}
                  >
                    Limpar sequência
                  </button>
                </div>
              </div>
            </PrettyPanel>
            <PrettyPanel>
              <h3>Formas alternativas de {acorde}</h3>
              <div className="voicing-list">
                {formasAcorde.map((item) => (
                  <button
                    key={item.nome}
                    className={voicing.nome === item.nome ? "selecionado" : ""}
                    onClick={() => setVoicing(item)}
                  >
                    <strong>{item.nome}</strong>
                    <span>{item.uso}</span>
                    <code>
                      {item.notas
                        .map((n) => n.replace(/[0-9]/g, ""))
                        .join(" · ")}
                    </code>
                  </button>
                ))}
                {!formasAcorde.length && (
                  <p className="lesson-note">Ainda não há desenho de braço cadastrado para {acorde}. Você pode ouvir a harmonia e continuar estudando a escala.</p>
                )}
              </div>
              <button
                className="link-botao"
                onClick={() =>
                  voicing ? tocarNotas(voicing.notas) : tocarAcorde(acorde)
                }
              >
                ▶ Ouvir {voicing?.nome ?? acorde}
              </button>
            </PrettyPanel>
          </PrettyPanel>
            <LessonGuide
              eyebrow="Aula extra · escalas"
              title="Como escolher uma escala para um acorde"
              introduction="Escala é um conjunto de notas; acorde é um conjunto menor de notas que define a harmonia do momento. A escala dá notas de ligação, mas as notas do acorde costumam soar mais estáveis."
              steps={[
                { title: "Escolha o acorde que está soando", text: "Use os cartões da tonalidade ou clique em um acorde da progressão. A escala deve ser pensada em relação à harmonia, não escolhida ao acaso." },
                { title: "Selecione uma cor de escala", text: "Maior é um ponto de partida claro para acordes maiores do tom; pentatônica menor e blues funcionam bem em contextos de rock/blues; dórica dá cor a muitos acordes menores. Use as descrições como orientação, não como regra absoluta." },
                { title: "Leia as notas exibidas", text: "As notas listadas são as disponíveis na tonalidade e no tipo selecionado. Toque devagar e perceba como cada nota se relaciona com o acorde escolhido." },
                { title: "Aponte para notas do acorde", text: "Comece e termine uma frase em uma nota do acorde (como tônica, terça ou quinta). Use outras notas da escala para chegar até ela." },
              ]}
            />
            <h2>Aplique a escala ao acorde</h2>
          <section className="roadmap-suggestion">
            <PrettyPanel>
              <h3>{escala.nome}</h3>
              <p className="subtitulo">{escala.dica}</p>
              <div className="roadmap-scale-picker">
                {ESCALAS_CONTEXTUAIS.map((item) => (
                  <button
                    key={item.tipo}
                    className={escala.tipo === item.tipo ? "selecionado" : ""}
                    onClick={() => setEscala(item)}
                  >
                    {item.nome}
                    <small>{item.contexto}</small>
                  </button>
                ))}
              </div>
              <p className="roadmap-notes">
                <strong>Notas em {chave}:</strong>{" "}
                {notas.join(" · ") || "Escolha uma escala de sete notas."}
              </p>
              <p>
                <strong>Combina com {acorde}:</strong> {sugestoes.join(" · ")}
              </p>
            </PrettyPanel>
          </section>
        </>
      )}

      {aba === "improviso" && (
        <>
          <h2>Aula 2 · Improvisação</h2>
          <LessonGuide
            eyebrow="Do acorde à frase"
            title="Como escolher notas para improvisar"
            introduction="Improvisar não é tocar notas aleatórias nem correr pela escala. Use o acorde como mapa: as notas dele soam estáveis; as outras notas da escala fazem a ligação."
            steps={[
              { title: "Escolha e ouça um acorde", text: "Selecione C, G, Am, F ou A7 e pressione ‘Ouvir base’. Cante ou toque a tônica (o nome do acorde) para sentir onde o som repousa." },
              { title: "Veja as notas-alvo", text: "A lista numerada sugere uma ordem. Comece pela tônica; a terça mostra se o acorde é maior ou menor; a quinta dá estabilidade. A sexta e a sétima acrescentam cor." },
              { title: "Pratique o arpejo", text: "‘Ouvir arpejo’ toca as notas do acorde uma a uma. Toque cada botão de nota, depois tente ligar tônica, terça e quinta com poucas notas da escala." },
              { title: "Faça uma frase curta e resolva", text: "Use um ritmo simples, deixe espaço e termine numa nota do acorde, especialmente a tônica, em um tempo forte. Repita mudando só o ritmo ou uma nota de cada vez." },
            ]}
          />
          <PrettyPanel>
            <SectionTitle
              eyebrow="Improvisação guiada"
              title={`Crie uma frase sobre ${acorde}`}
            >
              Comece pelas notas-alvo e conecte-as com a escala. A ideia é dar
              direção sem limitar sua criatividade.
            </SectionTitle>
            <div className="roadmap-controls">
              <label>
                Acorde
                <select
                  value={acorde}
                  onChange={(e) => escolherAcorde(e.target.value)}
                >
                  {["C", "G", "Am", "F", "A7"].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <button
                className="link-botao"
                onClick={() => tocarAcorde(acorde)}
              >
                ▶ Ouvir base
              </button>
            </div>
            <div className="roadmap-targets">
              {caminho.map((item, index) => (
                <span key={item} className={index === 0 ? "alvo" : ""}>
                  {index + 1}. {item}
                </span>
              ))}
            </div>
          </PrettyPanel>
          <section className="roadmap-two-columns">
            <PrettyPanel>
              <h3>Arpejo de {acorde}</h3>
              <p>
                Toque as notas do acorde em sequência para fazer o ouvido
                reconhecer a harmonia.
              </p>
              <div className="roadmap-note-row">
                {arpejo.map((item) => (
                  <button
                    key={item}
                    onClick={() => tocarNotas([`${item}4`], 0.55)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <button
                className="pilula"
                onClick={() =>
                  tocarNotas(
                    arpejo.map((item) => `${item}4`),
                    0.55,
                  )
                }
              >
                Ouvir arpejo
              </button>
            </PrettyPanel>
            <PrettyPanel>
              <h3>Sobreposições úteis</h3>
              <p>
                Escolha uma cor para sair do desenho básico sem perder o centro
                tonal.
              </p>
              <div className="roadmap-overlay-list">
                <div>
                  <strong>{acorde} →</strong>
                  <span>{sugestoes[0]} para começar</span>
                </div>
                <div>
                  <strong>Mais tensão →</strong>
                  <span>{sugestoes[1]} nas frases de passagem</span>
                </div>
                <div>
                  <strong>Resolver →</strong>
                  <span>volte para a tônica no tempo forte</span>
                </div>
              </div>
            </PrettyPanel>
          </section>
        </>
      )}

      {aba === "estilos" && (
        <>
          <h2>Aula 3 · Estilos e timbres</h2>
          <LessonGuide
            eyebrow="Ouça o contexto, não só o acorde"
            title="Como estudar um estilo musical"
            introduction="O mesmo acorde pode funcionar em muitos estilos. O que muda é o ritmo, a intensidade, a articulação e o timbre. Nesta aula, compare as escolhas descritas nos exemplos."
            steps={[
              { title: "Escolha o clima", text: "Decida o que quer comunicar (por exemplo: leve, pesado, íntimo ou dançante). O clima ajuda a escolher ritmo e dinâmica antes de pensar em equipamento." },
              { title: "Leia o padrão rítmico", text: "Observe a descrição ‘Padrão’ de cada estilo. Identifique se a base usa acordes abertos, power chords, dedilhado, shuffle ou batidas regulares." },
              { title: "Mude uma coisa por vez", text: "Toque a mesma progressão com uma batida simples; depois troque apenas o ritmo ou a articulação. Compare como a sensação muda sem alterar os acordes." },
              { title: "Ajuste timbre e pegada", text: "Só depois considere captador, ganho, compressão, delay ou reverb. A mão direita, o volume e o ataque também mudam o timbre; equipamento não substitui a execução." },
            ]}
          />
          <SectionTitle
            eyebrow="Especialização"
            title="Compare os quatro exemplos"
          >
            Use estilo, timbre e equipamento como escolhas musicais, não como
            uma lista de compras.
          </SectionTitle>
          <section className="roadmap-grid roadmap-grid-2">
            {ESTILOS.map((item) => (
              <article className="roadmap-card estilo-card" key={item.nome}>
                <h3>{item.nome}</h3>
                <p>
                  <strong>Padrão:</strong> {item.padrão}
                </p>
                <p>
                  <strong>Timbre:</strong> {item.timbre}
                </p>
                <p>
                  <strong>Equipamento e pegada:</strong> {item.equipamento}
                </p>
              </article>
            ))}
          </section>
          <PrettyPanel>
            <h3>Conteúdo avançado por camadas</h3>
            <div className="roadmap-grid roadmap-grid-3">
              {AVANCADO.map((item) => (
                <div key={item.titulo} className="roadmap-mini">
                  <strong>{item.titulo}</strong>
                  <span>{item.texto}</span>
                </div>
              ))}
            </div>
          </PrettyPanel>
        </>
      )}

      {aba === "ouvido" && (
        <>
          <h2>Aula 4 · Treino de ouvido</h2>
          <LessonGuide
            eyebrow="Ouça, compare, responda"
            title="Como reconhecer um acorde pelo som"
            introduction="O objetivo não é acertar por sorte: repita o áudio, observe a sensação de repouso e compare com o timbre maior ou menor. Este exercício de três notas roda no seu navegador."
            steps={[
              { title: "Toque o exemplo", text: "Pressione ‘Tocar exemplo’ e escute as três notas. Se precisar, toque novamente; não há limite de tentativas." },
              { title: "Procure a sensação do acorde", text: "Maior costuma soar mais aberto/brilhante; menor, mais fechado/sombrio. Cante a nota que parece repousar para estimar a tônica." },
              { title: "Escolha uma resposta", text: "Toque C, Am, G ou F. O retorno diz se acertou; se não, revela a resposta para você aprender com a comparação." },
              { title: "Repita e aumente a dificuldade", text: "Use ‘Próximo exemplo’ para ouvir outra tríade. Depois tente cantar a tônica antes de olhar as opções e confirme no seu instrumento." },
            ]}
          />
          <PrettyPanel>
            <SectionTitle
              eyebrow="Tirar música de ouvido"
              title="Ouça três notas e encontre a tônica"
            >
              O exercício é local: nenhum áudio é enviado. Toque o exemplo
              quantas vezes quiser, compare e escolha.
            </SectionTitle>
            <div className="ear-training">
              <button
                className="ear-play"
                onClick={() => tocarNotas(audioOuvido.notas, 0.7)}
              >
                ▶ Tocar exemplo
              </button>
              <div className="ear-options">
                {["C", "Am", "G", "F"].map((item) => (
                  <button key={item} onClick={() => responderOuvido(item)}>
                    {item}
                  </button>
                ))}
              </div>
              <p
                className={
                  feedbackType === "positive"
                    ? "sucesso"
                    : "" + feedbackType === "negative"
                      ? " sem-sucesso"
                      : ""
                }
              >
                {feedback || "Escolha uma resposta depois de ouvir."}
              </p>
              <button
                className="pilula"
                onClick={() => {
                  setOuvido((ouvido + 1) % TREINO_OUVIDO.length);
                  setFeedback("");
                  setFeedbackType("");
                }}
              >
                Próximo exemplo
              </button>
            </div>
          </PrettyPanel>
          <section className="roadmap-grid roadmap-grid-3">
            {[
              "Iniciante: reconhecer tônica",
              "Intermediário: reconhecer qualidade",
              "Avançado: descobrir a progressão",
            ].map((item, index) => (
              <article className="roadmap-card" key={item}>
                <span className="roadmap-number">0{index + 1}</span>
                <h3>{item}</h3>
                <p>
                  {index === 0
                    ? "Comece com tríades lentas e cante a nota que parece repousar."
                    : index === 1
                      ? "Compare maior e menor antes de acelerar o exercício."
                      : "Anote os graus e confirme no instrumento depois."}
                </p>
              </article>
            ))}
          </section>
        </>
      )}

      {aba === "composicao" && (
        <>
          <h2>Aula 5 · Criar sua música</h2>
          <LessonGuide
            eyebrow="Da ideia à primeira demo"
            title="Um método para compor a sua própria música"
            introduction="Compor é tomar uma série de decisões pequenas. Não é preciso começar pela letra nem saber teoria avançada. Faça uma versão simples primeiro; depois refine o que não comunica a ideia que você queria."
            steps={[
              { title: "Escolha uma ideia central", text: "Resuma em uma frase o tema, a imagem ou a emoção que quer transmitir. Anote palavras-chave e uma frase curta que poderia virar o gancho do refrão; escreva com sua própria voz." },
              { title: "Encontre um tom e uma região confortável", text: "Toque ou cante algumas notas e escolha uma tonalidade em que a melodia caiba sem esforço. A tônica é a nota de repouso. Se compõe no violão, comece por uma tonalidade com acordes que você consegue tocar." },
              { title: "Monte a harmonia", text: "Escolha três ou quatro acordes que combinem, por exemplo I–V–vi–IV. Na aula anterior, selecione o tom, carregue esse padrão e toque a sequência em loop. Troque um acorde por vez e note como muda a emoção." },
              { title: "Defina pulso, andamento e groove", text: "Comece com um compasso simples (por exemplo, 4/4) e um andamento que permita cantar a ideia. Bata o pulso com a mão; escolha batida, dedilhado, groove ou silêncio antes de adicionar produção." },
              { title: "Crie uma melodia curta", text: "Cante ou toque uma célula de poucas notas e grave um rascunho. Faça notas do acorde soarem nos tempos fortes; use notas da escala para ligar uma ideia à outra. Repita o motivo e mude o final para criar resposta e desenvolvimento." },
              { title: "Organize as seções", text: "Dê funções diferentes às partes: verso apresenta, pré-refrão cria expectativa, refrão resume o gancho, ponte oferece contraste. Nem toda música precisa de todas as partes; deixe a repetição ajudar a memorizar." },
              { title: "Escreva, arranje e revise", text: "Se houver letra, ajuste sílabas e acentos às notas fortes, sem encher todos os espaços. Depois grave uma demo simples de voz e instrumento; escute, anote uma mudança de cada vez e mantenha o que serve à ideia central." },
            ]}
          />
          <section className="lesson-example">
            <span className="eyebrow">Exemplo didático · ponto de partida, não uma música pronta</span>
            <h3>Como transformar decisões em um rascunho</h3>
            <ol>
              <li><strong>Ideia:</strong> uma sensação de recomeço; anote imagens e palavras que sejam suas.</li>
              <li><strong>Tom e harmonia:</strong> C maior, I–V–vi–IV = C–G–Am–F, um acorde por compasso.</li>
              <li><strong>Pulso:</strong> 4/4 em andamento confortável; comece com batida leve no verso.</li>
              <li><strong>Melodia:</strong> cante um motivo curto; sobre C, teste C, E ou G como notas estáveis. Quando chegar a G, experimente G, B ou D e crie sua própria ligação entre elas.</li>
              <li><strong>Forma:</strong> faça um verso mais contido e repita o motivo com ritmo ou alcance maior no refrão; crie contraste na ponte se a canção pedir.</li>
              <li><strong>Revisão:</strong> grave uma demo e pergunte: o gancho aparece? A melodia é cantável? Cada seção acrescenta algo? Mude apenas o que não funciona.</li>
            </ol>
          </section>
          <div className="lesson-next-step">
            <strong>Seu primeiro exercício</strong>
            <p>Complete as frases: “Quero falar sobre…”, “quero que soe…”, “vou testar os acordes…”. Com essas três decisões, grave um rascunho de 30 segundos e depois revise.</p>
          </div>
        </>
      )}
    </div>
  );
}
